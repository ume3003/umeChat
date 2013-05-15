var _collection,
	_schema,
	_chat,
	_db,
	roomFieldS	= {
		roomOwner :1,
		roomName :2,
		member :3,
		created:4,
		lastAccess:5
	};

exports.collection = function(){
	return _collection;
};

exports.init = function(db,chat){
	_schema	= new db.Schema({
			roomOwner	: String,
			roomName	: String,
			member		: [String],
			mode		: Number,
			chat		: [chat.schema()],				// id:{user.id} flag:{reader's count} body:{message}
			created		: {type:Date,default:Date.now},
			lastAccess	: {type:Date,default:Date.now}
	});
	_chat = chat;
	_db = db;
	_collection = db.model('Room',_schema);
};

/*
 * roomデータから入室しているルーム情報をとる。Idとname
 */
exports.getJoinRoomList = function(user,callback){
	_collection.find({member:user.id},function(err,rooms){
		callback(!err ? rooms : undefined);
	});
}
exports.findChat = function(user,tgtId,callback){
	_collection.aggregate({'$match':{member:user.id}},{'$match':{member:tgtId}},{'$match':{mode:0}},
			{'$project':{_id:1,roomOwner:2,roomName:3,member:4,mode:5,created:6,lastAccess:7}},function(err,rooms){
		callback(!err ? rooms : undefined);
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
	room.mode = roomInfo.mode !== undefined ? roomInfo.mode : 1;
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
exports.getRoomMember = function(roomId,callback){
	_collection.find({_id:roomId},{roomName:1,member:2},function(err,roomInfo){
		if(!err && roomInfo !== undefined && roomInfo[0].member !== undefined){
			callback(roomInfo[0].member);
		}
		else{
			callback(undefined);
		}
	});
}
exports.getLeftRoomMember = function(roomId,joinMem,callback){
	var leftMember = undefined,
		joinString = joinMem.join(',');
	console.log('left joinM',joinMem,joinString);
	exports.getRoomMember(roomId,function(allMember){
		console.log('all mem ' ,allMember);
		if(allMember !== undefined){
			leftMember = [];
			for(var i = 0;i < allMember.length;i++){
				if(joinString.indexOf(allMember[i]) < 0){
					leftMember.push(allMember[i]);
				}
			}
		}
		callback(leftMember);
	});
}
/*
 * チャットを発言する
 * ここだけかなり特別。チャットのIDをNotifyで使う
 */
exports.sayChat = function(userId,roomId,message,flag,callback){
	var Chat = _chat.collection(),		// Collectionから作成したオブジェクトでアップデートするとIDが取れる
		newChat = new Chat();
	newChat.sayid = userId;
	newChat.flag = flag;
	newChat.body = message;
	newChat.lastAccess = new Date();
	_collection.update({_id:roomId},{$push:{chat:newChat}},function(err){
		console.log(newChat.id);		// _idが撮れてる
		callback(!err ? newChat : undefined);
	});
}

/*
 * 指定日時より前のチャットを指定件数だけ取得する
 * db.rooms.aggregate({'$unwind':'$chat'},
 *	{'$match':{'_id':ObjectId('51921a3daaf6f5000000000d')}},
 *	{'$match':{ 'chat.lastAccess': { '$lt': ISODate("2013-05-14T11:04:50.546Z") } } }, 
 *	{ '$project': { chat: 1,_id:0 } },
 *	{'$sort':{'chat.lastAccess':-1}},
 *	{'$limit':5},
 *	{'$sort':{'chat.lastAccess':1}})
 * unwind:embedded docの展開
 * soft:展開したdocのソート
 * project:出力フィールドの指定
 * 戻りは配列。
 * 日付以前　＞　$lt 
 * 件数制限 $limit
 * aggrigateはフィルタを順に処理していくので、
 * ソートして、後ろから５件とり、その５件を昇順にソートして渡す、とか可能。
 * chatの埋め込みドキュメントを展開する（レコード扱いになる？）
 * idが該当するレコードに絞る
 * 記録日以前のレコードに絞る
 * chatのフィールドだけ表示。デフォルトだと_idのフィールドもでちゃうので０指定して隠す
 * 新しい順からとるので−１ソート
 * 前から５件とる
 * ５件を古い順にソートして返す
 */
exports.getLog = function(user,roomId,lastAccess,count,callback){
	console.log('origin String ',lastAccess);
	var dLast = new Date(lastAccess);
	_collection.aggregate({'$unwind':'$chat'},
					{'$match':{'_id':_db.Types.ObjectId(  roomId  )}},
					{'$match':{'chat.lastAccess' : {'$lt':dLast}}},
					{'$project' : {'chat':1,'_id':0}},
					{'$sort' : {'chat.lastAccess': -1}}, 
					{'$limit': count },
					{'$sort' : {'chat.lastAccess': 1}}, 
					function(err,docs){
		callback(!err ? docs : undefined);
	});
}
exports.incChat = function(user,roomId,chatId,callback){
	_collection.update({'_id':roomId,'chat._id':chatId},{'$inc':{'chat.$.flag':1}},function(err){
		callback(!err);
	});
}
exports.getOneChat = function(user,roomId,chatId,callback){
	_collection.aggregate({'$unwind':'$chat'},
				{'$match':{'_id':_db.Types.ObjectId(  roomId  )}},
				{'$match':{'chat._id':_db.Types.ObjectId(  chatId  )}},
				{'$project' : {'chat':1,'_id':0}},
			function(err,docs){
				callback(!err ? docs : undefined);
			}
	);
}
