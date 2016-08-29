var async = require('async');

var https = require('https');
var querystring = require('querystring');
var NodeCache = require( "node-cache" );
var async = require('async');
var stackatoCache = new NodeCache();
var defaultTTL = 86399;

var host = 'aok.stackato-poc.foxinc.com';
var hostApi = 'api.stackato-poc.foxinc.com';
var username = process.env.FIH_SVC_USER;
var password = process.env.FIH_SVC_PASSWORD;

module.exports = {
    getUserOrgs: function (guid, callback) {
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
            callback(result);
        });
    }
};

function getOrgDetails(accessToken, orgsArr, callback) {
    async.map(orgsArr, getSpacesAndDomains, function(err, results) {
        console.log("getOrgDetails | Map completed. Error: ", err, " | result: ", JSON.stringify(results));
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

function getStackatoAccessTokenAsync(callback) {
    console.log("Entered getStackatoAccessTokenAsync");
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