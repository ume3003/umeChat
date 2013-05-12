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
