var 
mongoose	= require('mongoose');
exports.User = require('./user');
exports.Friend = require('./friend');
exports.Chat = require('./chat');
exports.Room = require('./room');
exports.Notify = require('./notify');

exports.init = function(url){

	mongoose.connect(url);
	exports.Friend.init(mongoose);			// 直接使わないかも
	exports.Chat.init(mongoose);			// 直接使わないかも	
	exports.Notify.init(mongoose);
	exports.Room.init(mongoose,exports.Chat);
	exports.User.init(mongoose,exports.Chat,exports.Friend);
};
exports.startChatTo = function(user,tgtId,callback){
	var roomInfo = {roomOwner:user.id,roomName:undefined,member:[user.id,tgtId],mode:0};
	// roomを探しあったらそっち
	exports.Room.findChat(user,tgtId,function(existRoom){
		if(existRoom !== undefined && existRoom.length > 0){
			callback(existRoom[0]);
		}
		else{
			exports.createRoom(user,roomInfo,function(room){
				exports.User.addRoomInfo(tgtId,{id:room.id,flag:'1',lastAccess:new Date()},function(success){
					callback(success ? room : undefined);
				});
			});
		}
	});
}
// roomInfoには作成者を予め埋め込むこと
// test済み
exports.createRoom = function(user,roomInfo,callback){
	exports.Room.addRoom(roomInfo,function(newRoom){			//　ルームIDをユーザーデータに追加
		if(newRoom !== undefined){
			exports.User.addRoomInfo(user.id,{id:newRoom.id,flag:'1',lastAccess:new Date()},function(success){
				callback(success ? newRoom : undefined);
			});
		}
		else{
			callback(undefined);
		}
	});
}
// tgtのユーザーをroomへinviteする
exports.inviteRoom = function(tgtId,roomId,callback){
	exports.Room.findRoom(roomId,function(invitedRoom){
		if(invitedRoom !== undefined){
			exports.User.addRoomInfo(tgtId,{id:invitedRoom.id,flag:'0',lastAccess:new Date()},function(success){
				callback(success);
			});
		}
		else{
			callback(false);
		}
	});
}
//  db.users.update({'_id':userId}, {$push:{"room_ids":"0"}} )
//  inviteされたroomへjoinする
exports.joinRoom = function(user,roomId,callback){
	exports.Room.addRoomMember(roomId,user.id,function(err){
		if(!err){
			exports.User.modifyRoomInfo(user.id,roomId,'1',function(success){
				callback(success);
			});
		}
		else{
			callback(!err);
		}
	});
}
//  db.users.update({'_id':userId}, {$push:{"room_ids":"0"}} )
//  roomから退出する
exports.leaveRoom = function(user,roomId,callback){
	exports.Room.removeRoomMember(roomId,user.id,function(err){
		if(!err){
			exports.User.removeRoomInfo(user.id,roomId,function(success){
				callback(success);
			});
		}
		else{
			callback(!err);
		}
	});
}