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
	// Notify				from		to			param
	// 0,Friend	invited		inviter		user				ユーザーでない場合はNotify行かない。
	// 1		approved	approver	inviter				ユーザーになった場合にはもどりのNotifyはいく
	// 2.Room	invited		inviter		user		roomId	
	// 3		joined		joinner		inviter
	// 4.Chat	say			sayer		logoutuser	roomId						
	// 
	UserSchema	= new Schema({
			user_id		: String,
			displayName	: String,
			email		: String,
			photo		: String,
			roomInfos	: [ChatSchema],			// id:{ roomid } flag : { 0:invited ,1:join ,2:joining}
			comments	: [ChatSchema],			// id:{ not use } flag : {0:previous 1:current } body :{comment}
			friends		: [FriendSchema],
			privates	: {type:String,default:'f'},
			created		: {type:Date,default:Date.now},
			lastAccess	: {type:Date,default:Date.now}
	}),
	ChatSchema	= new Schema({
			id			: String,
			flag		: Number,
			body		: String,
			lastAccess	: {type:Date,default:Date.now}
	}),
	RoomSchema	= new Schema({
			roomOwner	: String,
			roomName	: String,
			member		: [String],
			chat		: [ChatSchema],				// id:{user.id} flag:{reader's count} body:{message}
			created		: {type:Date,default:Date.now},
			lastAccess	: {type:Date,default:Date.now}
	}),
	roomFieldS	= {
		roomOwner :1,
		roomName :2,
		member :3,
		created:4,
		lastAccess:5
	};

exports.init = function()
{
	mongoose.connect(so.mongoURL);
	Friend = mongoose.model('Friend',FriendSchema);
	User = mongoose.model('User',UserSchema);
	Chat = mongoose.model('Chat',ChatSchema);
	Room = mongoose.model('Room',RoomSchema);
//	Notify = mongoose.model('Notify',NotifySchema);
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
	var query	= {'friends.user_id':user.id,'friends.stat':'2','comments:flag':'1'},
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
	var myQuery		= {_id:user.id,'friends.email':friend.email},
		yourQuery	= {email:friend.email,'friends.email':user.emails[0].value}
		Update		= {$set:{'friends.$.stat':'2'}};

	console.log('approveFriend ',user.emails[0].value,friend.email,myQuery,yourQuery,Update);
	User.update(myQuery,Update,function(err){
		if(!err){
			User.update(yourQuery,Update,function(err2){
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
	query["comments.flag"] = "1";
	User.find(query,function(err,docs){
		var uData	= undefined;
		if(docs.length > 0){
			uData	= docs[0];
			uData.photo = '/images/macallan.jpg';
			if(docs[0].comments && docs[0].comments.length > 0){
				uData.comment = docs[0].comments[0].body;
			}
			else{
				uData.comment = 'sample comment';
			//	uData.comment = 'サンプルコメント。長い文字列だとどうなるんだろうか。ちょっと書いてみる。このくらいでいいか。';
			}
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
	newUser.comments	= {flag:'1',body:'nothing',lastAccess:new Date()};
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
 *	status は　{field:updateStatus}の形で。
 */
exports.modifyStatus = function(user,status,callback){
	User.update({_id:user.id},status,function(err){
		callback(!err);
	});
}
exports.addComment = function(user,comment,callback){
	User.update({_id:user.id,'comments.flag':'1'},{$set:{'comments.$.lag':'0'}},function(err){
		User.update({_id:user.id},{$push:{comments:{flag:'1',body:comment,lastAccess:new Date()}}},function(err){
			callback(!err);
		});
	});
}
// not tested
exports.removeUser = function(user,callback){
	User.remove({user_id : user.id},function(err){
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
	Room.find({member:user.id},function(rooms){
		callback(rooms);
	});
}
// roomInfoには作成者を予め埋め込むこと
// test済み
exports.createRoom = function(user,roomInfo,callback){
	exports.addRoom(roomInfo,function(newRoom){			//　ルームIDをユーザーデータに追加
		if(newRoom !== undefined){
			User.update({_id:user.id},{$push:{roomInfos:{id:newRoom.id,flag:'1',lastAccess:new Date()}}},function(err2){
				callback(!err2 ? newRoom : undefined);
			});
		}
		else{
			callback(undefined);
		}
	});
}
// tgtのユーザーをroomへinviteする
exports.inviteRoom = function(tgtId,roomId,callback){
	exports.findRoom(roomId,function(invitedRoom){
		if(invitedRoom !== undefined){
			User.update({_id:tgtId},{$push:{roomInfos:{id:invitedRoom.id,flag:'0',lastAccess:new Date()}}},{upsert:false}),function(err){
				callback(!err);
			}
		}
		else{
			callback(false);
		}
	});
}
//  db.users.update({'_id':userId}, {$push:{"room_ids":"0"}} )
//  inviteされたroomへjoinする
exports.joinRoom = function(user,roomId,callback){
	exports.addRoomMember(roomId,user.id,function(err){
		if(!err){
			User.update({_id:user.id,'roomInfos.id':roomId},{$set:{'roomInfos.$.flag':'1'}},function(err2){
				callback(!err2);
			});
		}
		else{
			callback(!err);
		}
	});
}
exports.findRoomShort = function(roomId,callback){
	Room.find({_id : roomId},roomFieldS,function(err,docs){
		callback(docs.length > 0 ? docs[0] : undefined);
	});
}
exports.findRoom = function(roomId,callback){
	Room.find({_id : roomId},function(err,docs){
		callback(docs.length > 0 ? docs[0] : undefined);
	});
}

//	roomOwher	: String,
//	roomName	: String,
//	member		: [String],
//	chat		: [ChatSchema]

exports.addRoom = function(roomInfo,callback){
	var room = new Room();
	room.roomOwner = roomInfo.roomOwner;
	room.roomName = roomInfo.roomName;
	room.member = roomInfo.member;
	room.chat = roomInfo.chat;
	room.save(function(err){
		callback(!err ? room : undefined);
	});
}
exports.addRoomMember = function(roomId,userId,callback){
	Room.update({_id:roomId},{$push:{member:userId}},{upsert:false,multi:false},function(err){
		callback(!err);
	});
}
// ルームのメンバーを削除する
// not tested
exports.removeRoomMember = function(roomId,userId,callback){
	Room.update({_id:roomId},{$pull:{member:userId}},{upsert:false,multi:false},function(err){
		callback(!err);
	});
}

/*
 * チャットを発言する
 */
exports.sayChat = function(user,roomId,message,flag,callback){
	Room.update({_id:roomId},{$push:{chat:{id:user.id,flag:flag,body:message,lastAccess:new Date()}}},function(err){
		callback(!err);
	});
}
/*
 * 指定日時より前のチャットを指定件数だけ取得する
 * db.users.aggregate([{$unwind:"$comments"},{$sort:{"comments.lastAccess":-1}},{$project:{"comments":1}}])
 * unwind:embedded docの展開
 * soft:展開したdocのソート
 * project:出力フィールドの指定
 * 戻りは配列。
 * 日付以前　＞　$lt 
 * 件数制限 $limit
 */
exports.getLog = function(user,roomId,lastAccess,count){
	Room.aggregate(	{'$match':{'_id':roomId,'lastAccess':{'$gt':lastAccess}}},
					{'$unwind':'$chat'},
					{'$sort':'-1'},
					{'$project':{'chat':1}},
					{'$limit': count },function(err,chat){
		callback(err ? undefined : chat);
	});
}


