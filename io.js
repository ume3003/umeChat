/**
 * Module dependencies.
 */
var		so	= require('./shareObj')	,
		db	= require('./mongo'),
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
		sendDirectMessage;

	console.log('init ',user.id);
	/*
	 *	connect の際の処理
	 *	socket.idのメモリキャッシュ；最終的にはRedisにいれる
	 *	userのキャッシュ　最終的にはRedisにいれる（でも必要？）
	 *	cookie の定期更新
	 *	TODO:logout中のダイレクトメッセージ
	 *	TODO:チャットメッセージの送付
	 */
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
	sendDirectMessage = function(msg){
		var id = so.ssIds[msg.to];
		if(id !== undefined){
			console.log('directMessage to ',msg.to,' msg ',msg.msg);
			io.sockets.socket(id).emit('directedMessage',{from:user.emails[0].value,msg:msg.msg});
		}
		else{		// TODO:ここはメッセージをDBに保存。ログインのときに送付
			console.log('directMessage to ',msg.to,' msg ',msg.msg,' is fail');
		}
	};
	/*
	 * ここから作り直し
	 */
	socket.on('getInviteList',function(msg){
		db.getInviteList(user,{$in:['0','1','9']},function(list){
			socket.emit('gotInviteList',{invite:list});
		});
	});
	socket.on('getFriendList',function(){
		db.getFriendList(user,function(friends){
			socket.emit('gotFriendList',{friends:friends});	// 知人リストの通知
		});
	});

	socket.on('findFriend',function(msg){
		console.log('findUser',user.id);
		db.addFriend(user,msg.tgt,function(you){
			socket.emit('foundFriend',{you:you,tgt:msg.tgt});
		});
	});

	socket.on('approveFriend',function(msg){
		db.approveFriend(user,msg.info,function(success){
			socket.emit('approvedFriend',{success:success});
			sendDirectMessage({to:msg.info.email ,msg:'approved'});	// TODO:ログアウト時の処理
		});
	});
	socket.on('cancelFriend',function(msg){
		db.cancelFriend(user,msg.info,function(success){
			socket.emit('cancelledFriend',{success:success});
		});
	});


	/*
	 * あとで治す
	 */
	socket.on('msg_send',function(msg){	// TODO:ここでルームチェックとルームへのチャットデータの登録を行う
		socket.to(msg.roomId).emit('msg_push',
			{uID:socket.handshake.session.userID,msg : msg.msg,roomId:msg.roomId});
	});

	socket.on('msg_joinRoom',function(roomId){

	});
	socket.on('msg_createRoom',function(msg){
		var roomInfo = {roomOwner : user.id,roomName : msg,member : [user.id]};

		db.createRoom(user.id,roomInfo,function(err,room_Id,joinCnt){
			if(!err){
				socket.join(room_Id);
				socket.emit('roomCreated',{create:true,roomId:room_Id,roomName:msg,joinCount:joinCnt});
			}
			else{
				socket.emit('roomCreated',{create:false,roomId:'',roomName:'',joinCount:0});
			}
		});
	});
	/*
	 * ダイレクトメッセージ系　とりあえず実装
	 */
	socket.on('directMessage',function(msg){
		sendDirectMessage(msg);
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
