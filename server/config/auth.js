var passport = require('passport');

exports.authenticateLogin = function(req, res, next) {
  req.body.username = req.body.username.toLowerCase();
  var auth = passport.authenticate('login', function(err, user) {

    if (err) {
      return next(err);
    }
    if (!user) {
      res.send({
        success: false
      })
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
     
      res.send({
        success: true,
        user: user
      });
    })
  })
  auth(req, res, next);
};

exports.authenticateSignUp = function(req, res, next) {
 
  req.body.username = req.body.username.toLowerCase();
  var auth = passport.authenticate('signup', function(err, user) {
   
    if (err) {
      return next(err);
    }
    if (!user) {
      res.send({
        success: "userExist"
      })
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }

      res.send({
        success: true,
        user: user
      });
    })
  })
  auth(req, res, next);
};