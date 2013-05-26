/**
 * Module dependencies.
 */
var		so	= require('./shareObj')	,
		db	= require('./db'),
		ps	= require('./passport'),
		io,
		chatObject;
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
					console.log('------------------------------');
					console.log('auth success ',sessionID,'---',session.user.id);
					console.log('------------------------------');
					so.pushUser(sessionID,session.user);
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
			sessionReloadIntervalID,
			pushRoom,
			pullRoom,
			enterRoom,
			leaveRoom,
			notifyMessage;
		

		console.log('init ');
		/* 初期化 */
		// 前回ログアウト時らの通知メッセージの取得
		db.Notify.findMyNotify(user,function(notifies){
			socket.emit('gotNotifies',notifies);
		});
		so.pushSocketId(user.id,socket.id);
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
		/* チャットルームに入室し、ルームにIDを登録
		 */
		pushRoom = function(roomId,_user){
			if(_user !== undefined){
				if(_user.room === undefined){
					_user.room = {};
				}
				_user.room[roomId] = roomId;
			}
		};
		pullRoom = function(roomId,_user){
			if(_user !== undefined && _user.room !== undefined && _user.room[roomId] !== undefined){
				delete _user.room[roomId];
			}
		};
		enterRoom = function(roomId,_user,socket){
			socket.join(roomId);
			pushRoom(roomId,_user);
			so.pushRoomMember(roomId,_user.id);
		};
		/*
		 * チャットルームから退室する。ルームIDを削除
		 */
		leaveRoom = function(roomId,_user,socket){
			console.log('-----------------------');
			console.log('leaveRoom ',roomId,_user.id);
			console.log('-----------------------');
			so.pullRoomMember(roomId,_user.id);
			pullRoom(roomId,_user.id);
			socket.leave(roomId);
		};
		/*
		 * 通知メッセージを送信します
		 */
		notifyMessage = function(msgType,toUser,msg){
			var id = so.getSocketId(toUser);
			if(id !== undefined){
				io.sockets.socket(id).emit(msgType,msg);
			}
			else{
				console.log('target doesnt login');
			}
		};
		/*
		 * 自分の情報を送信
		 */
		socket.on('getMyInfo',function(mes){
			var _user = socket.handshake.session.user,
				uData = {};
			uData.id = _user.id;
			db.User.findUser({_id:_user.id},function(uData){
				socket.emit('gotMyInfo',uData);
			});
		});
		/*
		 *  通知をよんだ
		 */
		socket.on('readNotify',function(mes){
			var _user = socket.handshake.session.user;
			db.readNotify(_user,mes.article,function(success){
				socket.emit('redNotify',{success:success});
			});
		});
		/*
		 *フレンド関連
		 */
		socket.on('getInviteList',function(msg){
			var _user = socket.handshake.session.user;
			db.User.getInviteList(_user,{$in:['0','1','9']},function(list){

				socket.emit('gotInviteList',{invite:list});
			});
		});
		socket.on('getFriendList',function(){
			var _user = socket.handshake.session.user;
			db.User.getFriendList(_user,function(friends){
				socket.emit('gotFriendList',{friends:friends});	// 知人リストの通知
			});
		});

		socket.on('requestFriend',function(msg){
			var _user = socket.handshake.session.user;
			db.User.addFriend(_user,msg.tgt,function(you){
				if(you !== undefined){
					db.Notify.requestNotify(_user.id,you.user_id,function(notify){
						notifyMessage('requestComming',you.user_id,{from:_user.id,msg:'requested'});
						socket.emit('requestedFriend',{you:you,tgt:msg.tgt});
					});
				}
				else{
					socket.emit('requestedFriend',{you:you,tgt:msg.tgt});
				}
			});
		});

		socket.on('approveFriend',function(msg){
			var _user = socket.handshake.session.user;
			db.User.approveFriend(_user,msg.info,function(success){
				db.Notify.approveNotify(_user.id,msg.info.user_id,function(notify){
					notifyMessage('approveComming',msg.info.user_id,{from:_user.id,msg:'approved'});
					socket.emit('approvedFriend',{success:success});
				});
			});
		});
		socket.on('cancelFriend',function(msg){
			var _user = socket.handshake.session.user;
			db.User.cancelFriend(_user,msg.info,function(success){
				socket.emit('cancelledFriend',{success:success});
			});
		});


		socket.on('sayChat',function(msg){	
			var _user = socket.handshake.session.user;
			db.Room.sayChat(_user.id,msg.roomId,msg.msg,'0',function(chat){
				if(chat !== undefined){
					// ルームを開いているメンバーに直接送信
					chatObject.to(msg.roomId).emit('someoneSaid',chat);
					db.Room.getLeftRoomMember(msg.roomId,so.getRoom(msg.roomId),function(member){
						if(member !== undefined){
							for(var i = 0; i < member.length;i++){
								(function(_i){			// 開いていない人にはNotifyを保存
									db.Notify.chatNotify(msg.roomId,member[_i],chat.id,chat.lastAccess,function(notify){
										notifyMessage('sayNotify',member[_i],{roomId:msg.roomId,chatId:chat.id,notifyId:notify.id,body:chat.body,lastAccess:chat.lastAccess});
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
		socket.on('getInvitedRoomList',function(msg){
			var _user = socket.handshake.session.user;	// DBに記録する
			console.log('getInvitedRoomList',_user);
			db.invitedRoomList(_user,function(list){
				socket.emit('gotInvitedRoomList',list);
			});
		});
		socket.on('inviteRoom',function(msg){
			var _user = socket.handshake.session.user;	// DBに記録する
			// TODO: ユーザーテーブルに記述済みかチェックし、してなかったら記述
			db.inviteRoom(msg.tgtId,msg.roomId,function(success){
				if(success){
					db.Notify.inviteNotify(_user.id,msg.tgtId,msg.roomId,function(notify){
						notifyMessage('invited',msg.tgtId,{roomId:msg.roomId,notifyId:notify.id});
						socket.emit('invitedRoom',{success:true});
					});
				}
				else{
					socket.emit('invitedRoom',{success:false});
				}
			});
		});
		/*
		 * msg.roomId
		 * 永続的にチャットルームにはいる
		 * 同時にチャットルームを開く
		 */
		socket.on('joinRoom',function(msg){
			var _user = socket.handshake.session.user;
			db.joinRoom(_user,msg.roomId,function(success){
				if(success){
					enterRoom(msg.roomId,_user,socket);
					chatObject.to(msg.roomId).emit('newoneJoined',{id:_user.id});		// 入室したルームにブロードキャスト
				}
				socket.emit('joinedRoom',{success:success});				// 自分自身に入室成功を返す
			});
		});
		/*
		 * 永続的にチャットルームからぬける
		 * 同時にチャットルームを閉じる
		 */
		socket.on('leaveRoom',function(msg){
			var _user = socket.handshake.session.user;
			db.leaveRoom(user,msg.roomId,function(success){
				if(success){
					leaveRoom(msg.roomId,_user,socket);
					chatObject.to(msg.roomId).emit('someoneLeft',{id:_user.id});		// 退出したルームにブロードキャスト
				}
				socket.emit('leftRoom',{success:success});					// 自分自身に退出成功を返す
			});
		});
		/*
		 * チャットルームを開く。フラグがたち、以後メッセージが配信される
		 */
		socket.on('openRoom',function(msg){
			var _user = socket.handshake.session.user;
			db.Room.findRoomShort(msg.roomId,function(room){
				if(room !== undefined){
					enterRoom(room.id,_user,socket);
				}
				socket.emit('openedRoom',{room:room});
			});
		});
		/*
		 *	チャットルームを閉じる。以後、メッセージは通知に変わる
		 */
		socket.on('closeRoom',function(msg){
			console.log('=========================');
			console.log('closeRoom ',msg);
			console.log('=========================');
			var _user = socket.handshake.session.user;
			db.Room.findRoomShort(msg.roomId,function(room){
				if(room){
					leaveRoom(msg.roomId,_user,socket);
				}
				socket.emit('closedRoom',{room:room});
			});
		});
		/*
		 * チャットルームを作り、永続的に入る
		 */
		socket.on('createRoom',function(msg){
			var _user = socket.handshake.session.user,
				roomInfo = {roomOwner : _user.id,roomName : msg.name,member : [_user.id],mode:1};

			db.createRoom(_user,roomInfo,function(room){
				if(room !== undefined){
					enterRoom(room.id,_user,socket);
				}
				socket.emit('createdRoom',{room:room});
			});
		});
		socket.on('getRoomList',function(msg){
			var _user = socket.handshake.session.user;
			db.Room.getJoinRoomList(_user,function(roomlist){
				socket.emit('gotRoomList',roomlist);
			});
		});
		socket.on('getLog',function(msg){
			var _user = socket.handshake.session.user;
			console.log('-----',msg.lastAccess);
			db.Room.getLog(_user,msg.roomId,msg.lastAccess,msg.count,function(logs){
				socket.emit('gotLog',logs);
			});
		});
		socket.on('getUnreadChat',function(msg){
			var _user = socket.handshake.session.user;
			db.Notify.findUnreadChatNotify(_user,msg.roomId,function(notifies){
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
							console.log(_i,notify);
							db.Room.getOneChat(_user,msg.roomId,notify.param,function(chatObj){	// メッセージを取得
								var chat = chatObj !== undefined ?chatObj[0].chat : undefined;
								if(chat !== undefined){	// 既読数インクリメントしてルームへキャスト
									// docs.push(chat);
									console.log(_i,chat);
									docs[_i] = chat;
									db.Room.incChat(_user,msg.roomId,chat._id,function(success){
										if(success){
											chatObject.to(msg.roomId).emit('chatRead',{chatId:chat._id});
										}
									});
									db.Notify.readNotify(_user,notify._id,function(success){
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
			var _user = socket.handshake.session.user;
			db.startChatTo(_user,msg.tgtId,function(mes){
				if(mes.room !== undefined && mes.create === true){
					notifyMessage('startChatWith',msg.tgtId,mes.room);
				}
				socket.emit('startedChatTo',mes.room);		// 自分に
			});
		});

		/*
		 * 切断。
		 */
		socket.on('disconnect',function(msg){
			var _user = socket.handshake.session.user,
				room;
			clearInterval(sessionReloadIntervalID);
			console.log('disconnect ',msg,_user.id);
			
			if(_user !== undefined && _user.room !== undefined){
				for(room in _user.room){
					so.pullRoomMember(room,_user.id);
				}
				delete _user.room;
			}
			db.User.logout(_user,function(success){
				// TODO:通知処理変更
				console.log(success);
			});
			socket.broadcast.emit('logout',_user.id);
			so.pullSocketId(_user.id);
			so.pullUser(_user.id);
		});
	});
};
