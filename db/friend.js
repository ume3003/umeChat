var _collection,
	_schema;
exports.collection = function(){
	return _collection;
}
exports.schema = function(){
	return _schema;
}
exports.init = function(db){

	_schema = new db.Schema({
		user_id		: String,
		email		: String,
		stat		: String		// 0:友人申請中　1:友人申請受け中  2:友人
	});
	_collection = db.model('friend',_schema);
}


