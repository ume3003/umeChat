var _collection,
	_schema,
	chat = require('./chat');

exports.collection = function(){
	return _collection;
}

exports.init = function(db){
	_schema	= new db.Schema({
			roomOwner	: String,
			roomName	: String,
			member		: [String],
			chat		: [chat.schema()],				// id:{user.id} flag:{reader's count} body:{message}
			created		: {type:Date,default:Date.now},
			lastAccess	: {type:Date,default:Date.now}
	});
	_collection = db.model('Room',_schema);
}

/*
 * roomデータから入室しているルーム情報をとる。Idとname
 */
exports.getJoinRoomList = function(user,callback){
	_collection.find({member:user.id},function(rooms){
		callback(rooms);
	});
}


exports.findRoomShort = function(roomId,callback){
	_collection.find({_id : roomId},roomFieldS,function(err,docs){
		callback(docs.length > 0 ? docs[0] : undefined);
	});
}
exports.findRoom = function(roomId,callback){
	_collection.find({_id : roomId},function(err,docs){
		callback(docs.length > 0 ? docs[0] : undefined);
	});
}

//	roomOwher	: String,
//	roomName	: String,
//	member		: [String],
//	chat		: [ChatSchema]

exports.addRoom = function(roomInfo,callback){
	var room = new _collection();
	room.roomOwner = roomInfo.roomOwner;
	room.roomName = roomInfo.roomName;
	room.member = roomInfo.member;
	room.chat = roomInfo.chat;
	room.save(function(err){
		callback(!err ? room : undefined);
	});
}
exports.addRoomMember = function(roomId,userId,callback){
	_collection.update({_id:roomId},{$push:{member:userId}},{upsert:false,multi:false},function(err){
		callback(!err);
	});
}
// ルームのメンバーを削除する
// not tested
exports.removeRoomMember = function(roomId,userId,callback){
	_collection.update({_id:roomId},{$pull:{member:userId}},{upsert:false,multi:false},function(err){
		callback(!err);
	});
}

/*
 * チャットを発言する
 */
exports.sayChat = function(user,roomId,message,flag,callback){
	_collection.update({_id:roomId},{$push:{chat:{id:user.id,flag:flag,body:message,lastAccess:new Date()}}},function(err){
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
	_collection.aggregate(	{'$match':{'_id':roomId,'lastAccess':{'$gt':lastAccess}}},
					{'$unwind':'$chat'},
					{'$sort':'-1'},
					{'$project':{'chat':1}},
					{'$limit': count },function(err,chat){
		callback(err ? undefined : chat);
	});
}

