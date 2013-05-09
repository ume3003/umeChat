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
/*
 * ここから作り直し
 */
// beInvite '0' '1' '2' 2はつかわずにFriendListを使うこと
exports.getInviteList = function(user,beInvite,callback)
{
	var query = {_id:user.id,"friends.stat":beInvite,privates:'f'};
	User.find(query,function(err,docs){
		callback((!err && docs && docs.length > 0 && docs[0].friends) ? docs[0].friends : undefined);
	});
};

// 特定のユーザーのフレンドの一覧を返す
exports.getFriendList = function(user,callback)
{
	var query	= {'friends.user_id':user.id,'friends.stat':'2'},
		columns = {user_id:1,displayName:2,email:3,comment:4,photo:5,lastAccess:6};
	User.find(query,columns,function(err,friends){
		callback(!err ? friends : undefined);
	});
}
//	user_id		: String,
//	email		: String,
//	stat		: String	0,1,9 9はユーザーにいない場合
// 特定のユーザーにフレンドを追加する。デフォルトのステータスはinvite
exports.addFriend = function(user,friendEmail,callback)
{
	if(friendEmail === user.emails[0].value){
		console.log('same user');
		callback(undefined);
	}
	User.find({email:friendEmail},function(err0,targetYou){	// そのフレンドがそもそもユーザーにいるか
		var	friend	= {user_id:''	  ,email:friendEmail			,stat:'0'},			// 自分のテーブルに追加するフレンドの情報
			me		= {user_id:user.id,email:user.emails[0].value	,stat:'1'},		// フレンドのテーブルに追加する自分の情報
			passkey = '0000' + Math.floor(Math.random() * 10000),
			isUser	= false;
		if(!err0 ){
			if(targetYou && targetYou.length > 0){
				friend.user_id = targetYou[0].id;
				isUser = true;
			}
			else{
				friend.user_id = passkey.slice(passkey.length - 4);
				friend.stat = '9';
			}
			User.find({_id : user.id,'friends.email':friendEmail},function(err,dumUser){	// 自分のDBへの保存
				if(!err){
					if(dumUser && dumUser.length > 0){		//  該当ユーザーフレンドにいます
						console.log('same friends change status');
						callback(undefined);
					}
					else{		// フレンドにいないので追加です
						User.update({_id:user.id},{$push:{'friends':friend}},function(err){
							if(!err){
								if(isUser){		// 相手のDBへ保存
									User.update({email:friendEmail},{$push:{'friends':me}},function(err2){
										callback(friend);
									});
								}
								else{
									callback(friend);
								}
							}
							else{
								callback(undefined);
							}
						});
					}
				}
			});
		}
		else{
			callback(undefined);
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
// 引数のqueryは検索条件にそのままわたすのでフィールド：値で。
// テスト済み
exports.findUser = function(query,callback){
	User.find(query,function(err,docs){
		var uData	= undefined;
		if(docs.length > 0){
			uData	= docs[0];
			uData.photo = '/images/macallan.jpg';
			uData.comment = 'サンプルコメント。長い文字列だとどうなるんだろうか。ちょっと書いてみる。このくらいでいいか。';
		}
		callback(uData);
	});
}
/*
 * saveでやらないとidがとれない。
 */
exports.addUser = function(uData,callback){
	var newUser = new User();
	newUser.user_id		= uData.identifier;
	newUser.displayName = uData.displayName;
	newUser.email		= uData.emails[0].value;
	newUser.comment		= '';
	newUser.photo		= '/images/sample.png';
	exports.findUser({"email" : newUser.email},function(dum){
		if(dum === undefined){
			console.log(newUser);
			newUser.save(function(err){
				if(err){
					console.log(err);
				}
				callback(err,newUser);
			});
		}
		else{
			callback(null,newUser);
		}
	});
}
/*
 *	作り直しここまで1
 */
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
		callback(!err ? room : undefined);
	});
}
// ルームにメンバーを追加する
// not tested
//  db.users.update({'email':'shozo.ueno@smikiegames.com'}, {$push:{"room_ids":"0"}} )
exports.addRoomMember = function(roomId,userId,callback){
	Room.update({room_id:roomId},{$push:{member:userId}},{upsert:false},function(err){
		callback(err);
	});
}
// ルームのメンバーを削除する
// not tested
exports.removeRoomMember = function(roomId,userId,callback){
	Room.update({room_id:roomId},{$pull:{member:userId}},{upsert:false,multi:false},function(err){
		callback(err);
	});
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
	var roomList = [];
	Room.find({member:user.id},function(rooms){
		callback(rooms);
	});
}
//  db.users.update({'_id':userId}, {$push:{"room_ids":"0"}} )
exports.joinRoom = function(user,roomId,callback){
	exports.addRoomMember(roomId,user.id,function(err){
		if(!err){
			User.update({_id:user.id},{$push:{room_ids:roomId}},function(err2){
				callback(!err2);
			});
		}
		else{
			callback(!err);
		}
	});
}
// roomInfoには作成者を予め埋め込むこと
// test済み
exports.createRoom = function(user,roomInfo,callback){
	exports.addRoom(roomInfo,function(newRoom){			//　ルームIDをユーザーデータに追加
		if(newRoom !== undefined){
			User.update({_id:user.id},{$push:{room_ids:newRoom.id}},function(err2){
				callback(!err2 ? newRoom : undefined);
			});
		}
		else{
			callback(undefined);
		}
	});
}

