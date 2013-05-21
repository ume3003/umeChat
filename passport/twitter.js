var so = require('../shareObj'),
	db = require('../db');

exports.init = function()
{
	var passport = so.passport,
		TwitterStrategy	= require('passport-twitter').Strategy;

	passport.use(
		new TwitterStrategy(
		{
			callbackURL	:so.host + ':' + so.port + '/auth/twitter/callback',
			consumerKey : so.cmKey,
			consumerSecret : so.cmSec
		},
		function(token,tokenSecret,profile,done){
			process.nextTick(function(){
				profile.identifier = token;
				profile.type = 'Twitter';
				return done(null,profile); // ここのprofileがreq.userとしてみることができる
			});
		}));
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
