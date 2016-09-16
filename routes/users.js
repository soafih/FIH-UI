var express = require('express');
var router = express.Router();

var async = require('async');
var uuid = require('node-uuid');

var stackato = require('./mod/stackato-mod');
var permCheck = require('./mod/permission-check');

var querystring = require('querystring');
var request = require('request');

var HOST_API_URL = process.env.STACKATO_API_URL;
var HOST_AOK_URL = process.env.STACKATO_AOK_URL;
var STACKATO_API_TIMEOUT = parseInt(process.env.STACKATO_API_TIMEOUT);
var USERNAME = process.env.FIH_SVC_USER;
var PASSWORD = process.env.FIH_SVC_PASSWORD;

var db = {};

router.get('/', permCheck.checkPermission('user.view'), function(req, res) {
    var db = req.db;
    var collection = db.get('coll_user');
    collection.find({}, function(err, users){
        if (err) throw err;
      	res.json(users);
    });
});

router.get('/roles', permCheck.checkPermission('user.view'), function(req, res) {
    var db = req.db;
    var collection = db.get('coll_role');
    collection.find({}, function(err, roles){
        if (err) throw err;
      	res.json(roles);
    });
});

router.post('/', permCheck.checkPermission('user.create'), function (req, res) {
  console.log("Creating user..");
  var db = req.db;

  async.waterfall([
    function (callback) {
      console.log("Inserting data");
      console.log("body: "+req.body);
      var collection = db.get('coll_user');
      var firstname="";
      var lastname = "";
      if(req.body.fullname){
        firstname = req.body.fullname.split(" ")[0];
        if(req.body.fullname.length > 1){
          lastname=req.body.fullname.split(" ")[1];
        }
      }
      var userdata= {
        username: req.body.username,
        email: req.body.email,
        superuser: req.body.superuser,
        roles: req.body.roles,
        orgs: req.body.orgs,
        spaces: req.body.spaces,
        first_name: firstname,
        last_name: lastname,
        status: 'saved',
        created_by: req.headers["x-authenticated-user-username"],
        creation_date: new Date(),
        last_updated_by: req.headers["x-authenticated-user-username"],
        last_update_date: new Date()
      };
      console.log(userdata);
      collection.insert(userdata, function (err, user) {
        if (err) {
          console.log("Error in saving user"+err);
          callback(err, null);
        }
        else {
          console.log("Received response:");
          if(user)
            console.log("Inserted Data: "+JSON.stringify(user));
          callback(null, user);
        }
      });
      
    },
    function (user, callback) {
      console.log("Stackato Create user | Start.");

      var newGuid = uuid.v4();
      
      var fihToken = req.session.fih_token;
      if (fihToken && fihToken.access_token) {

        var options = {
          url: HOST_API_URL + '/v2/users',
          headers: {
            'Authorization': 'Bearer ' + fihToken.access_token,
          },
          method: 'POST',
          json: {
            'guid': newGuid,
            'username':  req.body.username,
            'emails':  req.body.email
          }
        };

        request(options, function resCallback(error, response, body) {
          if (response)
            console.log("Stackato Create user | Response code: " + response.statusCode);

          if (!error && (response.statusCode == 201)) {

            console.log("Stackato Create user | Response: " + body);
            callback(null, user);
          }
          else {
            console.log("Stackato Create User | Generating error response: " + error);
            callback(error, null);
          }
        });

      }
        
    },
    function(user, callback){
      var collection = db.get('coll_user');
      console.log("Updating User: "+user._id);
      collection.update({_id: user._id}, {$set: {status: 'active'}}, 
          function(err, response){
              if (err) callback(err, null);
              console.log("Successfully updated user status: "+JSON.stringify(response));
              if(response.nModified === 0){
                callback("User not found!", null);
              }
              callback(null, response);
      });
    }
    
  ], function (err, result) {
    console.log("Stackato Create User | Result: "+result);
    if(err){
      res.status(401).send({success: false, data: err});
    }
    else{
      res.send({success: true, data: result});
    }
  });

  
});

module.exports = router;
