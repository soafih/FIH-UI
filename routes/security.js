var express = require('express');
var async = require('async');

var router = express.Router();
var db = {};

router.get('/:username', function(req, res) {
    console.log('Getting details for: '+req.params.username);
    db = req.db;
    var username = req.params.username;
    async.waterfall([
        function getUserDetails(callback){
            console.log("1. getUserDetails | Entered getUserDetails");
            var collection = db.get('coll_user');
            collection.findOne({username: username}, 
                {fields : {password:0, created_by: 0, creation_date:0, last_updated_by:0, last_update_date:0}} , function(err, user){
                if (err) throw err;
                console.log("1. getUserDetails | Completed. Error: ", err, " | result: ", JSON.stringify(user));
                callback(null, user);
            });
        },
        mapInheriredRoles
    ], function (err, result) {
        console.log("1. getUserDetails | Sending response back: "+JSON.stringify(result));
        result.permission = result.permission.filter(function(item, pos) {
            return result.permission.indexOf(item) == pos;
        });
        res.json(result);
    });
});

function mapInheriredRoles(user, callback) {
    console.log("2. mapInheriredRoles | Getting mapInheriredRoles for :" + user.roles);
    var roles = user.roles;
    user.roles = [];
    user.permission = [];
    async.doWhilst(
        function (callback) {
            console.log("2. mapInheriredRoles | DoWhilst Calling map with roles: "+roles);
            async.map(roles, getInheritedRoles, function (err, results) {
                //console.log("2. mapInheriredRoles | DoWhilst map completed. Error: ", err, " | result: ", JSON.stringify(results));
                roles = roles.concat(results[0].inherits);
                //console.log("2. mapInheriredRoles | Current Role in Arr: "+JSON.stringify(roles));
                delete results[0].inherits;
                //console.log("2. mapInheriredRoles | Pushing role: "+JSON.stringify(results[0]));
                user.roles.push(results[0].name);
                user.permission = user.permission.concat(results[0].can);
                var index = roles.indexOf(results[0].name);
                roles.splice(index, 1);
                //console.log("2. mapInheriredRoles | Current Role in Arr after cleaning: "+JSON.stringify(roles));
                //console.log("2. mapInheriredRoles | DoWhilst map User: "+JSON.stringify(user));
                callback(null, roles);
            });
        },
        function () {
            console.log("2. mapInheriredRoles | DoWhilst Length: "+roles.length);
            return roles.length > 0; 
        },
        function (err, roles) {
            if(err) console.log("2. mapInheriredRoles | DoWhilst Error while fetching inherited roles: "+err);
            if(roles) console.log("2. mapInheriredRoles | DoWhilst Result inherited user: "+JSON.stringify(roles));
            callback(null, user);
        }
    );
       
}

function getInheritedRoles(role, callback){
    console.log('3. getInheritedRoles | Getting inherited roles for: ' +role);
    var collection = db.get('coll_role');
    collection.findOne({name: role}, function(err, roleData){
        if (err) throw err;
        //console.log("3. getInheritedRoles | completed. Error: ", err, " | result: ", JSON.stringify(roleData));
        var roleObj = {name: roleData.name, can: roleData.can};
        roleObj.inherits= roleData.inherits;
        //console.log("3. getInheritedRoles | Role Obj:"+JSON.stringify(roleObj));
        callback(err, roleObj);
    });
}

module.exports = router;