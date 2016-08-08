var express = require('express');
var router = express.Router();
var https = require('https');
var querystring = require('querystring');
var NodeCache = require( "node-cache" );
var stackatoCache = new NodeCache();

var host = 'aok.stackato-poc.foxinc.com';
var hostApi = 'api.stackato-poc.foxinc.com';
var username = 'shadabhasana';
var password = 'Desifox@1234';

router.get('/spaces', function (req, res) {
    value = stackatoCache.get( "spaces" );
    if ( value === undefined ){
        console.log("Retrieving spaces from stackato..");
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
                var headers = {
                    'Authorization': 'Bearer ' + accessToken
                };
                
                var spacesArr = performRequest(hostApi, '/v2/spaces', 'GET', '', headers, function (data) {
                    var spaceResources = data.resources;
                    var spacesArr=[];
                    for(var i=0; i<spaceResources.length; i++){
                        spacesArr.push(spaceResources[i].entity.name);
                    }
                    console.log("Stackato Space Response: "+JSON.stringify(spacesArr));
                    stackatoCache.set("spaces", spacesArr, 86400);
                    res.json(spacesArr);
                });
                
            }
        });
    }
    else{
        console.log("Retrieved spaces from cache..");
        res.json(value);
    }
});

router.get('/orgs', function (req, res) {
    value = stackatoCache.get( "orgs" );
    if ( value === undefined ){
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
                var headers = {
                    'Authorization': 'Bearer ' + accessToken
                };
                
                var orgsArr = performRequest(hostApi, '/v2/organizations', 'GET', '', headers, function (data) {
                    var orgResources = data.resources;
                    var orgsArr=[];
                    for(var i=0; i<orgResources.length; i++){
                        orgsArr.push(orgResources[i].entity.name);
                    }
                    console.log("Stackato Org Response: "+JSON.stringify(orgsArr));
                    stackatoCache.set("orgs", orgsArr, 86400);
                    res.json(orgsArr);
                });
                
            }
        });
    }
    else{
        console.log("Retrieved orgs from cache..");
        res.json(value);
    }
});

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

        var responseString = '';
        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            console.log("responseString: " + responseString);
            var responseObject = JSON.parse(responseString);
            success(responseObject);
        });
    });

    req.write(dataString);
    req.end();
}

module.exports = router;
