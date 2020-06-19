var createError = require('http-errors');
var http = require('http');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var authenticate = require('./authenticate');
var config = require('./config');

// socket io
//var app = express();
var server = app.listen(process.env.PORT);
var server = app.listen(3000);
console.log(process.env.PORT);
var io = require('socket.io').listen(server);

// routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var conversationsRouter = require('./routes/conversations');
//var socketRouter = require('./routes/sockets')(io);
var messagesRouter = require('./routes/messages')(io);

// Mongo/mongoose connection
const mongoose = require('mongoose');
const url = config.mongoUrl;
const connect = mongoose.connect(url);

// connect to db
connect.then((db)=>{
  console.log('Connected to db server');
}, (err)=>console.log(err));



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/conversations', conversationsRouter);
//app.use('/sockets', socketRouter);
app.use('/messages', messagesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
