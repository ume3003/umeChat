/**
 * Module dependencies.
 */
var		so	= require('./shareObj')	,
		db	= require('./db'),
		io,
		chatObject,
		users		= {},
		rooms		= {}			//{ roomId : {joinmember array}}
	;
exports.init = function(){
	var	sKey	= so.app.get('secretKey'),
		csKey	= so.app.get('cookieSessionKey');

	io = require('socket.io').listen(so.server,{log : true});
	so.io = io;
	io.set('authorization',function(handshakeData,callback){
		if(handshakeData.headers.cookie){
			var sessionID,// cookieを取得
				cookie = require('cookie').parse(decodeURIComponent(handshakeData.headers.cookie));

			cookie = so.connect.utils.parseSignedCookies(cookie,sKey);
			sessionID = cookie[csKey];
			console.log('in store sessionID ',sessionID);
			so.store.get(sessionID,function(err,session){
				if(err){
					callback(err.message,false);
				}
				else if(!session){
					callback('session not found',false);
				}
				else if(!session.userID){
					callback('session userID notFound',false);
				}
				else{
		
					handshakeData.cookie = cookie;
					handshakeData.sessionID = sessionID;
					handshakeData.sessionStore = so.store;
					handshakeData.session = new so.Session(handshakeData,session);

					callback(null,true);
				}
			});
		}
		else{
			callback('cookie not found',false);
		}
	});
// user 
//		displayName
//		emails[0].value
//		name.familyName name.givenName
//		identifier
//		type
//		id
	chatObject = io.sockets.on('connection',function(socket){
		var user = socket.handshake.session.user,
			userID = socket.handshake.session.userID,
			sessionReloadIntervalID,
			enterRoom,
			leaveRoom,
			notifyMessage;
		

		console.log('init ',user.id);
		/* 初期化 */
		// 前回ログアウト時からの通知メッセージの取得
		db.Notify.findMyNotify(user,function(notifies){
			socket.emit('gotNotifies',notifies);
		});
		// ssIdのキャッシュ
		so.ssIds[user.id] = socket.id;
		// ユーザーオブジェクトのキャッシュ
		users[user.id] = user;
		// サーバクッキーの更新のスケジューリング
		sessionReloadIntervalID = setInterval(function(){
			socket.handshake.session.reload(function(){
				socket.handshake.session.touch().save();
			});
		},60 * 2 * 1000);
		/***********************
		*	connect の際の処理
		* 初期化ここまで      
		************************/
		/*
		 * ヘルパ関数
		 */
		/*
		 * 通知メッセージを送信します
		 */
		notifyMessage = function(msgType,toUser,msg){
			var id = so.ssIds[toUser];
			if(id !== undefined){
				io.sockets.socket(id).emit(msgType,msg);
			}
			else{
				console.log('target doesnt login');
			}
		};
		/* チャットルームに入室し、ルームにIDを登録
		 */
		enterRoom = function(roomId,userId,socket){
			var roomMember,
				userRoom;
			socket.join(roomId);
			if(rooms[roomId] === undefined){
				rooms[roomId] = {};
			}
			roomMember = rooms[roomId];
			if(roomMember[userId] === undefined){
				roomMember[userId] = userId;
			}
			console.log('users',users,'userId',userId);
			if(users[userId] === undefined){
				console.log('err user cache is null');
			}
			if(users[userId].room === undefined){
				users[userId].room = {};
			}
			userRoom = users[userId].room;
			userRoom[roomId] = roomId;
			/*
			for(var i = 0;i < rooms[roomId].length;i++){
				if(rooms[roomId][i] === userId){
					return;
				}
			}
			rooms[roomId].push(userId);
			*/	
		};
		/*
		 * チャットルームから退室する。ルームIDを削除
		 */
		leaveRoom = function(roomId,userId,socket){
			if(rooms[roomId] !== undefined && rooms[roomId][userId] !== undefined){
				delete rooms[roomId][userId];
				/*
				for(var i = 0; i < rooms[roomId].length;i++){
					if(rooms[roomId][i] === userId){
						rooms[roomId].slice(i,1);
						break;
					}
				}
				*/
			}
			userRoom = users[userId].room;
			if(userRoom === undefined && userRoom[roomId] !== undefined){
				delete userRoom[roomId];
			}
			console.log('leaveRoom ',rooms[roomId]);
			socket.leave(roomId);
		};
		/*
		 * 自分の情報を送信
		 */
		socket.on('getMyInfo',function(mes){
			socket.emit('gotMyInfo',user);
		});
		/*
		 *  通知をよんだ
		 */
		socket.on('readNotify',function(mes){
			db.readNotify(user,mes.article,function(success){
				socket.emit('redNotify',{success:success});
			});
		});
		/*
		 *フレンド関連
		 */
		socket.on('getInviteList',function(msg){
			db.User.getInviteList(user,{$in:['0','1','9']},function(list){
				socket.emit('gotInviteList',{invite:list});
			});
		});
		socket.on('getFriendList',function(){
			db.User.getFriendList(user,function(friends){
				socket.emit('gotFriendList',{friends:friends});	// 知人リストの通知
			});
		});

		socket.on('requestFriend',function(msg){
			db.User.addFriend(user,msg.tgt,function(you){
				db.Notify.requestNotify(user.id,you.user_id,function(notify){
					notifyMessage('requestComming',you.user_id,{from:user.id,msg:'requested'});
					socket.emit('requestedFriend',{you:you,tgt:msg.tgt});
				});
			});
		});

		socket.on('approveFriend',function(msg){
			db.User.approveFriend(user,msg.info,function(success){
				db.Notify.approveNotify(user.id,msg.info.user_id,function(notify){
					notifyMessage('approveComming',msg.info.user_id,{from:user.id,msg:'approved'});
					socket.emit('approvedFriend',{success:success});
				});
			});
		});
		socket.on('cancelFriend',function(msg){
			db.User.cancelFriend(user,msg.info,function(success){
				socket.emit('cancelledFriend',{success:success});
			});
		});


		socket.on('sayChat',function(msg){	
			db.Room.sayChat(user.id,msg.roomId,msg.msg,'0',function(chat){
				if(chat !== undefined){
					// ルームを開いているメンバーに直接送信
					chatObject.to(msg.roomId).emit('someoneSaid',chat);
					db.Room.getLeftRoomMember(msg.roomId,rooms[msg.roomId],function(member){
						console.log('leftmember ',member);
						if(member !== undefined){
							for(var i = 0; i < member.length;i++){
								(function(_i){			// 開いていない人にはNotifyを保存
									db.Notify.chatNotify(msg.roomId,member[_i],chat.id,chat.lastAccess,function(notify){
										console.log('chatNotify',notify,_i);
										notifyMessage('sayNotify',member[_i],{roomId:msg.roomId,chatId:chat.id,notifyId:notify.id});
									});
								})(i);
							}
						}
						socket.emit('saidChat',chat);
					});
				}
				else{
					socket.emit('saidChat',undefined);
				}
			});
		});
		/*
		 * msg.roomId msg.tgtUser
		 *
		 */
		socket.on('inviteRoom',function(msg){
			// DBに記録する
			db.Notify.inviteNotify(user.id,msg.tgtId,msg.roomId,function(notify){
				notifyMessage('invited',msg.tgtId,{roomId:msg.roomId,notifyId:notify.id});
			});
		});
		/*
		 * msg.roomId
		 * 永続的にチャットルームにはいる
		 * 同時にチャットルームを開く
		 */
		socket.on('joinRoom',function(msg){
			db.joinRoom(user,msg.roomId,function(success){
				if(success){
					enterRoom(msg.roomId,user.id,socket);
					chatObject.to(roomId).emit('newoneJoined',{id:user.id});		// 入室したルームにブロードキャスト
				}
				socket.emit('joinedRoom',{success:success});				// 自分自身に入室成功を返す
			});
		});
		/*
		 * 永続的にチャットルームからぬける
		 * 同時にチャットルームを閉じる
		 */
		socket.on('leaveRoom',function(msg){
			db.leaveRoom(msg,msg.roomId,function(success){
				if(success){
					leaveRoom(msg.roomId,user.id,socket);
					chatObject.to(roomId).emit('someoneLeft',{id:user.id});		// 退出したルームにブロードキャスト
				}
				socket.emit('leftRoom',{success:success});					// 自分自身に退出成功を返す
			});
		});
		/*
		 * チャットルームを開く。フラグがたち、以後メッセージが配信される
		 */
		socket.on('openRoom',function(msg){
			db.Room.findRoomShort(msg.roomId,function(room){
				if(room !== undefined){
					enterRoom(room.id,user.id,socket);
				}
				socket.emit('openedRoom',{room:room});
			});
		});
		/*
		 *	チャットルームを閉じる。以後、メッセージは通知に変わる
		 */
		socket.on('closeRoom',function(msg){
			db.Room.findRoomShort(msg.roomId,function(room){
				if(room){
					leaveRoom(msg.roomId,user.id,socket);
				}
				socket.emit('closedRoom',{room:room});
			});
		});
		/*
		 * チャットルームを作り、永続的に入る
		 */
		socket.on('createRoom',function(msg){
			var roomInfo = {roomOwner : user.id,roomName : msg,member : [user.id],mode:1};

			db.createRoom(user,roomInfo,function(room){
				if(room !== undefined){
					enterRoom(room.id,user.id,socket);
				}
				socket.emit('CreatedRoom',{room:room});
			});
		});
		socket.on('getRoomList',function(msg){
			db.Room.getJoinRoomList(user,function(roomlist){
				socket.emit('gotRoomList',roomlist);
			});
		});
		socket.on('getLog',function(msg){
			db.Room.getLog(user,msg.roomId,msg.lastAccess,msg.count,function(logs){
				socket.emit('gotLog',logs);
			});
		});
		socket.on('getUnreadChat',function(msg){
			db.Notify.findUnreadChatNotify(user,msg.roomId,function(notifies){
				var _notify ,
					docs = [],
					notifyIds = [],
					defCnt = notifies.length > 10 ? notifies.length - 10 : 0 ;
				if(notifies.length === 0){
					socket.emit('gotUnreadChat',{notify:undefined,defCount:defCnt});
				}
				for(var i = 0; i < 10;i++){// 未読をループ
					if(i < notifies.length){
						(function(_i,notify){
							db.Room.getOneChat(user,msg.roomId,notify.param,function(chatObj){	// メッセージを取得
								var chat = chatObj !== undefined ?chatObj[0].chat : undefined;
								if(chat !== undefined){	// 既読数インクリメントしてルームへキャスト
									docs.push(chat);
									db.Room.incChat(user,msg.roomId,chat._id,function(success){
										if(success){
											chatObject.to(msg.roomId).emit('chatRead',{chatId:chat._id});
										}
									});
									db.Notify.readNotify(user,notify._id,function(success){
										if(_i == 9 || _i == notifies.length -1){	// 既読
											if(success){
												socket.emit('gotUnreadChat',{notify:docs,defCount:defCnt});
											}
										}
									});
								}
							});
						})(i,notifies[i]);
					}
				}
			});
		});
		/*
		 * １対１チャットはDB上は即時join
		 */
		socket.on('startChatTo',function(msg){
			db.startChatTo(user,msg.tgtId,function(room){
				if(room !== undefined){
					notifyMessage('startChatWith',msg.tgtId,room);
				}
				socket.emit('startedChatTo',room);		// 自分に
			});
		});

		/*
		 * 切断。
		 */
		socket.on('disconnect',function(msg){
			var userRoom,
				room;
			console.log('disconnect ',msg,user.id);
			console.log(users[user.id]);
			console.log('rooms',rooms);
			clearInterval(sessionReloadIntervalID);
			if(users[user.id] !== undefined){
				userRoom = users[user.id].room;
				if(userRoom !== undefined){// メモリ上のルームからの退出
					for(room in userRoom){
					console.log('before ' ,room,rooms[room]);
						delete rooms[room][user.id];
					console.log('after ',room,rooms[room]);
					}
				}
			}
			db.User.logout(user,function(success){
				// TODO:通知処理変更
				console.log(success);
			});
			delete so.ssIds[user.id];
			console.log('delete ',user.id,users[user.id]);
			delete users[user.id];
			socket.broadcast.emit('logout',user.id);
		});
	});
};
