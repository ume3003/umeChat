var collection;
exports.getCollection = function(){
	return collection;
}
exports.init = function(db){
	NotifySchema = new db.Schema({
		from_id			: String,
		to_id			: String,
		type			: {type:Number,default:0},
		read			: {type:Boolean,default:false},
		param			: String
	});
	collection = db.model('Notify',NotifySchema);
}

exports.log = function(){
	console.log('test');
}
