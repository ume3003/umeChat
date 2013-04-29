// share objects
module.exports = {
	express : undefined,
	Session : undefined,
	server	: undefined,
	store	: undefined,
	connect : undefined,
	routes	: undefined,
	app		: undefined,
	host	: undefined,
	port	: undefined,
	util	: undefined,
	user	: undefined,
	path	: undefined,
	http	: undefined,
	passport: undefined
};

module.exports.init = function(){
	var	RedisStore;
	module.exports.express	= require('express');
	module.exports.Session	= module.exports.express.session.Session;
	module.exports.connect	= require('connect');
	module.exports.routes	= require('./routes');
	module.exports.app		= module.exports.express();
	module.exports.host		= process.env.HOST || 'http://127.0.0.1';
	module.exports.port		= process.env.PORT || '3000';
	module.exports.util		= require('util');
	module.exports.user		= require('./routes/user');	
	module.exports.path		= require('path');
	module.exports.http		= require('http');
	module.exports.passport = require('passport');
	if ('development' == module.exports.app.get('env')) {
		module.exports.store = new (module.exports.connect.session.MemoryStore)();
		console.log('boot develop mode');
	}
	else{
		RedisStore = require('connect-redis')(module.exports.express);
		console.log('boot normal mode');
		module.exports.store = new RedisStore({db : 1,prefix:'session:'});  // 1はredis内のDB番号
	}
};
