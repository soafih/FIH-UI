var express = require('express');
var router = express.Router();

module.exports = {

    checkPermission: function(resource) {
        console.log("Entered checkPermission.." + resource);

        return function (req, res, next) {
            var response = false;
            console.log('##### Check Permission: ' + req.session.username);
            console.log("User Obj: " + JSON.stringify(req.session.userobj));
            console.log("resource: " + resource);
            var userProfile = req.session.userobj;
            if (userProfile.permission.indexOf(resource) >= 0) {
                console.log("Granted acccess");
                if (next) {
                    next();
                }
                else {
                    response = true;
                }
            } else {
                // user access denied
                res.status(401).send({
                    success: false,
                    message: 'Unauthorized access attempted.'
                });
            }
            return response;
        };
    }
};