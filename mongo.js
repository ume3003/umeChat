var 
	Friend,
	User,
	Chat,
	Room,
	mongoose	= require('mongoose'),
	so			= require('./shareObj'),
	Schema		= mongoose.Schema,
	FriendSchema = new Schema({
			user_id		: String,
			email		: String,
			stat		: String		// 0:友人申請中　1:友人申請受け中  2:友人
	}),
	UserSchema	= new Schema({
			user_id		: String,
			displayName	: String,
			email		: String,
			room_ids	: [String],
			comment		: String,
			photo		: String,
			friends		: [FriendSchema],
			privates	: {type:String,default:'f'},
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
	mongoose.connect(so.mongoURL);
	Friend = mongoose.model('Friend',FriendSchema);
	User = mongoose.model('User',UserSchema);
	Chat = mongoose.model('Chat',ChatSchema);
	Room = mongoose.model('Room',RoomSchema);
};
// beInvite '0' '1' '2' 2はつかわずにFriendListを使うこと
exports.getInviteList = function(user,beInvite,callback)
{
	User.find({_id:user.id,"friends.stat":beInvite,privates:'f'},function(err,docs){
		var i,invites= [],intive;
		if(!err && docs && docs.length > 0 && docs[0].friends){
			for(i = 0;i < docs[0].friends.length;i++){
				invite = docs[0].friends[i];
				invites[i] = {id:invite.user_id,email:invite.email,stat:invite.stat};
			}
		}
		callback(invites);
	});
};

// 特定のユーザーのフレンドの一覧を返す
exports.getFriendList = function(user,callback)
{
	User.find({_id:user.id,'friends.stat':'2'},function(err,docs){
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
//	stat		: String	0,1,9 9はユーザーにいない場合
// 特定のユーザーにフレンドを追加する。デフォルトのステータスはinvite
exports.addFriend = function(userId,friendEmail,callback)
{
	User.find({email:friendEmail},function(err0,targetYou){	// そのフレンドがそもそもユーザーにいるか
		var	friend = new Friend(),			// 自分のテーブルに追加するフレンドの情報
			inviteUser = new Friend(),		// フレンドのテーブルに追加する自分の情報
			me ,
			passkey = '0000',
			isUser = false;
		if(!err0 ){
			friend.stat = '0';
			friend.email = friendEmail;
			if(targetYou && targetYou.length > 0){
				friend.user_id = targetYou[0].id;
				isUser = true;
			}
			else{
				passkey = '0000' + Math.floor(Math.random() * 10000);
				friend.user_id = passkey.slice(passkey.length - 4);
				friend.stat = '9';
			}
			console.log(targetYou,isUser,passkey);
			User.find({_id : userId,'friends.email':friendEmail},function(err,dumUser){	// 自分のDBへの保存
				if(!err){
					if(dumUser && dumUser.length > 0){		//  該当ユーザーフレンドにいます
						console.log('same friends change status');
						callback('already have such user',undefined,undefined);
					}
					else{		// フレンドにいないので追加です
						User.find({_id : userId},function(err,existusers){	// 自分のDBへの保存
							existusers[0].friends.push(friend);
							existusers[0].save(function(err){
								if(!err){
									me = existusers[0];
									console.log('me',me);
									if(isUser){		// 相手のDBへ保存
										inviteUser.stat = '1';	
										inviteUser.email = me.email;
										inviteUser.user_id = me.id;
										targetYou[0].friends.push(inviteUser);
										targetYou[0].save(function(err2){
											callback(null,me,friend);
										});
									}
									else{
										callback(null,me,friend);
									}
								}
							});
						});
					}
				}
			});
		}
		else{
			callback('no such user',undefined,undefined);
		}
	});
};
// 両方がすでに会員であり、申請がきたときに承認する処理
// friend id email stat
// db.users.update( {email:'ume3003@gmail.com','friends.email':'ume3@gmail.com'},{$set:{"friends.$.stat":'9'}})
exports.approveFriend = function(user,friend,callback){
	var myQuery		={_id:user.id,'friends.email':friend.email},
		myUpdate	={$set:{'friends.$.stat':'2'}},
		yourQuery	={email:friend.email,'friends.email':user.emails[0].value}
		yourUpdate	={$set:{'friends.$.stat':'2'}};

	console.log('approveFriend ',user.emails[0].value,friend.email,myQuery,myUpdate,yourQuery,yourUpdate);
	User.update(myQuery,myUpdate,function(err){
		if(!err){
			User.update(yourQuery,yourUpdate,function(err2){
				if(err){
					console.log(err);
				}
				callback(!err);
			});
		}
		else{
			console.log(err);
			callback(false);
		}
	});
};
// db.users.update({email:'ume3003@gmail.com'},{$pull:{'friends':{'email':'ume4@gmail.com'}}})
exports.cancelFriend = function(user,friend,callback){
	var myQuery		= {_id : user.id}		,myUpdate	= { $pull : {friends : {email:friend.email}}},
		yourQuery	= {email:friend.email}	,yourUpdate	= { $pull : {friends : {email:user.emails[0].value }}};
	
	console.log('cancelFriend mine ',friend.email,myQuery,myUpdate);
	User.update(myQuery,myUpdate,function(err){				// 自分のフレンドステータスの変更
		if(err){
			console.log(err);
			callback(false);
		}
		else{
			if(friend.stat !== '0'){
				callback(true);
			}
			else{
				console.log('cancelFriend friend ',yourQuery,yourUpdate);
				User.update(yourQuery,yourUpdate,function(err2){
					if(err2){
						console.log(err);
					}
					callback(!err2);
				});
			}
		}
	});
};
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
			uData.photo = '/images/macallan.jpg';
			uData.comment = 'サンプルコメント。長い文字列だとどうなるんだろうか。ちょっと書いてみる。このくらいでいいか。';
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
						callback(err1,newRoom.id,users[0].room_ids.length);
					});
				}
				else{
					console.log(err);
				}
			});
		}
	});
}

