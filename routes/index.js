
/*
 * GET home page.
 */

exports.index = function(req, res){
	console.log('in index ' ,req.sessionID);
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
    res.redirect('/');
  });
};
