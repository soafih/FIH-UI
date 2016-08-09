var express = require('express');
var router = express.Router();
var https = require('https');
var querystring = require('querystring');
var NodeCache = require( "node-cache" );
var stackatoCache = new NodeCache();
var defaultTTL = 86399;

var host = 'aok.stackato-poc.foxinc.com';
var hostApi = 'api.stackato-poc.foxinc.com';
var username = 'shadabhasana';
var password = 'Desifox@1234';

router.get('/spaces', function (req, res) {
    var cacheValue = stackatoCache.get("spaces");
    if ( cacheValue === undefined ){
        console.log("Retrieving spaces from stackato..");
        getStackatoAccessToken(function(response){
            getAllSpaces(response, function(response){
                res.json(response);
            });
        });
    }
    else{
        console.log("Retrieved spaces from cache..");
        res.json(cacheValue);
    }
});

router.get('/orgs', function (req, res) {
    var cacheValue = stackatoCache.get( "orgs" );
    if ( cacheValue === undefined ){
        console.log("Retrieving orgs from stackato..");
        getStackatoAccessToken(function(response){
            getAllOrganizations(response, function(response){
                res.json(response);
            });
        });
    }
    else{
        console.log("Retrieved orgs from cache..");
        res.json(cacheValue);
    }
});

router.get('/apps', function (req, res) {

    console.log("Retrieving apps from stackato..");
    getStackatoAccessToken(function (response) {
        getAllApplications(response, function (response) {
            res.json(response);
        });
    });
});

router.get('/apps/:appname', function (req, res) {
    var appName = req.params.appname;

    console.log("Retrieving apps from stackato..");
    getStackatoAccessToken(function (response) {
        getAllApplications(response, function (response) {
            var app = response.filter(function (apps) {
                return apps.name == appName;
            });
            res.json(app[0]);
        });
    });
});

router.delete('/apps/:appguid', function (req, res) {
    var appGuid = req.params.appguid;

    console.log("Deleting app "+appGuid+" from stackato..");
    getStackatoAccessToken(function (response) {
        deleteApplication(response, appGuid, function (response) {
            res.send(response);
        });
    });
});

function deleteApplication(accessToken, appGuid, callback){

    var headers = { 
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded' 
    };

    performRequest(hostApi, '/v2/apps/'+appGuid, 'DELETE', '', headers, function (data) {
        console.log("Deleted Stackato Applications: " + JSON.stringify(data));
        callback(data);
    });
}

function getAllApplications(accessToken, callback) {

    var headers = { 'Authorization': 'Bearer ' + accessToken };

    performRequest(hostApi, '/v2/apps', 'GET', '', headers, function (data) {
        var resources = data.resources;
        var resArr = [];
        for (var i = 0; i < resources.length; i++) {
            var app = {
                guid: resources[i].metadata.guid,
                name: resources[i].entity.name
            };
            resArr.push(app);
        }
        //console.log("Stackato Applications: " + JSON.stringify(resArr));
        stackatoCache.set("apps", resArr, 3600);
        callback(resArr);
    });
}

function getAllSpaces(accessToken, callback) {

    var headers = {
        'Authorization': 'Bearer ' + accessToken
    };

    performRequest(hostApi, '/v2/spaces', 'GET', '', headers, function (data) {
        var resources = data.resources;
        var spacesArr = [];
        for (var i = 0; i < resources.length; i++) {
            spacesArr.push(resources[i].entity.name);
        }
        console.log("Stackato Space Response: " + JSON.stringify(spacesArr));
        stackatoCache.set("spaces", spacesArr, defaultTTL);
        callback(spacesArr);
    });
}

function getAllOrganizations(accessToken, callback) {

    var headers = {
        'Authorization': 'Bearer ' + accessToken
    };

    performRequest(hostApi, '/v2/organizations', 'GET', '', headers, function (data) {
        var resources = data.resources;
        var orgsArr = [];
        for (var i = 0; i < resources.length; i++) {
            orgsArr.push(resources[i].entity.name);
        }
        console.log("Stackato Org Response: " + JSON.stringify(orgsArr));
        stackatoCache.set("orgs", orgsArr, defaultTTL);
        callback(orgsArr);
    });
}


function getStackatoAccessToken(callback) {

    var cacheValue = stackatoCache.get("accessToken");
    if (cacheValue === undefined) {

        var inputOAuth = {
            "grant_type": "password",
            "username": username,
            "password": password
        };

        var dataString = querystring.stringify(inputOAuth);

        var headers = {};
        var method = 'POST';
        headers = {
            'Authorization': 'Basic Y2Y6',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(dataString)
        };

        performRequest(host, '/uaa/oauth/token', 'POST', dataString, headers, function (data) {
            console.log("oAuth Response: " + JSON.stringify(data));
            if (data.error) {
                console.log("Error getting Stackato oAuth session");
                throw data.error;
            }
            else {
                var accessToken = data.access_token;
                stackatoCache.set("accessToken", accessToken, data.expires_in);
                callback(accessToken);
            }
        });
    }
    else {
        console.log("Retrieved accessToken from cache..");
        callback(cacheValue);
    }
}

function performRequest(host, endpoint, method, dataString, headers, success) {

    if (method == 'GET') {
        if (dataString) {
            endpoint += '?' + dataString;
        }
    }

    console.log("Calling stackato endpoint: " + endpoint);
    var options = {
        host: host,
        path: endpoint,
        method: method,
        headers: headers
    };

    var req = https.request(options, function (res) {
        res.setEncoding('utf-8');
        console.log("Response Status Code: "+res.statusCode);
        if(res.statusCode == 204){
            success('Success');
        }
        else{
            var responseString = '';
            res.on('data', function (data) {
                responseString += data;
            });

            res.on('end', function () {
                console.log("responseString: " + responseString);
                var responseObject = {};
                if(responseString !== ''){
                    responseObject = JSON.parse(responseString);
                }
                success(responseObject);
            });
        }
    });

    req.write(dataString);
    req.end();
}

module.exports = router;
