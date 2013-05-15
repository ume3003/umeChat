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
exports.init = function()
{
	var 
		sKey	= so.app.get('secretKey'),
		csKey	= so.app.get('cookieSessionKey');
	io = require('socket.io').listen(so.server,{log : true});
	so.io = io;
	io.set('authorization',function(handshakeData,callback){
	if(handshakeData.headers.cookie){
	// cookieを取得
		var sessionID,
			cookie = require('cookie').parse(decodeURIComponent(handshakeData.headers.cookie));

		cookie = so.connect.utils.parseSignedCookies(cookie,sKey);
		sessionID = cookie[csKey];
		console.log('in store sessionID ',sessionID);
		so.store.get(sessionID,function(err,session){
			console.log('in store',session.userID);
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
	/*
	 *	connect の際の処理
	 *	socket.idのメモリキャッシュ；最終的にはRedisにいれる
	 *	userのキャッシュ　最終的にはRedisにいれる（でも必要？）
	 *	cookie の定期更新
	 */
	// 前回ログアウト時からの通知メッセージの取得
	db.Notify.findMyNotify(user,function(notifies){
		console.log('got notify ',notifies);
		if(notifies !== undefined){
			for(var i = 0;i < notifies.length;i++){
				socket.emit('gotNotify',notifies);
			}
		}
	});
	// ssIdのキャッシュ
	so.ssIds[user.id] = socket.id;
	// ユーザーオブジェクトのキャッシュ
	users[userID] = user;
	// サーバクッキーの更新のスケジューリング
	sessionReloadIntervalID = setInterval(function(){
		socket.handshake.session.reload(function(){
			socket.handshake.session.touch().save();
		});
	},60 * 2 * 1000);

	/*
	 * ヘルパ関数
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
	enterRoom = function(roomId,userId,socket){
		console.log('enterRoom',roomId);
		socket.join(roomId);
		if(rooms[roomId] === undefined){
			rooms[roomId] = [];
		}
		for(var i = 0;i < rooms[roomId].length;i++){
			if(rooms[roomId][i] === userId){
				return;
			}
		}
		rooms[roomId].push(userId);
		
	};
	leaveRoom = function(roomId,userId,socket){
		console.log('leaveRoom ',rooms[roomId]);
		if(rooms[roomId] !== undefined){
			for(var i = 0; i < rooms[roomId].length;i++){
				if(rooms[roomId][i] === userId){
					rooms[roomId].slice(i,1);
					break;
				}
			}
		}
		console.log('leaveRoom ',rooms[roomId]);
		socket.leave(room.id);
	};
	/*
	 * ここから作り直し
	 */
	socket.on('getMyInfo',function(mes){
		socket.emit('gotMyInfo',user);
	});
	/*
	 *  通知
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
			// 開いていない人にはNotifyを保存
			db.Notify.approveNotify(user.id,msg.info.user_id,function(notify){							
				// ログインしてるならDNを送信
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


	/*
	 * あとで治す
	 * チャットを各ユーザーごとの情報として保存。
	 * 異なる端末でログインしても、メッセージが読める必要がある
	 * 
	 * ver 0.02
	 * ログインしていない場合、ルームチャットがあったら通知メッセージを作成し、DBに保存する
	 * 通知メッセージはルーム、メッセージ数、最新メッセージ、最新メッセージ日時を保存
	 * ログイン時、通知を取得し、ルームリストに表示
	 * ログイン時、未JOINのチャットは通知メッセージをDBにいれ、クライアントに送信
	 * ルームを開いた段階で、未受信のログを取得し、ルームにJOINする
	 * JOINしたら、ログの取得と、通知メッセージをDBから削除する
	 * ルームを閉じたら、LEAVEし、チャットはDBに保存、通知のみ行う
	 * ログアウトした場合、通知をDBに保存する
	 * チャットは、JOINメンバーには即時送信し、非JOINメンバーには即時通知、非ログインメンバーには通知をDBへ
	 * 1　メンバー　chat + 送信
	 * 2 非JOIN		chat + DirectNotify + NotifyDB
	 * 3 非LOGIN	chat + NotifyDB
	 */
	socket.on('sayChat',function(msg){	// TODO:ここでルームチェックとルームへのチャットデータの登録を行う
		console.log('get chat ',msg);
		db.Room.sayChat(user.id,msg.roomId,msg.msg,'0',function(chat){
			if(chat !== undefined){
				// ルームを開いているメンバーに直接送信
				console.log('say ',rooms[msg.roomId]);
				chatObject.to(msg.roomId).emit('someoneSaid',{uID:user.id,msg : msg.msg,roomId:msg.roomId});
				db.Room.getLeftRoomMember(msg.roomId,rooms[msg.roomId],function(member){
					if(member !== undefined){
						for(var i = 0; i < member.length;i++){
							// 開いていない人にはNotifyを保存
							db.Notify.chatNotify(msg.roomId,member[i],chat.id,chat.lastAccess,function(notify){							
								// ログインしてるならDNを送信
								notifyMessage('someoneSay',member[i],{roomId:msg.roomId,chatId:chat.id,notifyId:notify.id});
							});
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
		// tgtにDMを送る
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
			}
			chatObject.to(roomId).emit('newoneJoined',{id:user.id});		// 入室したルームにブロードキャスト
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
			}
			chatObject.to(roomId).emit('someoneLeft',{id:user.id});		// 退出したルームにブロードキャスト
			socket.emit('leftRoom',{success:success});					// 自分自身に退出成功を返す
		});
	});
	/*
	 * チャットルームを開く。フラグがたち、以後メッセージが配信される
	 */
	socket.on('openRoom',function(msg){
		console.log('openRoom',msg);
		db.Room.findRoomShort(msg.roomId,function(room){
			console.log('foundRoom ' ,room);
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
			// 未読をループ
			if(notifies.length === 0){
				socket.emit('gotUnreadChat',{notify:undefined,defCount:defCnt});
			}
			for(var i = 0; i < 10;i++){
				if(i < notifies.length){
					_notify = notifies[i];
					// メッセージを取得
					(function(_i,notify){
						db.Room.getOneChat(user,msg.roomId,notify.param,function(chatObj){
							var chat = chatObj !== undefined ?chatObj[0].chat : undefined;
							console.log(_i,'getOneChat',chat);
							if(chat !== undefined){
								docs.push(chat);
								// 既読数インクリメントしてルームへキャスト
								db.Room.incChat(user,msg.roomId,chat._id,function(success){
									if(success){
										chatObject.to(msg.roomId).emit('chatRead',{chatId:chat._id});
									}
								});
								db.Notify.readNotify(user,notify._id,function(success){
									if(_i == 9 || _i == notifies.length -1){
										// 既読
											if(success){
												socket.emit('gotUnreadChat',{notify:docs,defCount:defCnt});
											}
									}
								});
							}
						});
					})(i,_notify);
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
	 * ダイレクトメッセージ系　とりあえず実装
	 */
	socket.on('directMessage',function(msg){
		notifyMessage('directMessage',msg.to,{from:user.id,msg:msg.msg});
	});

	/*
	 * 切断。
	 */
	socket.on('disconnect',function(){
		clearInterval(sessionReloadIntervalID);
		db.User.logout(user,function(success){
			// TODO:通知処理変更
			console.log(success);
		});
		delete so.ssIds[user.id];
		delete users[userID];
		socket.broadcast.emit('logout',userID);
	});
});
};
