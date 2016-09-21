var express = require('express');
var router = express.Router();

var querystring = require('querystring');
var NodeCache = require( "node-cache" );
var async = require('async');
var request = require('request');
var permCheck = require('./mod/permission-check');
var stackato = require('./mod/stackato-mod');

var HOST_API_URL = process.env.STACKATO_API_URL;
var HOST_AOK_URL = process.env.STACKATO_AOK_URL;
var STACKATO_API_TIMEOUT = parseInt(process.env.STACKATO_API_TIMEOUT);
var USERNAME = process.env.FIH_SVC_USER;
var PASSWORD = process.env.FIH_SVC_PASSWORD;

router.get('/apps', permCheck.checkPermission('app.view'), function (req, res) {

    console.log("Retrieving apps from stackato..");
    var fihToken = req.session.fih_token;
    if(fihToken && fihToken.access_token){
        getAllApplications(fihToken.access_token, function (err, response) {
            if(err){
                res.status(err.status_code).send(err);
            }
            else{
                res.json(response.data.apps);
            }
        });
    }
    else{
        res.status(401).send({ 
            success: false, 
            message: 'Invalid access token, pleasse login again.!' 
        });
    }
});

router.get('/apps/:appname', permCheck.checkPermission('app.view'), function (req, res) {
    var appName = req.params.appname;

    console.log("Retrieving apps from stackato..");
    var fihToken = req.session.fih_token;
    if(fihToken && fihToken.access_token){
        getAllApplications(fihToken.access_token, function (err, response) {
            if(err){
                res.status(err.status_code).send(err);
            }
            else{
                console.log("Array response: "+JSON.stringify(response));
                var app = response.data.apps.filter(function (apps) {
                    return apps.name == appName;
                });
                res.json(app[0]);
            }
        });
    }
    else{
        res.status(401).send({ 
            success: false, 
            message: 'Invalid access token, pleasse login again.!' 
        });
    }
});

router.delete('/apps/:appguid', permCheck.checkPermission('app.delete'), function (req, res) {
    var appGuid = req.params.appguid;

    console.log("Deleting app "+appGuid+" from stackato..");
    
    var fihToken = req.session.fih_token;
    if(fihToken && fihToken.access_token){
        deleteStackatoApp(fihToken.access_token, appGuid, function (err, response) {
            if(err){
                console.log("Error in deleting app: " + JSON.stringify(err));
                res.status(err.status_code).send(err);
            }
            else{
                console.log("Delete response: "+JSON.stringify(response));
                res.json(response);
            }
        });
    }
    else{
        res.status(401).send({ 
            success: false, 
            message: 'Invalid access token, pleasse login again.!' 
        });
    }
});

router.get('/orgs', function (req, res) {
    console.log("Retrieving orgs from stackato..");
    var fihToken = req.session.fih_token;
    if (fihToken && fihToken.access_token) {
        async.waterfall([
            function getAllOrganizations(callback) {
                console.log("Inside getAllOrganizations");
                var options = {
                    url: HOST_API_URL + '/v2/organizations',
                    headers: {
                        'Authorization': 'Bearer ' + fihToken.access_token,
                    }
                };

                request(options, function resCallback(error, response, body) {
                    if (response)
                        console.log("Get All Org Stackato response code: " + response.statusCode);

                    if(response && response.statusCode == 401){
                        callback(generateErrorResponse(response, "Unauthorized. Access Token has expired"), null);
                    }
                    else if (!error && (response.statusCode == 200)) {
                        var info = JSON.parse(body);

                        var resources = info.resources;
                        var orgsArr = [];
                        for (var i = 0; i < resources.length; i++) {
                            var org = {
                                name: resources[i].entity.name,
                                guid: resources[i].metadata.guid,
                                spaces_url: resources[i].entity.spaces_url
                            };
                            orgsArr.push(org);
                        }
                        console.log("Stackato Org Response: " + JSON.stringify(orgsArr));

                        callback(null, orgsArr);
                    }
                    else {
                        console.log("getAllOrganizations | Generating error response: " + JSON.parse(error));
                        callback(generateErrorResponse(response, JSON.parse(body)), null);
                    }
                });

            },
            function getOrgsSpaces(orgsArr, callback){
                stackato.getOrgsSpaces(fihToken.access_token, orgsArr, function(err, res){
                    callback(err, res);
                });
            }
        ], function (err, result) {
            if(err){
                console.log("Error in fetching Org: " + JSON.stringify(err));
                var errArr = []; errArr.push(err);
                res.status(err.status_code).send(errArr);
            }
            else{
                console.log("Result getAllOrganizations: " + JSON.stringify(result));
                res.json(result);
            }
        });
    }
});

router.get('/spaces', function (req, res) {
    console.log("Retrieving spaces from stackato..");
    var fihToken = req.session.fih_token;
    if (fihToken && fihToken.access_token) {
        async.waterfall([
            function getAllSpaces(callback) {
                console.log("Inside getAllSpaces");
                var options = {
                    url: HOST_API_URL + '/v2/spaces',
                    headers: {
                        'Authorization': 'Bearer ' + fihToken.access_token,
                    }
                };

                request(options, function resCallback(error, response, body) {
                    if (response)
                        console.log("Get All Spaces Stackato response code: " + response.statusCode);

                    if(response && response.statusCode == 401){
                        callback(generateErrorResponse(response, "Unauthorized. Access Token has expired"), null);
                    }
                    else if (!error && (response.statusCode == 200)) {
                        var info = JSON.parse(body);

                        var resources = info.resources;
                        var spacesArr = [];
                        for (var i = 0; i < resources.length; i++) {
                            var space = {
                                name: resources[i].entity.name,
                                guid: resources[i].metadata.guid
                            };
                            spacesArr.push(space);
                        }
                        console.log("Stackato Spaces Response: " + JSON.stringify(spacesArr));

                        callback(null, spacesArr);
                    }
                    else {
                        console.log("getAllspaces | Generating error response: " + JSON.parse(error));
                        callback(generateErrorResponse(response, JSON.parse(body)), null);
                    }
                });

            },
        ], function (err, result) {
            if(err){
                console.log("Error in fetching Spaces: " + JSON.stringify(err));
                var errArr = []; errArr.push(err);
                res.status(err.status_code).send(errArr);
            }
            else{
                console.log("All spaces fetched: " + JSON.stringify(result));
                res.json(result);
            }
        });
    }
});


function deleteStackatoApp(accessToken, appGuid, callback) {
    var options = {
        url: HOST_API_URL + '/v2/apps/',
        method: 'DELETE',
        headers: { 
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/x-www-form-urlencoded' 
        }
    };

    request(options, function resCallback(error, response, body) {
        console.log("Delete response code: "+response.statusCode);
        
        if (!error && (response.statusCode == 200 || response.statusCode == 404)) {
            var info = JSON.parse(body);
            console.log("Deleted Stackato App: " +info);
            callback(null, generateSuccessResponse(response, info));
        }
        else{
            console.log("Generating error response: " + JSON.parse(error));
            callback(generateErrorResponse(response, JSON.parse(body)), null);
        }
    });
}

function generateSuccessResponse(response, resData){

    return {success: true, data: resData}; 
}

function generateErrorResponse(response, resData){

    return {success: false, status_code: response.statusCode, data: resData}; 
}

function getAllApplications(accessToken, callback) {
    console.log("Entered getAllApplications: "+accessToken);
    var options = {
        url: HOST_API_URL + '/v2/apps',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    request(options, function resCallback(error, response, body) {
        if(response)
            console.log("Get All App Stackato response code: "+response.statusCode);
        
        if (!error && (response.statusCode == 200)) {
            var info = JSON.parse(body);

            var resources = info.resources;
            var resArr = [];
            for (var i = 0; i < resources.length; i++) {
                var app = {
                    guid: resources[i].metadata.guid,
                    name: resources[i].entity.name
                };
                resArr.push(app);
            }
            callback(null, generateSuccessResponse(response, {apps: resArr}));
        }
        else{
            console.log("getAllApplications | Generating error response: "+JSON.parse(error));
            callback(generateErrorResponse(response, JSON.parse(body)), null);
        }
    });
}

function getStackatoAccessToken(callback) {
    console.log("Entered getStackatoAccessToken");
    var fih_token = req.session.fih_token.access_token;
    console.log("Access token from cookie: "+fih_token);
    if(fih_token){
        callback(fih_token);
    }
    else{
        callback({success: false, message: 'Invalid access token, pleasse login again.!'});
    }
}

router.get('/headertest', function (req, res) {
    console.log("Session: "+JSON.stringify(req.session));
    console.log("Username: "+req.session.username);
    console.log('Cookies: ', req.cookies);
    console.log("Request Headers: "+JSON.stringify(req.headers));
    res.json(req.headers);
});

module.exports = router;