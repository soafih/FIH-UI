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
console.log("MongoDB URL: "+process.env.MONGODB_CONN_STR);
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


//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var port = process.env.PORT || 3000;
var host = process.env.VCAP_APP_HOST || "127.0.0.1";
console.log("Host: "+host+":"+port);
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
app.get('/auth', function (req, res) {
    req.session.fih_token = {};
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
      console.log("Converted Token: "+token);
      console.log("Expires in: "+result.expires_in);
      res.cookie('fih_token', result.access_token, { maxAge: result.expires_in, httpOnly: true });
      //res.cookie('accessToken',token, { maxAge: 900000 });
      console.log('cookie created successfully');
      res.redirect("/");
    }
});

app.get('/logout', function(req, res, next){
  console.log("Logging out of session.!");
  var token = oauth2.accessToken.create(req.session.fih_token);
  token.revoke('access_token', function(error) {
    // Session ended. But the refresh_token is still valid.

    // Revoke the refresh_token
    token.revoke('refresh_token', function(error) {
      console.log('token revoked.');
      res.cookie('fih_token', { maxAge: Date.now(0)});
      res.redirect("/auth");
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

    req.headers["x-authenticated-user-username"]  = tokenDecoded.user_name;
    req.headers["x-authenticated-user-id"]  = tokenDecoded.user_id;
    req.headers["x-authenticated-email"]  = tokenDecoded.email;
    next();
  }
  else {
    console.log("Token not found. Redirecting to login page.");
    console.log("Header: "+JSON.stringify(req.headers));
    res.redirect("/auth");
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
