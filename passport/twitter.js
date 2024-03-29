var so = require('../shareObj'),
	db = require('../db');
	
exports.init = function()
{
	var passport = so.passport,
		TwitterStrategy	= require('passport-twitter').Strategy,
	ts = 
		new TwitterStrategy(
		{
			callbackURL	:so.host + ':' + so.port + '/auth/twitter/callback',
			consumerKey : so.cmKey,
			consumerSecret : so.cmSec
		},
		function(token,tokenSecret,profile,done){
			process.nextTick(function(){
				profile.identifier = token;
				profile.tokenSecret = tokenSecret;
				profile.type = 'Twitter';
				console.log('token= ',token);
				console.log('secret= ',tokenSecret);
				return done(null,profile); // ここのprofileがreq.userとしてみることができる
			});
		});
	passport.use(ts);
};
exports.addRoutes = function()
{
	var passport = so.passport,
		TwitterStrategy	= require('passport-twitter').Strategy;


	so.app.get('/auth/twitter', 
		passport.authenticate('twitter', { failureRedirect: '/login' }),
		function(req, res) {
			res.redirect('/');
		}
	);
	so.app.get('/auth/twitter/callback', 
		passport.authenticate('twitter', { failureRedirect: '/login' }),
		function(req, res) {
			if(req.user ){
				req.session.user = req.user;
				req.session.user.id = req.session.passport.user;
				req.session.userID = req.user.username;
			}
			else{
				console.log('login failure');
			}
			res.redirect('/');
		}
	);
};
