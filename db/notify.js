	// Notify				from		to			param
	// 0,Friend	request		requester	approver				ユーザーでない場合はNotify行かない。
	// 1		approved	approver	requester				ユーザーになった場合にはもどりのNotifyはいく
	// 2.Room	invited		inviter		joinner		roomId	
	// 3		joined		joinner		inviter
	// 4.Chat	say			roomId		reciever	room.chatId						
	// 

var _collection;

exports.collection = function(){
	return _collection;
}
exports.init = function(db){
	NotifySchema = new db.Schema({
		from_id			: String,
		to_id			: String,
		type			: {type:Number,default:0},
		read			: {type:Boolean,default:false},
		param			: String,
		notifyTime		: {type:Date,default:Date.now}
	});
	_collection = db.model('Notify',NotifySchema);
}
exports.requestNotify = function(requesterId,approverId,callback){
	exports.notifyMessage(requesterId,approverId,0,undefined,function(notify){
		callback(notify);	
	});
}
exports.approveNotify = function(approverId,requesterId,callback){
	exports.notifyMessage(approverId,requesterId,1,undefined,function(notify){
		callback(notify);	
	});
}
exports.inviteNotify = function(inviterId,joinnerId,roomId,callback){
	exports.notifyMessage(inviterId,joinnerId,2,roomId,function(notify){
		callback(notify);	
	});
}
exports.joinNotify = function(joinnerId,inviterId,roomId,callback){
	exports.notifyMessage(joinnerId,inviterId,3,roomId,function(notify){
		callback(notify);	
	});
}
exports.chatNotify = function(roomId,receiverId,chatId,callback){
	exports.notifyMessage(roomId,receiverId,4,chatId,function(notify){
		callback(notify);	
	});
}
/*
 * 通知を発行する
 */
exports.notifyMessage = function(from,to,type,param,callback){
	var newNotify = new _collection();
	newNotify.from_id = from;
	newNotify.to_id = to;
	newNotify.type = type;
	newNotify.read = false;
	newNotify.param = param;
	newNotify.notifyTime = new Date();
	newNotify.save(function(err){
		callback(!err ? newNotify : undefined);
	});
}
/*
 *	自分の未読の通知を取得
 */
exports.findMyNotify = function(me,callback){
	_collection.find({to_id:me.id,read:false},{from_id:1,type:2,param:3,notifyTime:4},function(err,notifies){
		callback(notifies);
	});
}
/*
 *	通知を既読にする
 *	通知IDを配列で渡すこと
 */
exports.readNotify = function(me,readArticle,callback){
	_collection.update({to_id:me.id,param:{$in:readArticle}},{read:true},function(err){
		callback(!err);
	});
}
