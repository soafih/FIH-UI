var express = require('express');
var router = express.Router();

module.exports = {

    checkPermission: function(resource) {

        return function (req, res, next) {
            var response = false;
            console.log('##### Check Permission: ' + req.session.username);
            //console.log("User Obj: " + JSON.stringify(req.session.userobj));
            console.log("resource: " + resource);
            var userProfile = req.session.userobj;
            if (userProfile && userProfile.permission.indexOf(resource) >= 0) {
                console.log("Granted acccess");
                if (next) {
                    console.log("Check Permission, calling next middleware.");
                    next();
                }
                else {
                    response = true;
                }
            } else {
                // user access denied
                res.status(401).send({
                    success: false,
                    message: 'Unauthorized access attempted!'
                });
            }
            console.log("Check Permission, sending response back: "+response);
            return response;
        };
    }
    
};