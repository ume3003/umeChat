/**
 * Module dependencies.
 */
var		so	= require('./shareObj')	
	,	db	= require('./mongo')
	,	io
	,	users		= {}
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
		var sessionID
			,cookie = require('cookie').parse(decodeURIComponent(handshakeData.headers.cookie));

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
		return callback('cookie not found',false);
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
		sessionReloadIntervalID;

	users[userID] = user;

	sessionReloadIntervalID = setInterval(function(){
		socket.handshake.session.reload(function(){
			socket.handshake.session.touch().save();
		});
	},60 * 2 * 1000);

	/*	会議室ごとに通知に変更する
	socket.broadcast.emit('join',user);				//会議室全員に自分の入室を通知
	socket.emit('member',{members : users});		//自分には会議室全員を通知
	*/
	db.getJoinRoomList(user,function(RoomList){
		socket.emit('roomList',{rooms:RoomList});		//会議リストの通知	
	});
	db.getFriendList(user,function(friendList){
		socket.emit('friendList',{friends:friendList});	// 知人リストの通知
	});


	socket.on('msg_send',function(msg){	// TODO:ここでルームチェックとルームへのチャットデータの登録を行う
		socket.to(msg.roomId).emit('msg_push',
			{uID:socket.handshake.session.userID,msg : msg.msg,roomId:msg.roomId});
	});

	socket.on('msg_joinRoom',function(roomId){

	});
	socket.on('inviteFriend',function(msg){
		if(msg.friendEmail === user.emails[0].value){
			socket.emit('friendInvited',{idx:-1});
		}
		else{
			db.addFriend(user.id,msg.friendEmail,function(err,user,friend){
				if(err){
					socket.emit('friendInvited',{idx:-1});
				}
				else{	// 結果を返す
					socket.emit('friendInvited',
						{idx:user.friends.length - 1,id:friend.id,email:friend.email,stat:friend.stat});
				}
			});
		}
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
	
	socket.on('disconnect',function(){
		clearInterval(sessionReloadIntervalID);
		delete users[userID];
		socket.broadcast.emit('logout',userID);
	});
});
}
