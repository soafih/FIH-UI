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
    // Save details in database
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
          if(user){
            userdata._id = user._id;
            console.log("Inserted Data: "+JSON.stringify(userdata));
          }
          callback(null, userdata);
        }
      });
    },
    // Generate guid for user creation input for stackato api
    function (user, callback) {
      console.log("Stackato UAA Create user | Start.");

      var newGuid = uuid.v4();
      var userData = {
        "userName": user.username,
        "name": { "formatted": user.first_name + ' ' + user.last_name, "familyName": user.last_name, "givenName": user.first_name }, 
        "emails": [{ "value": user.email }]
      };
      
      var fihToken = req.session.fih_token;
      if (fihToken && fihToken.access_token) {

        var options = {
          url: HOST_API_URL + '/aok/uaa/Users',
          headers: {
            'Authorization': 'Bearer ' + fihToken.access_token,
          },
          method: 'POST',
          json: userData
        };

        request(options, function resCallback(error, response, body) {
          console.log("Response from Stackato UAA Users service: "+response);
          if (response)
            console.log("Stackato UAA Create user | Response code: " + response.statusCode);

          if (!error) { 
            if (response.statusCode == 201) {
              console.log("Body: "+JSON.stringify(body));
              var userData = body;
              user.guid = userData.id;
              console.log("Stackato UAA Create user | Response: " + user);
              callback(null, user);
            }
            if (response.statusCode == 409) {
              callback("Duplicate User Found", null);
            }
          }
          else {
            console.log("Stackato UAA Create User | Generating error response: " + error);
            if (response.statusCode == 409) {
              callback("Error : Duplicate User Found", null);
            }
            callback(error, null);
          }
        });
      }
    },

    // Call stackato api to create user
    function (user, callback) {
      console.log("Stackato Create user | Start.");
      console.log("Creating user with Guid: "+user.guid);
      var fihToken = req.session.fih_token;
      if (fihToken && fihToken.access_token) {

        var options = {
          url: HOST_API_URL + '/v2/users',
          headers: {
            'Authorization': 'Bearer ' + fihToken.access_token,
          },
          method: 'POST',
          json: {
            'guid': user.guid
          }
        };

        request(options, function resCallback(error, response, body) {
          console.log("Response from Stackato Users service: "+response);
          if (response)
            console.log("Stackato Create user | Response code: " + response.statusCode);

          if (!error) { 
            if (response.statusCode == 201) {
              console.log("Body: "+JSON.stringify(body));
              console.log("Stackato Create user | Response: " + body);
              callback(null, user);
            }
            if (response.statusCode == 409) {
              callback("Duplicate User Found", null);
            }
          }
          else {
            console.log("Stackato Create User | Generating error response: " + error);
            if (response.statusCode == 409) {
              callback("Error : Duplicate User Found", null);
            }
            callback(error, null);
          }
        });
      }
    },

    // Associate User with the Organization
    function (user, callback) {
      console.log("Stackato Associate Organizations | User: "+JSON.stringify(user));
      console.log("Processing: "+JSON.stringify(user.orgs));
      async.eachSeries(user.orgs, function (org, callback) {
        var fihToken = req.session.fih_token;
        if (fihToken && fihToken.access_token) {
          console.log("Calling service: "+HOST_API_URL + '/v2/organizations/'+org.guid+'/users/'+user.guid);
          var options = {
            url: HOST_API_URL + '/v2/organizations/'+org.guid+'/users/'+user.guid,
            headers: {
              'Authorization': 'Bearer ' + fihToken.access_token,
            },
            method: 'PUT'
          };

          request(options, function resCallback(error, response, body) {
            console.log("Response from Stackato Associate Org service: " + response);
            if (response)
              console.log("Stackato | Response code: " + response.statusCode);

            if (!error) {
              if (response.statusCode == 201) {
                console.log("Body: " + JSON.stringify(body));
                console.log("Stackato | Response: " + body);
                callback(null);
              }
            }
            else {
              console.log("Stackato | Generating error response: " + error);
              callback("Cannot associate user with the Organization");
            }
          });
        }

      }, function (err) {
        if (err) {
          console.log('Failed to associate user with the Organization');
          callback(err, null);
        } else {
          console.log('Successfully associated user with all organizations');
          callback(null, user);
        }
      });

    },

    // Associate Space with the User
    function (user, callback) {
      console.log("Stackato Associate Spaces | Start.");
      console.log("Processing: "+JSON.stringify(user.spaces));
      async.each(user.spaces, function (space, callback) {
        var fihToken = req.session.fih_token;
        if (fihToken && fihToken.access_token) {
          console.log("Calling service: "+HOST_API_URL + '/v2/users/'+user.guid+'/spaces/'+space.guid);
          var options = {
            url: HOST_API_URL + '/v2/users/'+user.guid+'/spaces/'+space.guid,
            headers: {
              'Authorization': 'Bearer ' + fihToken.access_token,
            },
            method: 'PUT'
          };

          request(options, function resCallback(error, response, body) {
            console.log("Response from Stackato Associate Space service: " + response);
            if (response)
              console.log("Stackato | Response code: " + response.statusCode);

            if (!error) {
              if (response.statusCode == 201) {
                console.log("Body: " + JSON.stringify(body));
                console.log("Stackato | Response: " + body);
                callback(null);
              }
            }
            else {
              console.log("Stackato | Generating error response: " + error);
              callback("Cannot associate user with the Spaces");
            }
          });
        }

      }, function (err) {
        if (err) {
          console.log('Failed to associate user with the Spaces');
          callback(err, null);
        } else {
          console.log('Successfully associated user with all spaces');
          callback(null, user);
        }
      });
    },

    // Update user state in database
    function(user, callback){
      var collection = db.get('coll_user');
      console.log("Updating User: "+user._id);
      collection.update({_id: user._id}, {$set: {status: 'active', guid: user.guid}}, 
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
