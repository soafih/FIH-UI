var querystring = require('querystring');
var NodeCache = require("node-cache");
var async = require('async');
var request = require('request');

var STACKATO_CACHE = new NodeCache();
var HOST_API_URL = process.env.STACKATO_API_URL;
var HOST_AOK_URL = process.env.STACKATO_AOK_URL;
var STACKATO_API_TIMEOUT = parseInt(process.env.STACKATO_API_TIMEOUT);
var USERNAME = process.env.FIH_SVC_USER;
var PASSWORD = process.env.FIH_SVC_PASSWORD;

module.exports = {
    getUserOrgs: function (guid, accessToken, callback) {
        console.log("Retrieving orgs from stackato for user guid: "+guid);
        async.waterfall([
            function getUsersOrganizations(callbackOrg) {
                
                console.log("Access Token returned: "+accessToken);
                var headers = {
                    'Authorization': 'Bearer ' + accessToken
                };

                var options = {
                    headers: headers,
                    url: HOST_API_URL + '/v2/users/' + guid + '/organizations',
                    timeout: STACKATO_API_TIMEOUT
                };

                request(options, function (error, response, body) {
                    if (error && error.code === 'ETIMEDOUT') {
                        console.log("Cannot establish connection with stackato. Connection timeout: " + error.connect === true);
                    }
                    if (!error && (response.statusCode == 200)) {
                        var data = JSON.parse(body);
                        console.log("getUsersOrganizations | body: "+data)
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

                        callbackOrg(null, accessToken, orgsArr);
                    }
                    else {
                        console.log("getUsersOrganizations | Generating error response: " + error);
                        callbackOrg(error, null, null);
                    }
                });
            },
            getOrgDetails
        ], function (err, result) {
            console.log("###### Sending response back: " + JSON.stringify(result));
            callback(err, result);
        });
    }
    /*,
    getStackatoAccessTokenAsync: function(callback){
        getStackatoAccessTokenAsync(callback);
    } */
};

function getOrgDetails(accessToken, orgsArr, callbackOrgs) {
    async.map(orgsArr, getSpacesAndDomains, function (err, results) {
        console.log("getOrgDetails | Map completed. Error: ", err, " | result: ", JSON.stringify(results));
        callbackOrgs(err, results);
    });

    function getSpacesAndDomains(org, callback) {
        var headers = {
            'Authorization': 'Bearer ' + accessToken
        };
        console.log('getSpacesAndDomains | Getting details for org: ' + JSON.stringify(org));
        
        var optionSpaces = {
            headers: headers,
            url: HOST_API_URL + org.spaces_url,
            timeout: STACKATO_API_TIMEOUT
        };

        var spacesArr = [];
        request(optionSpaces, function (error, response, body) {
            if (error && error.code === 'ETIMEDOUT') {
                console.log("Cannot establish connection with stackato. Connection timeout: " + error.connect === true);
            }
            if (!error && (response.statusCode == 200)) {
                var data = JSON.parse(body);
                var resources = data.resources;

                for (var i = 0; i < resources.length; i++) {
                    spacesArr.push(resources[i].entity.name);
                }
                console.log('Retrived Spaces for org ' + org.name + ': ' + spacesArr);
                var optionDomains = {
                    headers: headers,
                    url: HOST_API_URL + org.domains_url,
                    timeout: STACKATO_API_TIMEOUT
                };
                request(optionDomains, function (error, response, body) {
                    if (error && error.code === 'ETIMEDOUT') {
                        console.log("Cannot establish connection with stackato. Connection timeout: " + error.connect === true);
                    }
                    if (!error && (response.statusCode == 200)) {
                        var data = JSON.parse(body);
                        var resources = data.resources;
                        var domain = '';
                        for (var i = 0; i < resources.length; i++) {
                            if (resources[i].entity.owning_organization_guid) {
                                console.log('Retrived domain for org ' + org.name + ': ' + resources[i].entity.name);
                                domain = resources[i].entity.name;
                            }
                        }
                        org = { name: org.name, spaces: spacesArr, domain: domain };
                        callback(null, org);
                    }
                    else {
                        console.log("Generating error response: " + error);
                        callback(error, null);
                    }
                });
            }
            else {
                console.log("Generating error response: " + error);
                callback(error, null);
            }
        });
    }
}

function getStackatoAccessTokenAsync(req, res, next) {
    console.log("Entered getStackatoAccessTokenAsync");
    var fih_token = req.session.fih_token.access_token;
    console.log("Access token from cookie: "+fih_token);
    if(fih_token){
        return fih_token;
    }
    else{
        return {success: false, message: 'Invalid access token, pleasse login again.!'};
    }
    /*
    var cacheValue = STACKATO_CACHE.get("accessToken");
    if (cacheValue === undefined) {

        var inputOAuth = {
            "grant_type": "password",
            "username": USERNAME,
            "password": PASSWORD
        };

        var dataString = querystring.stringify(inputOAuth);
        var headers = {
            'Authorization': 'Basic Y2Y6',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(dataString)
        };

        var options = {
            headers: headers,
            method: 'POST',
            url: HOST_AOK_URL + '/uaa/oauth/token',
            form: inputOAuth,
            timeout: STACKATO_API_TIMEOUT
        };

        request(options, function (error, response, body) {
            if (error && error.code === 'ETIMEDOUT') {
                console.log("Cannot establish connection with stackato. Connection timeout: " + error.connect === true);
            }
            else {
                if (response)
                    console.log("Stackato access token response code: " + JSON.parse(response.statusCode));
            }

            if (!error && (response.statusCode == 200)) {
                var info = JSON.parse(body);
                //console.log("Access Token: " + JSON.stringify(info));
                callback(null, info.access_token);
            }
            else {
                console.log("Generating error response: " + error);
                callback(error, null);
            }
        });
    }
    else {
        console.log("Retrieved accessToken from cache..");
        callback(null, cacheValue);
    }
    */
}
