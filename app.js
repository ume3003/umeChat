/**
 * Module dependencies.
 */
var 
	 so				= require('./shareObj'),
	io				= require('./io'),
	auth			= require('./passport-google'),
	db				= require('./mongo');
	

so.init();
db.init();

// all environments
so.app.set('secretKey',so.ssKey);         // appにセットしておく
so.app.set('cookieSessionKey',so.csKey);
so.app.set('host',so.host);
so.app.set('port',so.port);
so.app.set('views', __dirname + '/views');
so.app.set('view engine', 'ejs');
so.app.use(so.express.favicon());
so.app.use(so.express.logger('dev'));
so.app.use(so.express.bodyParser());
so.app.use(so.express.cookieParser(so.app.get('secretKey')));    // Verの変更によりこっちでうける
so.app.use(so.express.methodOverride());
so.app.use(so.express.session({
   key : so.app.get('cookieSessionKey'),
  store  : so.store,
  cookie : { maxPage : 1000 * 60 * 60 * 24 * 7}  // maxAgeを指定することで、redius内のデータもこの期間は保持される
  }));

so.app.use(so.passport.initialize());
so.app.use(so.passport.session());
so.app.use(so.app.router);
so.app.use(so.express.static(so.path.join(__dirname, 'public')));

// passport 
auth.init();

// development only
if ('development' == so.app.get('env')) {
	so.app.use(so.express.errorHandler());
}

so.app.get('/', so.routes.index);
so.app.get('/logout', so.routes.logout);
so.app.get('/users', so.user.list);

// auth routesの追加
auth.addRoutes();

// httpサーバ
so.server = so.http.createServer(so.app);
so.server.listen(so.app.get('port'), function(){
  console.log('Express server listening on ' + so.app.get('host') + ' port ' + so.app.get('port'));
});

// チャット
io.init();
