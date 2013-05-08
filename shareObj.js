// share objects
var config = require('config');

module.exports = {
	ssIds	: undefined,
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
	ssKey	: undefined,
	csKey	: undefined,
	mongoURL: undefined,
	errMsg	: undefined,
	msg		: undefined,
	passport: undefined
};

module.exports.init = function(){
	var	RedisStore;
	console.log('configType=',config.configType);
	console.log('test case',config.testVal);

	module.exports.ssIds	= {};
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
	module.exports.ssKey	= config.secretKey;
	module.exports.csKey	= config.cookieSessionKey;
	module.exports.mongoURL = config.mongoURL;
	module.exports.errMsg	= config.errMsg;
	module.exports.msg		= config.msg;
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
