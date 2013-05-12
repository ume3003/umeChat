/**
 * Module dependencies.
 */
var		so	= require('./shareObj')	,
//		db	= require('./mongo'),
		db	= require('./db'),
		io,
		users		= {}
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
io.sockets.on('connection',function(socket){
	var user = socket.handshake.session.user,
		userID = socket.handshake.session.userID,
		sessionReloadIntervalID,
		notifyMessage;

	console.log('init ',user.id);
	/*
	 *	connect の際の処理
	 *	socket.idのメモリキャッシュ；最終的にはRedisにいれる
	 *	userのキャッシュ　最終的にはRedisにいれる（でも必要？）
	 *	cookie の定期更新
	 *	TODO:logout中のダイレクトメッセージ
	 *	TODO:チャットメッセージの送付
	 */
	// 前回ログアウト時から今までのチャットメッセージの件数の取得
	// 前回ログアウト時からの通知メッセージの取得
	so.ssIds[user.emails[0].value] = socket.id;
	users[userID] = user;
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
	},
	/*
	 * ここから作り直し
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

	socket.on('findFriend',function(msg){
		console.log('findUser',user.id);
		db.User.addFriend(user,msg.tgt,function(you){
			socket.emit('foundFriend',{you:you,tgt:msg.tgt});
		});
	});

	socket.on('approveFriend',function(msg){
		db.User.approveFriend(user,msg.info,function(success){
			socket.emit('approvedFriend',{success:success});
			notifyMessage('directMessage',msg.info.email,{from:user.email[0].value,msg:'approved'});
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
	 * 1　メンバー　送信
	 * 2 非JOIN		Notify & DB
	 * 3 非LOGIN	DB
	 */
	socket.on('msg_send',function(msg){	// TODO:ここでルームチェックとルームへのチャットデータの登録を行う
		db.User.sayChat(user,msg.roomId,msg.msg,'0',function(success){
			if(success){
				socket.to(msg.roomId).emit('msg_push',
					{uID:socket.handshake.session.userID,msg : msg.msg,roomId:msg.roomId});
			}
			else{
				socket.emit('msg_send_fail');
			}
		});
	});

	/*
	 * msg.roomId msg.tgtUser
	 *
	 */
	socket.on('invite_room',function(msg){
		// DBに記録する
		// tgtにDMを送る
	});
	/*
	 * msg.roomId
	 */
	socket.on('join_room',function(msg){
		db,joinRoom(user,msg.roomId,function(success){
			if(success){
				socket.join(roomId);
			}
			io.socket.in(roomId).emit('newoneJoined',{id:user.id});		// 入室したルームにブロードキャスト
			socket.emit('joinedRoom',{success:success});				// 自分自身に入室成功を返す
		});
	});
	socket.on('msg_createRoom',function(msg){
		var roomInfo = {roomOwner : user.id,roomName : msg,member : [user.id]};

		db.createRoom(user,roomInfo,function(room){
			if(!room){
				socket.join(room.Id);
			}
			socket.emit('roomCreated',{room:room});
		});
	});
	/*
	 * ダイレクトメッセージ系　とりあえず実装
	 */
	socket.on('directMessage',function(msg){
		notifyMessage('directMessage',msg.to,{from:user.emails[0].value,msg:msg.msg});
	});

	/*
	 * 切断。lastAcessの更新してください
	 */
	socket.on('disconnect',function(){
		clearInterval(sessionReloadIntervalID);
		delete so.ssIds[user.emails[0].value];
		delete users[userID];
		socket.broadcast.emit('logout',userID);
	});
});
};
