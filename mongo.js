var 
	Friend,
	User,
	Chat,
	Room,
	mongoose	= require('mongoose'),
	Schema		= mongoose.Schema,
	FriendSchema = new Schema({
			user_id		: String,
			email		: String,
			stat		: String
	}),
	UserSchema	= new Schema({
			user_id		: String,
			displayName	: String,
			email		: String,
			room_ids	: [String],
			friends		: [FriendSchema],
			created		: {type:Date,default:Date.now},
			lastAccess	: {type:Date,default:Date.now}
	}),
	ChatSchema	= new Schema({
			author		: String,
			ChatType	: String,
			body		: String,
			date		: {type:Date,default:Date.now}
	}),
	RoomSchema	= new Schema({
			roomOwner	: String,
			roomName	: String,
			member		: [String],
			chat		: [ChatSchema],
			created		: {type:Date,default:Date.now},
			lastAccess	: {type:Date,default:Date.now}
	});

exports.init = function()
{
	mongoose.connect('mongodb://localhost/umeChat');
	Friend = mongoose.model('Friend',FriendSchema);
	User = mongoose.model('User',UserSchema);
	Chat = mongoose.model('Chat',ChatSchema);
	Room = mongoose.model('Room',RoomSchema);
};
// 特定のユーザーのフレンドの一覧を返す
exports.getFriendList = function(user,callback)
{
	User.find({_id:user.id},function(err,docs){
		var i,friends = [],friend;
		if(!err && docs && docs.length > 0 && docs[0].friends){
			for(i = 0; i < docs[0].friends.length;i++){
				friend = docs[0].friends[i];
				friends[i] = {id:friend.user_id,email:friend.email,stat:friend.stat};
			}
		}
		callback(friends);
	});
}
//	user_id		: String,
//	email		: String,
//	stat		: String
// 特定のユーザーにフレンドを追加する。デフォルトのステータスはinvite
exports.addFriend = function(userId,friendEmail,callback)
{
	User.find({email:friendEmail},function(err0,docs){	// そのフレンドがそもそもユーザーにいるか
		var	friend = new Friend();
		if(!err0 && docs && docs.length > 0){
			friend.user_id = docs[0].id;
			friend.email = docs[0].email;
			friend.stat = 'invite';

			User.find({_id : userId},function(err,users){	// いたらDBに登録にいく
				var i,
				sameFriend = false;
				if(!err && users && users.length > 0){
					if(users[0].friends !== undefined){
						for(i = 0;i < users[0].friends.length ; i++){
							if(friend.user_id === users[0].friends[i].user_id){
								sameFriend = true;
								break;
							}
						}
					}
					if(!sameFriend){
						users[0].friends.push(friend);
						users[0].save(function(err){
							if(!err){
								callback(null,users[0],friend);
								return;
							}
						});
					}
					else{
						console.log('same friends change status');
						exports.changeFriendStatus(userId,friend.user_id,'friend',function(err,user,newFriend){
							callback(err,user,newFriend);
						});
					}
				}
				callback('not add',undefined,undefined);
			});
		}
		else{
			callback('no such user',undefined,undefined);
		}
	});
}
//　特定のユーザーのフレンドのステータスを変更する
exports.changeFriendStatus = function(userId,friendId,stat,callback)
{
	// フレンドの存在チェックはいらない。ユーザーのフレンドにいないデータは変更しないので。
	User.find({_id:userId},function(err,docs){
		var i,
			newData = {user_id:friendId,stat:stat};

		if(!err && docs && docs.length > 0){
			if(docs[0].friends != undefined){
				for(i=0;i < docs[0].friends.length;i++){
					if(docs[0].friends[i].user_id === friendId){
						newData.email = docs[0].friends[i].email;
						docs[0].friends.set(i,newData);
						docs[0].save();
						callback(null,docs[0],newData);
						return;
					}
				}
			}
		}
		callback('fail',undefined,undefined);
	});
}
exports.findAllRoom = function(callback)
{
	var rooms = {};
	Room.find({},function(err,data){
		for(var i = 0,size = data.length;i < size;++i){
			rooms[i] = data[i].doc;
		}
		callback(rooms);
	});
}
exports.findRoom = function(roomId,callback){
	Room.find({room_id : roomId},function(err,docs){
		var rData = undefined,
			size = docs.length;
		if(size > 0){
			rData = docs[0];
		}
		callback(rData);
	});
}

//	roomOwher	: String,
//	roomName	: String,
//	member		: [String],
//	chat		: [ChatSchema]

exports.addRoom = function(uData,callback){
	var room = new Room();
	room.roomOwner = uData.roomOwner;
	room.roomName = uData.roomName;
	room.member = uData.member;
	room.chat = uData.chat;
	room.save(function(err){
		if(err){
			console.log(err);
		}
		callback(err,room);
	});
}
// ルームにメンバーを追加する
// not tested
exports.addRoomMember = function(roomId,userId,callback){
	Room.find({room_id : roomId},function(err,rooms){
		if(!err && !rooms && rooms.length > 0){
			rooms[0].member.push(userId);
			rooms[0].save(function(err){
				if(!err){
					console.log(err);
				}
				callback(err);
			});
		}
		else{
			console.log(err);
		}
	});
}
// ルームのメンバーを削除する
// not tested
exports.removeRoomMember = function(roomId,userId,callback){
	Room.update({room_id : roomId},
		{ $pull : {member:userId}},
		{ upsert : false,multi:false},
			function(err){
				callback(err);
			}
		);
}
// not tested
exports.findAllUser = function(callback){
	var users = {};
	User.find({},function(err,data){
		for (var i = 0,size = data.length;i < size;++i){
			users[i] = data[i].doc;
		}
		callback(users);
	});
}
// 引数のqueryは検索条件にそのままわたすのでフィールド：値で。
// テスト済み
exports.findUser = function(query,callback){
	User.find(query,function(err,docs){
		var 
			uData	= undefined,
			size	= docs.length;
		if(size > 0){
			uData	= docs[0];
		}
		callback(uData);
	});
}
exports.addUser = function(uData,callback){
	var user = new User();
	user.user_id = uData.identifier;
	user.displayName = uData.displayName;
	user.email = uData.emails[0].value;
	exports.findUser({"email" : user.email},function(uData){
		if(uData === undefined){
			user.save(function(err){
				if(err){
					console.log(err);
				}
				callback(err,user);
			});
		}
		else{
			callback(null,uData);
		}
	});
}
// not tested
exports.removeUser = function(userId,callback){
	User.remove({user_id : userId},function(err){
		if(err){
			console.log(err);
		}
		callback(err);
	});
}
/*
 * userデータから入室しているルーム情報をとる。Idとname
 */
exports.getJoinRoomList = function(user,callback){
	exports.findUser({"email":user.emails[0].value},function(userData){
		var roomList = [];
		Room.find({"_id":{$in:userData.room_ids}},function(err,docs){
			for(var i = 0;i < docs.length;i++){
				roomList[i] = {id:docs[i].id,name:docs[i].roomName};
			}
			callback(roomList);
		});
	}
	);
}
exports.joinRoom = function(userId,roomId,callback){
	exports.addRoomMember(roomId,userId,function(err){
		if(!err){
			User.find({_id : userId},function(err,users){
				if(!err && !users && users.length > 0){
					users[0].room_ids.push(roomId);
					users[0].save(function(err){
						if(!err){
							console.log(err);
						}
						callback(err);
					});
				}
				else{
					console.log(err);
				}
			});
		}
	});
}
// roomInfoには作成者を予め埋め込むこと
// test済み
exports.createRoom = function(userId,roomInfo,callback){
	exports.addRoom(roomInfo,function(err0,newRoom){			//　ルームIDをユーザーデータに追加
		if(!err0){
			User.find({_id : userId},function(err,users){
				if(!err && users && users.length > 0){
					users[0].room_ids.push(newRoom.id);
					users[0].save(function(err1){
						callback(err1,newRoom.id,users[0].room_ids.length + 1;);
					});
				}
				else{
					console.log(err);
				}
			});
		}
	});
}

