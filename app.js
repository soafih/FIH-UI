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
var db = monk(process.env.MONGODB_CONN_STR);
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cookieParser());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: true,
  saveUninitialized: true
}));

var oauth2 = require('simple-oauth2')({
  clientID: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  site: process.env.STACKATO_API_URL,
  tokenPath: '/aok/uaa/oauth/token',
  authorizationPath: '/aok/uaa/oauth/authorize',
  useBasicAuthorizationHeader: true
});

// Authorization uri definition
var authorization_uri = oauth2.authCode.authorizeURL({
  redirect_uri: process.env.OAUTH_REDIRECT_URL
});

// Initial page redirecting to Github
app.get('/auth/login', function (req, res) {
    console.log("Is SSL Enabled: "+process.env.NODE_TLS_REJECT_UNAUTHORIZED);
    res.redirect(authorization_uri);
});

// Callback service parsing the authorization token and asking for the access token
app.get('/auth/callback', function (req, res) {
  
  var code = req.query.code;
  console.log("Entered auth callback after auth | Auth code: "+code);
  console.log("oAuth Request Headers in Callback: "+JSON.stringify(req.headers));
    oauth2.authCode.getToken({
      code: code,
      redirect_uri: process.env.OAUTH_REDIRECT_URL
    }, saveToken);

    function saveToken(error, result) {

      if (error) { console.log('Access Token Error', error.message); }

      console.log("Saving token in oAuth callback: "+JSON.stringify(result));

      token = oauth2.accessToken.create(result);
      req.session.fih_token = result;
      //req.session.cookie.expires = new Date(Date.now() + result.expires_in*1000);
      console.log("Expires in: "+req.session.cookie.expires);
      //res.cookie('fih_token', result.access_token, { maxAge: result.expires_in, httpOnly: true });
      console.log('Cookie created successfully');
      console.log('Redirect url: '+req.session.oauth2return);
      var redirect = '/';//req.session.oauth2return
      delete req.session.oauth2return;
      res.redirect(redirect);
    }
});

app.get('/auth/logout', function(req, res, next){
  console.log("Logging out of session.!");
  var token = oauth2.accessToken.create(req.session.fih_token);
  token.revoke('access_token', function(error) {

    // Revoke the refresh_token
    token.revoke('refresh_token', function(error) {
      console.log('token revoked.');
      req.session.oauth2return = req.originalUrl;
      delete req.session.fih_token;
      delete req.session.username;
      delete req.session.guid;
      req.session.isAuthenticated = false;
      delete req.session.userobj;
      res.redirect("/auth/login");
    });
  });
  
});

app.use(function (req, res, next) {
  if (req.session && req.session.fih_token && req.session.fih_token.access_token) {
    var token = req.session.fih_token.access_token;
    console.log("Access token found in session: " + token);

    var b64string = token;
    var buf = new Buffer(b64string.split('.')[1], 'base64');
    var tokenDecoded = JSON.parse(buf.toString("ascii"));
    console.log("Decoded Token: " + JSON.stringify(tokenDecoded));

    req.headers["x-authenticated-user-username"] = tokenDecoded.user_name;
    req.headers["x-authenticated-user-id"] = tokenDecoded.user_id;
    req.headers["x-authenticated-email"] = tokenDecoded.email;
    next();
  }
  else {
    console.log("Token not found. Redirecting to login page.");
    console.log("Session Object Value: "+JSON.stringify(req.session));
    if (req.query.return) {
      req.session.oauth2return = req.query.return;
    }
    else{
      req.session.oauth2return = req.originalUrl;
    }
    console.log("Redirect URL: "+req.session.oauth2return);
    res.redirect("/auth/login");
  }
});

// Make our db accessible to our router & set userId to be displayed in nav bar
app.use(function(req,res,next){
    req.db = db;
    res.locals.userId = req.get('x-authenticated-user-username');
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/fih/apis', apis);
app.use('/fih/apps', apps);
app.use('/fih/dbconfig', dbconfig);
app.use('/fih/stackatoapis', stackatoapis);
app.use('/fih/security', security);

app.use(function(req, res, next) {
    
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
