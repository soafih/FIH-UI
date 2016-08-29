var express = require('express');
var router = express.Router();
var https = require('https');
var querystring = require('querystring');
var NodeCache = require( "node-cache" );
var async = require('async');
var request = require('request');
var permCheck = require('./mod/permission-check');

var stackatoCache = new NodeCache();
var defaultTTL = 86399;
var host = 'aok.stackato-poc.foxinc.com';
var hostApi = 'api.stackato-poc.foxinc.com';
var HOST_API_URL = 'https://api.stackato-poc.foxinc.com';
var username = process.env.FIH_SVC_USER;
var password = process.env.FIH_SVC_PASSWORD;

router.get('/apps', permCheck.checkPermission('app.view'), function (req, res) {

    console.log("Retrieving apps from stackato..");
    getStackatoAccessToken(function (response) {
        getAllApplications(response, function (response) {
            res.json(response);
        });
    });
});

router.get('/apps/:appname', permCheck.checkPermission('app.view'), function (req, res) {
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

router.delete('/apps/:appguid', permCheck.checkPermission('app.delete'), function (req, res) {
    var appGuid = req.params.appguid;

    console.log("Deleting app "+appGuid+" from stackato..");
    getStackatoAccessToken(function (response) {
        deleteStackatoApp(response, appGuid, function (response) {
            console.log("Delete response: "+JSON.stringify(response));
            //var response ={};
            res.json(response);
        });
    });
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

    function resCallback(error, response, body) {
        console.log("Delete response code: "+response.statusCode);
        
        if (!error && (response.statusCode == 200 || response.statusCode == 404)) {
            var info = JSON.parse(body);
            console.log("Deleted Stackato App: " +info);
            callback(generateSuccessResponse(response, body));
        }
        else{
            console.log("Generating error response: "+console.log("Error:"+JSON.parse(error)));
            callback(generateErrorResponse(response, body));
        }
    }

    request(options, resCallback);
}

function generateSuccessResponse(response, body){

    return {success: true, data: JSON.parse(body)}; 
}

function generateErrorResponse(response, body){

    return {success: false, status_code: response.statusCode, data: JSON.parse(body)}; 
}

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

function getStackatoAccessTokenAsync(callback) {

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
                callback(null, accessToken);
            }
        });
    }
    else {
        console.log("Retrieved accessToken from cache..");
        callback(null, cacheValue);
    }
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
        
        if (('' + req.statusCode).match(/^2\d\d$/)) {
            // Request handled, happy
        } else if (('' + req.statusCode).match(/^5\d\d$/)){
            console.log("Received unexpected error while calling Stackato resource");
        }

        if(res.statusCode == 204){
            success('Success');
        }
        else {
            var responseString = '';
            req.on('error', function(err) {
                console.log("Received error while calling Stackato resource: "+endpoint);
            });

            req.on('timeout', function () {
                // It will emit 'error' message as well (with ECONNRESET code).
                console.log('Received timeout while calling Stackato resource');
                req.abort();
            });

            res.on('data', function (data) {
                responseString += data;
            });

            res.on('end', function () {
                //console.log("responseString: " + responseString);
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

router.get('/headertest', function (req, res) {
    console.log("Session: "+JSON.stringify(req.session));
    console.log("Username: "+req.session.username);
    console.log('Cookies: ', req.cookies);
    console.log("Request Headers: "+JSON.stringify(req.headers));
    res.json(req.headers);
});

/*
router.get('/orgs', function (req, res) {
    var cacheValue = stackatoCache.get("orgs");
    if (cacheValue === undefined) {
        console.log("Retrieving orgs from stackato..");
        async.waterfall([
            getStackatoAccessTokenAsync,
            getAllOrganizations,
            getOrgDetails
        ], function (err, result) {
            console.log("###### Sending response back: " + JSON.stringify(result));
            stackatoCache.set("orgs", result, defaultTTL);
            res.json(result);
        });
    }
    else {
        console.log("Retrieved orgs from cache..");
        res.json(cacheValue);
    }
});
*/

/*
router.get('/userorgs/:guid', function (req, res) {
    var guid = req.params.guid;
    console.log("Retrieving orgs from stackato..");
    async.waterfall([
        getStackatoAccessTokenAsync,
        function getUsersOrganizations(accessToken, callback) {

            var headers = {
                'Authorization': 'Bearer ' + accessToken
            };

            performRequest(hostApi, '/v2/users/' + guid + '/organizations', 'GET', '', headers, function (data) {
                var resources = data.resources;
                var orgsArr = [];
                for (var i = 0; i < resources.length; i++) {
                    var org = {
                        name: resources[i].entity.name,
                        spaces_url: resources[i].entity.spaces_url,
                        domains_url: resources[i].entity.domains_url
                    };
                    orgsArr.push(org);
                }
                console.log("Stackato Org Response: " + JSON.stringify(orgsArr));

                callback(null, accessToken, orgsArr);
            });
        },
        getOrgDetails
    ], function (err, result) {
        console.log("###### Sending response back: " + JSON.stringify(result));
        stackatoCache.set("orgs", result, defaultTTL);
        res.json(result);
    });

});
*/

/*
function getAllOrganizations(accessToken, callback) {
    
    var headers = {
        'Authorization': 'Bearer ' + accessToken
    };

    performRequest(hostApi, '/v2/organizations', 'GET', '', headers, function (data) {
        var resources = data.resources;
        var orgsArr = [];
        for (var i = 0; i < resources.length; i++) {
            var org = {
                name: resources[i].entity.name,
                spaces_url: resources[i].entity.spaces_url,
                domains_url: resources[i].entity.domains_url
            };
            orgsArr.push(org);
        }
        console.log("Stackato Org Response: " + JSON.stringify(orgsArr));
        
        callback(null, accessToken, orgsArr);
    });
}
*/
/*
function getOrgDetails(accessToken, orgsArr, callback) {
    async.map(orgsArr, getSpacesAndDomains, function(err, results) {
        console.log("Map completed. Error: ", err, " | result: ", JSON.stringify(results));
        callback(null, results);
    });

    function getSpacesAndDomains(org, callback) {
        var headers = {
            'Authorization': 'Bearer ' + accessToken
        };
        console.log('Getting details for org: ' + JSON.stringify(org));
        var spacesArr = [];
        performRequest(hostApi, org.spaces_url, 'GET', '', headers, function (data) {
            var resources = data.resources;

            for (var i = 0; i < resources.length; i++) {
                spacesArr.push(resources[i].entity.name);
            }
            console.log('Retrived Spaces for org ' + org.name + ': ' + spacesArr);
            performRequest(hostApi, org.domains_url, 'GET', '', headers, function (data) {
                var resources = data.resources;
                var domain = '';
                for (var i = 0; i < resources.length; i++) {
                    if (resources[i].entity.owning_organization_guid) {
                        console.log('Retrived domain for org ' + org.name + ': ' + resources[i].entity.name);
                        domain = resources[i].entity.name;
                    }
                }
                org = {name: org.name, spaces: spacesArr, domain: domain};
                callback(null, org);
            });
        });
    }
}
*/
/*
router.get('/orgs_bkp', function (req, res) {
    var cacheValue = stackatoCache.get( "orgs" );
    if ( cacheValue === undefined ){
        console.log("Retrieving orgs from stackato..");
        getStackatoAccessToken(function(response){
            getAllOrganizations(response, function(response){
                stackatoCache.set("orgs", response, defaultTTL);
                res.json(response);
            });
        });
    }
    else{
        console.log("Retrieved orgs from cache..");
        res.json(cacheValue);
    }
});
*/


/*
router.post('/login', function(req, res) {
    console.log("Login request for: "+req.body.username);
    var username = req.body.username;
    var password = req.body.password;

    authenticateUser(username, password, function(response){
        console.log("Login response from stackato:"+response);
        var authStatus ={};
        if(response){
            req.session.isAuthenticated = true;
            req.session.accessToken = response;
            authStatus = {
                status: 'success',
                username: username,
                accessToken: response
            };
        }
        else{
            req.session.isAuthenticated = false;
            req.session.accessToken = null;
            authStatus = {
                status: 'failed',
                error: response
            };
        }
        res.json(authStatus);
    });
});
*/

/*
function authenticateUser(username, password, callback) {

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
            callback(undefined);
        }
        else {
            var accessToken = data.access_token;
            callback(accessToken);
        }
    });
}
*/

module.exports = router;