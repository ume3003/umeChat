var _collection,
	_schema;
exports.collection = function(){
	return _collection;
}
exports.schema = function(){
	return _schema;
}
exports.init = function(db){

	_schema	= new db.Schema({
			sayid		: String,
			flag		: Number,
			body		: String,
			lastAccess	: {type:Date,default:Date.now}
	});
	_collection = db.model('chat',_schema);
}
