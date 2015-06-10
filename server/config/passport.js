var passport = require('passport');
var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;
var userdb = require('./../models/SchemeModel').userdb;
var bcrypt = require('bcryptjs');
var crypto = require('crypto');

module.exports = function() {
  passport.use('login', new LocalStrategy(
    function(username, password, done) {
      
      userdb.findOne({
        username: username
      }, "activeMeetings activeLines passedLines passedMeetings password username", function(err, user) {
        
        if (user && isValidPassword(user, password)) {
          
          var returnUser = user.toJSON();
          delete returnUser.password;
          return done(null, returnUser);
        } else {
          return done(null, false);
        }
      })
    }
  ));

  passport.use('signup', new LocalStrategy({
      userNameField: 'userName',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, username, password, done) {
      
      //var userToken = randomToken();
      // find a user in Mongo with provided userName
      userdb.findOneAndUpdate({
        'username': username
      }, {
      }, {
        new: true
      }, function(err, user) {
        
        // In case of any error return
        if (err) {
          console.log('Error in SignUp: ' + err);
          return done(err);
        }
        // already exists
        if (user) {
          console.log('User already exists');
          return done(null, false);
        } else {
          // if there is no user with that email
          // create the user
          var newUser = new userdb();
          // set the user's local credentials
          newUser.username = username;
          newUser.password = createHash(password);
          newUser.email = req.body.email;

          // save the user
          newUser.save(function(err) {
            if (err) {
              console.log('Error in Saving user: ' + err);
              throw err;
            }
            console.log('User Registration succesful');
            delete newUser.password;
            return done(null, newUser);
          });
        }
      });

    }));

  passport.serializeUser(function(user, done) {
    if (user) {
      done(null, user._id);
    }
  });

  passport.deserializeUser(function(id, done) {
    User.findOne({
      _id: id
    }).exec(function(err, user) {
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
  })
}

// function randomToken() {
//   try {
//     var buf = crypto.randomBytes(48);

//   } catch (ex) {
//     console.log("no more token");
//     return null;
//   }
//   return buf.toString('hex');

// }

var isValidPassword = function(user, password) {
  return bcrypt.compareSync(password, user.password);
}

var createHash = function(password) {
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}