var _collection,
	_schema,
	_chat,
	_friend,
	ps = require('../passport');

exports.collection = function(){
	return _collection;
};

exports.schema = function(){
	return _schema;
};
exports.init = function(db,chat,friend)
{
	_chat = chat;
	_friend = friend;

	_schema = new db.Schema({
		user_id		: String,
		displayName	: String,
		email		: String,
		photo		: String,
		roomInfos	: [chat.schema()],			// id:{ roomid } flag : { 0:invited ,1:join ,2:joining}
		comments	: [chat.schema()],			// id:{ not use } flag : {0:previous 1:current } body :{comment}
		lastComment	: String,					// TODO:commentsのflagは使わないように変更
		friends		: [friend.schema()],
		privates	: {type:String,default:'f'},
		created		: {type:Date,default:Date.now},
		lastAccess	: {type:Date,default:Date.now},
		type		: String
	});
	_collection = db.model('user',_schema);
}
//
// beInvite '0' '1' '2' 2はつかわずにFriendListを使うこと
exports.getInviteList = function(user,beInvite,callback)
{
	var query = {_id:user.id,"friends.stat":beInvite,privates:'f'};
	_collection.find(query,function(err,docs){
		callback((!err && docs && docs.length > 0 && docs[0].friends) ? docs[0].friends : undefined);
	});
};

// 特定のユーザーのフレンドの一覧を返す
// idb.users.aggregate({'$unwind':'$comments'},{'$match':{'email':'ume3003@gmail.com','comments.flag':{$ne:0}}}, {'$project':{'comments':1}})
exports.getFriendList = function(user,callback)
{
	var query	= {'friends.user_id':user.id,'friends.stat':'2'},
		columns = {user_id:1,displayName:2,email:3,lastComment:4,photo:5,lastAccess:6};
	console.log(query,columns);
	_collection.find(query,columns,function(err,friends){
		console.log(friends[0]);
		callback(!err ? friends : undefined);
	});
}
//	user_id		: String,
//	email		: String,
//	stat		: String	0,1,9 9はユーザーにいない場合
// 特定のユーザーにフレンドを追加する。デフォルトのステータスはinvite
exports.addFriend = function(user,friendEmail,callback)
{
	if(friendEmail === ps.userKey(user)){
		console.log('same user');
		callback(undefined);
	}
	_collection.find({email:friendEmail},function(err0,targetYou){	// そのフレンドがそもそもユーザーにいるか
		var	friend	= {user_id:''	  ,email:friendEmail			,stat:'0'},			// 自分のテーブルに追加するフレンドの情報
			me		= {user_id:user.id,email:ps.userKey(user)		,stat:'1'},		// フレンドのテーブルに追加する自分の情報
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
			_collection.find({_id : user.id,'friends.email':friendEmail},function(err,dumUser){	// 自分のDBへの保存
				if(!err){
					if(dumUser && dumUser.length > 0){		//  該当ユーザーフレンドにいます
						console.log('same friends change status');
						callback(undefined);
					}
					else{		// フレンドにいないので追加です
						_collection.update({_id:user.id},{$push:{'friends':friend}},function(err){
							if(!err){
								if(isUser){		// 相手のDBへ保存、検索条件に相手のDBのフレンド情報に自分がいない、を追加
									_collection.update({email:friendEmail,'friends.email':{$ne:me.email}},{$push:{'friends':me}},function(err2){
										console.log(me,friend);
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
		yourQuery	= {email:friend.email,'friends.email':ps.userKey(user)}
		Update		= {$set:{'friends.$.stat':'2'}};

	console.log('approveFriend ',ps.userKey(user),friend.email,myQuery,yourQuery,Update);
	_collection.update(myQuery,Update,function(err){
		if(!err){
			_collection.update(yourQuery,Update,function(err2){
				if(err2){
					console.log(err2);
				}
				callback(!err2);
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
		yourQuery	= {email:friend.email}	,yourUpdate	= { $pull : {friends : {email:ps.userKey(user) }}};
	
	_collection.update(myQuery,myUpdate,function(err){				// 自分のフレンドステータスの変更
		if(err){
			console.log(err);
			callback(false);
		}
		else{
			if(friend.stat !== '0'){
				callback(true);
			}
			else{
				_collection.update(yourQuery,yourUpdate,function(err2){
					if(err2){
						console.log(err);
					}
					callback(!err2);
				});
			}
		}
	});
};
//
// 引数のqueryは検索条件にそのままわたすのでフィールド：値で。
// テスト済み
exports.findUser = function(query,callback){
	_collection.find(query,function(err,docs){
		var uData	= undefined;
		if(docs.length > 0){
			uData	= docs[0];
//			uData.photo = uData.photo === undefined ?'/images/macallan.jpg';
			uData.comment = docs[0].lastComment;
		}
		callback(uData);
	});
}
/*
 * saveでやらないとidがとれない。
 */
exports.addUser = function(uData,callback){
	var newUser = new _collection(),
		comment = {body:'nothing',lastAccess:new Date()};
	newUser.user_id		= uData.identifier;
	newUser.displayName = uData.displayName;
	newUser.email		= ps.userKey(uData);
	newUser.comments	= [comment];
	newUser.lastComment		= comment.body;
	newUser.photo = ps.userPhoto(uData);
	newUser.type = uData.type;
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
// not tested
exports.removeUser = function(user,callback){
	_collection.remove({user_id : user.id},function(err){
		if(err){
			console.log(err);
		}
		callback(err);
	});
}
/*
 *	status は　{field:updateStatus}の形で。
 */
exports.modifyStatus = function(user,status,callback){
	_collection.update({_id:user.id},status,function(err){
		callback(!err);
	});
}
exports.logout = function(user,callback){
	var la = {lastAccess:new Date()};
	exports.modifyStatus(user,la,callback);
}

exports.addComment = function(user,comment,callback){
	_collection.update({_id:user.id},{$set:{lastComment:comment},$push:{comments:{body:comment,lastAccess:new Date()}}},function(err){
			callback(!err);
	});
}


exports.addRoomInfo = function(userId,roomInfo,callback){
	_collection.update({_id:userId},{$push:{roomInfos:roomInfo}},function(err){
		callback(!err);
	});
};
exports.removeRoomInfo = function(userId,roomId,callback){
	_collection.update({_id:userId},{$pull : {roomInfos:{id:roomId}}},function(err){
		callback(!err);
	});
};
exports.modifyRoomInfo = function(userId,roomId,flag,callback){
	_collection.update({_id:userId,'roomInfos.id':roomId},{$set : {'roomInfos.$.flag':flag}},function(err){
		callback(!err);
	});
};
