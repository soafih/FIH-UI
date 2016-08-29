var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');
var apis = require('./routes/apis');
var apps = require('./routes/apps');
var dbconfig = require('./routes/dbconfig');
var stackatoapis = require('./routes/stackatoapis');
var security = require('./routes/security');

// Initialize Monk for establishing connection with MongoDB
var monk = require('monk');
//var db =  monk('mongodb://5eb31b82-3347-481f-a7f5-f9759fb2583a:22669d9e-531d-4176-bd5c-7844e1add561@10.135.4.49:15001/db');
var db = monk(process.env.MONGODB_URL);
console.log("MongoDB URL: "+process.env.MONGODB_URL);
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

/*
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2');

passport.use(new OAuth2Strategy({
    authorizationURL: 'https://api.stackato-poc.foxinc.com/uaa/oauth/authorize',
    tokenURL: 'https://aok.stackato-poc.foxinc.com/uaa/oauth/token',
    clientID: 'srest',
    clientSecret: 'welcome1',
    callbackURL: "https://foxintegrationhub.soadev.stackato-poc.foxinc.com/srest/console/auth/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ exampleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/',
  passport.authenticate('oauth2'));

app.get('/srest/console/auth/callback',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});
*/

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    res.locals.userId = req.get('x-authenticated-user-username');
    next();
});

app.use(cookieParser());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({secret: 'dummySecureKey'}));

app.use('/', routes);
app.use('/users', users);
app.use('/fih/apis', apis);
app.use('/fih/apps', apps);
app.use('/fih/dbconfig', dbconfig);
app.use('/fih/stackatoapis', stackatoapis);
app.use('/fih/security', security);

app.use(function(req, res, next) {
    console.log('Cookies: ', req.cookies);
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
