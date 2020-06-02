var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', authenticate.verifyUser, function(req, res, next) {
  if(authenticate.verifyAdmin(req.user.admin)){
    User.find({})
    .then((user)=>{
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json((user));
    }, (err)=>next(err))
    .catch((err)=>next(err));
  }
  else{
    var err = new Error('You are not authorized');
    err.status = 401;
    next(err);
  }
});

router.post('/signup', (req, res, next) => {
  console.log(req.body.username);
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      if(req.body.firstname)
        user.firstname = req.body.firstname;
      if(req.body.lastname)
        user.lastname = req.body.lastname;
      user.save((err, user) => {
        if(err){
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return ;
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
        });
      }); 
    }
  });
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, _id: req.user._id, token: token, status: 'You are successfully logged in!'});
});

router.get('/logout', (req, res) => {
  if(req.session){
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else{
    var err = new Error('You are not logged in');
    err.status = 403;
    next(err);
  }
});

module.exports = router;
