
/*
 * GET home page.
 */

exports.index = function(req, res){
	if(req.session.user){
		console.log('has user data ');
		req.user = req.session.user;
	}
	else{
		console.log('no user data');
	}
  res.render('rq-index', { 
        title: 'チャット'
      , user:req.user
      }
  );
};
exports.logout = function(req,res){
  req.session.destroy(function(err){
    if(err){
      console.log(err);
    }
	console.log('logout ',req.sessionID);
    res.redirect('/');
  });
};
