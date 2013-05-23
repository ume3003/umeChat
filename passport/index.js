exports.google = require('./google');
exports.twitter = require('./twitter');

var so = require('../shareObj'),
	db = require('../db');

exports.init = function(){
	var passport = so.passport;

	passport.serializeUser(function(user,done){
		var userKey = module.exports.userKey(user);
		// ここでDBに保存
		db.User.findUser({email : userKey},function(userDB){
			if(userDB === undefined){	// 新規
				console.log(' new user ');
				db.User.addUser(user,function(err,newUser){
					console.log('after add user ' ,newUser.id);
					done(null,newUser.id);
				});
			}
			else{ // 既存
				console.log(' current user ' + userDB.id);
				done(null,userDB.id);
			}
		});
	});

	passport.deserializeUser(function(objID,done){
		db.User.findUser({_id : objID},function(userDB){
			done(null,userDB);
		});
	});
	exports.google.init();
	exports.twitter.init();

};

exports.addRoutes = function(){
	exports.google.addRoutes();
	exports.twitter.addRoutes();
};
module.exports.userPhoto = function(user){
	var photo;
	if(user.type === 'Twitter'){
		photo = user.photos[0].value;
	}
	else{
		photo = 'public/images/none.jpg';
	}
	return photo;
};
module.exports.userKey = function(user){
	var userKey ;
	if(user.type === 'Twitter'){
		userKey = user.username;
	}
	else if(user.type === 'Google'){
		userKey = user.emails[0].value;
	}
	return userKey;
};
