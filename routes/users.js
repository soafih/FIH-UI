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

router.get('/objectid/:objectid',  function(req, res) {
    var db = req.db;
    var collection = db.get('coll_user');
    console.log("Fetching user data with object id: "+req.params.objectid);
    collection.findOne(req.params.objectid, function(err, app){
        if (err) throw err;
      	res.json(app);
    });
});

router.get('/roles/objectid/:objectid',  function(req, res) {
    var db = req.db;
    var collection = db.get('coll_role');
    console.log("Fetching role data with object id: "+req.params.objectid);
    collection.findOne(req.params.objectid, function(err, role){
        if (err) throw err;
      	res.json(role);
    });
});


router.get('/role/name/:name', permCheck.checkPermission('user.view'), function(req, res) {
    console.log("Fetching users for role: "+req.params.name);
    var db = req.db;
    var collection = db.get('coll_user');
    collection.find({roles: req.params.name}, {_id:1, username: 1}, function(err, users){
        if (err) throw err;
        console.log("User for role: "+JSON.stringify(users));
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

router.delete('/roles/:roles', permCheck.checkPermission('user.delete'), function(req, res){
  console.log("Deleting role..");
  
  var roles = req.params.roles.split(",");
  console.log("Roles: "+roles);
  async.waterfall([
        
    function (callback) {
      console.log("Deleting roles from users");
      
      async.each(roles, function (role, callback) {
        console.log("Deleting role: "+role);
        var collection = db.get('coll_user');
        collection.find({roles: role}, function(err, users){
            if (err) throw err;
            async.each(users, function (user, callback) {
              var currentRoles = user.roles;
              

            });
        });
        //collection.update({}, {$pull: {roles: "testrole3"}},  { multi: true });
        callback();
      }, function (err) {
        if (err) {
          console.log('Error in user roles deletion');
          callback(err, null);
        } else {
          console.log('User roles deleted successfully');
          callback(null, "success");
        }
      });
    },
    // Deleting role from coll_role
    function (msg, callback) {
      async.each(roles, function (role, callback) {

        console.log("Deleting role:"+role);
        var collectionRole = db.get('coll_role');
        collectionRole.remove({ name: role });
        callback();
      }, function (err) {
        if (err) {
          console.log('Error in roles deletion');
          callback(err, null);
        } else {
          console.log('Roles deleted successfully');
          callback(null, "success");
        }
      });
    }
  ],
    // waterfall callback
    function (err, result) {
      console.log("Delete role | Result: " + result);
      if (err) {
        res.status(500).send({ success: false, data: err });
      }
      else {
        res.send({ success: true, data: result });
      }
    });
});

router.post('/roles', permCheck.checkPermission('user.create'), function (req, res) {
  console.log("Creating new role..");
  var db = req.db;

  var selectedUsers = req.body.users;
  delete req.body.users;
  async.waterfall([
    // Check whether role already exist in database.
    function (callback) {
      console.log("Checking whether role already exist in database");
      var collection = db.get('coll_role');
      collection.find({ name: req.body.name }, function (err, roles) {
        console.log("Roles: "+roles);
        
        if (err) {
          callback(err, null);
        }
        else if (roles && roles.length > 0) {
          console.log("Role length:"+roles.length);
          callback({ success: false, status_code: 409, data: "Role with same name already exist!" }, null);
        }
        else {
          callback(null, "success");
        }
      });
    },
    // Save details in database
    function (msg, callback) {
      console.log("Inserting role data");
      var newrole = req.body;
      newrole.creation_date = new Date();
      newrole.created_by = req.headers["x-authenticated-user-username"];
      newrole.last_updated_by = req.headers["x-authenticated-user-username"];
      newrole.last_update_date = new Date();
      
      var collection = db.get('coll_role');
      collection.insert(newrole, function (err, role) {
        if (err) {
          console.log("Error in saving role" + err);
          callback(err, null);
        }
        else {
          console.log("Received response:");
          if (role) {
            console.log("Inserted Data: " + JSON.stringify(role));
            callback(null, role);
          }
        }
      });
    },

    // Update user state in database
    function (role, callback) {
      console.log("Updating roles of users: "+selectedUsers);
      async.each(selectedUsers, function (userid, callback) {

        console.log("Updating User: " + userid+" with role:"+role.name);
        var collection = db.get('coll_user');
        collection.update({ _id: userid }, { $addToSet: { roles: role.name } });
        callback();
      }, function (err) {
        if (err) {
          console.log('Error in user`s role updation');
          callback(err, null);
        } else {
          console.log('Roles added to users successfully');
          callback(null, "success");
        }
      });
    }
  ],
    // waterfall callback
    function (err, result) {
      console.log("Create role | Result: " + result);
      if (err) {
        res.status(500).send({ success: false, data: err });
      }
      else {
        res.send({ success: true, data: result });
      }
    });
});


router.post('/role/update', permCheck.checkPermission('user.create'), function (req, res) {
  console.log("Updating role..");
  var db = req.db;
  console.log("Request: "+JSON.stringify(req.body));
  var changeInUsers = req.body.changeInUsers;
  async.waterfall([
    // Update user state in database
    function (callback) {
      console.log("Updating roles of users: "+changeInUsers.added);
      async.each(changeInUsers.added, function (userid, callback) {

        console.log("Updating User: " + userid+" with role:"+req.body.name);
        var collection = db.get('coll_user');
        collection.update({ _id: userid }, { $addToSet: { roles: req.body.name, 
          last_updated_by: req.headers["x-authenticated-user-username"], last_update_date: new Date() } }, {$pull: {roles: req.body.name}});
        callback();
      }, function (err) {
        if (err) {
          console.log('Error in user`s role updation');
          callback(err, null);
        } else {
          console.log('Roles added to users successfully');
          callback(null, "success");
        }
      });
    },
    // Save details in database
    function (msg, callback) {
      console.log("Updating role data");
      delete req.body.changeInUsers;
      
      var roleid = req.body.objectid;
      delete req.body.objectid;
      var newrole = req.body;
      newrole.last_updated_by = req.headers["x-authenticated-user-username"];
      newrole.last_update_date = new Date();
      var collection = db.get('coll_role');
      collection.update({_id: roleid}, {$set: newrole}, function (err, role) {
        if (err) {
          console.log("Error in saving role" + err);
          callback(err, null);
        }
        else {
          console.log("Received response:");
          if (role) {
            console.log("Updated Data: " + JSON.stringify(role));
            callback(null, role);
          }
        }
      });
    },

  ],
    // waterfall callback
    function (err, result) {
      console.log("Updated role | Result: " + result);
      if (err) {
        res.status(500).send({ success: false, data: err });
      }
      else {
        res.send({ success: true, data: result });
      }
    });
});

router.get('/permissions', permCheck.checkPermission('user.view'), function(req, res) {
    var db = req.db;
    var collection = db.get('coll_permission');
    collection.find({}, function(err, permissions){
        if (err) throw err;
      	res.json(permissions);
    });
});

router.get('/', permCheck.checkPermission('user.view'), function(req, res) {
    db = req.db;
    var collection = db.get('coll_user');
    collection.find({}, function(err, users){
        if (err) throw err;
        async.map(users, getUserRoles, function (err, users) {
          if (err) console.log("(0) Users - Main | Map Error while fetching users roles: " + err);
          if (users) {
            console.log("(0) Users - Main | Map Result inherited users roles: " + JSON.stringify(users));
            res.json(users);
          }
        });
    });
});

function getUserRoles(user, callback) {
  var roles = user.roles;
  user.roles = [];
  console.log("(1) Users - getUserRoles | Processing user: " + JSON.stringify(user));
  async.doWhilst(
    function (callback) {
      console.log("(1) Users - getUserRoles | DoWhilst Calling map with roles: " + roles);
      async.map(roles, getInheritedRoles, function (err, results) {
        console.log("(1) Users - getUserRoles | DoWhilst map completed. Error: ", err, " | result: ", JSON.stringify(results));
        roles = roles.concat(results[0].inherits);
        //console.log("1. mapInheriredRoles | Current Role in Arr: "+JSON.stringify(roles));
        delete results[0].inherits;
        //console.log("1. mapInheriredRoles | Pushing role: "+JSON.stringify(results[0]));
        user.roles.push(results[0].name);
        var index = roles.indexOf(results[0].name);
        roles.splice(index, 1);
        //console.log("1. mapInheriredRoles | Current Role in Arr after cleaning: "+JSON.stringify(roles));
        //console.log("(1) Users - getUserRoles | DoWhilst map User: " + JSON.stringify(user));
        callback(null, roles);
      });
    },
    function () {
      console.log("(1) Users - getUserRoles | DoWhilst Length: " + roles.length);
      return roles.length > 0;
    },
    function (err, roles) {
      if (err) console.log("(1) Users - getUserRoles | DoWhilst Error while fetching inherited roles: " + err);
      if (roles) console.log("(1) Users - getUserRoles | DoWhilst Result inherited user: " + JSON.stringify(roles));
      user.roles = user.roles.filter(function(item, pos) {
          return user.roles.indexOf(item) == pos;
      });
      callback(err, user);
    }
  );
}

function getInheritedRoles(role, callback){
    //console.log('(2) Users - getInheritedRoles | Getting inherited roles for: ' +role);
    var collection = db.get('coll_role');
    collection.findOne({name: role}, function(err, roleData){
        if (err) throw err;
        var roleObj = { name: roleData.name, inherits: roleData.inherits };
        //console.log("(2) Users - getInheritedRoles | Role Obj:"+JSON.stringify(roleObj));
        callback(err, roleObj);
    });
}


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
    
  ],
  // waterfall callback
  function (err, result) {
    console.log("Stackato Create User | Result: "+result);
    if(err){
      res.status(401).send({success: false, data: err});
    }
    else{
      res.send({success: true, data: result});
    }
  });
});

router.delete('/:guid', permCheck.checkPermission('user.delete'), function(req, res){
    console.log("Deleting data: "+req.params.guid);
    var guid = req.params.guid;
    var db = req.db;
    async.waterfall([
      // Generate guid for user creation input for stackato api
      function (callback) {
        console.log("Stackato UAA Delete user | Start.");

        var fihToken = req.session.fih_token;
        if (fihToken && fihToken.access_token) {

          var options = {
            url: HOST_API_URL + '/aok/uaa/Users/'+guid,
            headers: {
              'Authorization': 'Bearer ' + fihToken.access_token,
            },
            method: 'DELETE'
          };

          request(options, function resCallback(error, response, body) {
            if (response)
              console.log("Stackato UAA Delete user | Response code: " + response.statusCode);

            if (!error) {
              if (response.statusCode == 200) {
                callback(null, "success");
              }
              if (response.statusCode == 404) {
                callback("User Not Found", null);
              }
            }
            else {
              console.log("Stackato UAA Delete User | Generating error response: " + error);
              if (response.statusCode == 404) {
                callback("Error : User Not Found", null);
              }
              callback(error, null);
            }
          });
        }
      },

      // Call stackato api to create user
      function (msg, callback) {
        console.log("Stackato Delete user | UAA Message: "+msg);
        console.log("Deleting user with Guid: " + guid);
        var fihToken = req.session.fih_token;
        if (fihToken && fihToken.access_token) {

          var options = {
            url: HOST_API_URL + '/v2/users/'+guid+'?',
            headers: {
              'Authorization': 'Bearer ' + fihToken.access_token,
            },
            method: 'DELETE'
          };

          request(options, function resCallback(error, response, body) {
            if (response)
              console.log("Stackato Delete user | Response code: " + response.statusCode);

            if (!error) {
              if (response.statusCode == 204) {
                console.log("Stackato Delete user | Response: " + body);
                callback(null, "success");
              }
            }
            else {
              console.log("Stackato Deleting User | Generating error response: " + error);
              callback(error, null);
            }
          });
        }
      },

      // delete details from database
      function (msg, callback) {
        console.log("Deleting user from database | Stackato msg: "+msg);
        var collection = db.get('coll_user');
        collection.remove({ guid: req.params.guid });
        callback(null, { success: "deleted" });
      }
    ],
      // series callback
      function (err, result) {
        
        if (err) {
          console.log("Stackato Update User | Error: " + JSON.stringify(err));
          res.status(409).send({ success: false, data: err });
        }
        else {
          console.log("Stackato Update User | Result: " + JSON.stringify(result));
          res.send({ success: true, data: result });
        }
      });
});

router.post('/update', permCheck.checkPermission('user.create'), function(req, res) {
    var user = req.body;
    console.log("Updating user data: "+JSON.stringify(user));

    var objectid = req.body.objectid;
    var changeInOrgs = req.body.changeInOrgs;
    var changeInSpaces = req.body.changeInSpaces;

    delete req.body.objectid;
    delete req.body.changeInOrgs;
    delete req.body.changeInSpaces;
    
    var db = req.db;
    async.series([
      // Save details in database
      function (callback) {
        var collection = db.get('coll_user');
        req.body.last_updated_by = req.headers["x-authenticated-user-username"];
        collection.update({ _id: objectid }, { $set: req.body },
          function (err, response) {
            if (err) callback(err, null);
            console.log("Successfully updated app status: " + JSON.stringify(response));
            callback(null, {success: "updatedb"});
          });
      },

      // Associate added Organization with user
      function (callback) {
      console.log("Stackato Associate Organizations | Orgs: "+changeInOrgs.added);
      async.eachSeries(changeInOrgs.added, function (org, callbackOrg) {
        var fihToken = req.session.fih_token;
        if (fihToken && fihToken.access_token) {
          var options = {
            url: HOST_API_URL + '/v2/organizations/'+ org +'/users/'+user.guid,
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
                callbackOrg(null);
              }
            }
            else {
              console.log("Stackato | Generating error response: " + error);
              callbackOrg("Cannot associate user with the Organization");
            }
          });
        }

      }, function (err) {
        if (err) {
          console.log('Failed to associate user with the Organization');
          callback(err, null);
        } else {
          console.log('Successfully associated user with all organizations');
          callback(null,  {success: "addedOrg"});
        }
      });

    },

    // Associate Space with the User
    function (callback) {
      console.log("Stackato Associate Spaces | Spaces: "+changeInSpaces.added);
      async.each(changeInSpaces.added, function (space, callback) {
        var fihToken = req.session.fih_token;
        if (fihToken && fihToken.access_token) {
          console.log("Calling service: "+HOST_API_URL + '/v2/users/'+user.guid+'/spaces/'+space);
          var options = {
            url: HOST_API_URL + '/v2/users/'+user.guid+'/spaces/'+space,
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
          callback(null, {success: "addedSpaces"});
        }
      });
    },
    // Delete User from Organization
    function (callback) {
      console.log("Stackato Delete Organizations | Orgs: "+changeInOrgs.deleted);
      async.eachSeries(changeInOrgs.deleted, function (org, callback) {
        var fihToken = req.session.fih_token;
        if (fihToken && fihToken.access_token) {
          console.log("Calling service: "+HOST_API_URL + '/v2/users/'+user.guid+'/organizations/'+org);
          var options = {
            url: HOST_API_URL + '/v2/users/'+user.guid+'/organizations/'+org,
            headers: {
              'Authorization': 'Bearer ' + fihToken.access_token,
            },
            method: 'DELETE'
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
          callback(null, {success: "deleteOrgs"});
        }
      });

    },

    // Delete Space for User
    function (callback) {
      console.log("Stackato Associate Spaces | Space:"+changeInSpaces.deleted);
      async.each(changeInSpaces.deleted, function (space, callback) {
        var fihToken = req.session.fih_token;
        if (fihToken && fihToken.access_token) {
          console.log("Calling service: "+HOST_API_URL + '/v2/users/'+user.guid+'/spaces/'+space);
          var options = {
            url: HOST_API_URL + '/v2/users/'+user.guid+'/spaces/'+space,
            headers: {
              'Authorization': 'Bearer ' + fihToken.access_token,
            },
            method: 'DELETE'
          };

          request(options, function resCallback(error, response, body) {
            console.log("Response from Stackato Delete Space service: " + response);
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
              callback("Cannot delete user with the Spaces");
            }
          });
        }

      }, function (err) {
        if (err) {
          console.log('Failed to delete user with the Spaces');
          callback(err, null);
        } else {
          console.log('Successfully delete user with all spaces');
          callback(null, {success: "deleteSpaces"});
        }
      });
    }
    ],
    // series callback
    function (err, result) {
      console.log("Stackato Update User | Result: "+JSON.stringify(result));
      if(err){
        res.status(409).send({success: false, data: err});
      }
      else{
        res.send({success: true, data: result});
      }
    });
});


module.exports = router;
