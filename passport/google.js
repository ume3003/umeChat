var so = require('../shareObj'),
	db = require('../db');

exports.init = function()
{
	var passport = so.passport,
		GoogleStrategy	= require('passport-google').Strategy;


	passport.use(
		new GoogleStrategy(
		{
			returnURL	:so.host + ':' + so.port + '/auth/google/return',
			relm		:so.host + ':' + so.port
		},
		function(identifier,profile,done){
			process.nextTick(function(){
				profile.identifier = identifier;
				profile.type = 'Google';
				return done(null,profile); // ここのprofileがreq.userとしてみることができる
			});
		}));
};
exports.addRoutes = function()
{
	var passport = so.passport,
		GoogleStrategy	= require('passport-google').Strategy;


	so.app.get('/auth/google', 
		passport.authenticate('google', { failureRedirect: '/login' }),
		function(req, res) {
			res.redirect('/');
		}
	);
	so.app.get('/auth/google/return', 
		passport.authenticate('google', { failureRedirect: '/login' }),
		function(req, res) {
			if(req.user && req.user.displayName){
				req.session.user = req.user;
				req.session.user.id = req.session.passport.user;
				req.session.userID = req.user.displayName;
			}
			else{
				console.log('login failure');
			}
			res.redirect('/');
		}
	);
};
