var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    // Set our internal DB variable
    var db = req.db;
    var collection = db.get('coll_app');
    collection.find({}, function(err, apps){
        if (err) throw err;
      	res.json(apps);
    });
});

router.get('/name/:name', function(req, res) {
    var db = req.db;
    var collection = db.get('coll_app');
    collection.findOne({name: req.params.name }, function(err, app){
        if (err) throw err;
        console.log("Fetched details for app: "+app);
      	res.json(app);
    });
});

router.get('/appobjectid', function(req, res) {
    var db = req.db;
    var collection = db.get('coll_app');

    var query = require('url').parse(req.url,true).query;
    console.log("Fetching app data with object id: "+query.appobjectid);
    collection.find(query.appobjectid, function(err, app){
        if (err) throw err;
      	res.json(app);
    });
});

router.post('/', function(req, res){
    var db = req.db;
    var collection = db.get('coll_app');
    console.log('Inserting APP: '+req.body.name);
    collection.insert(req.body, function(err, app){
        if (err) throw err;
        res.send(app);
        console.log('Successfully Inserted: '+app.name);
    });
});

router.post('/updateStatus', function(req, res) {
    var appObjectId = req.body.appObjectId;
    delete req.body.appObjectId;
    console.log("Updating app status for objectId: "+appObjectId);

    var db = req.db;
    var collection = db.get('coll_app');
    collection.update({_id: appObjectId}, {$set: req.body}, 
        function(err, response){
            if (err) throw err;
            console.log("Successfully updated app status: "+response);
            res.json(response);
    });
});

router.post('/addappform', function(req, res){
    var formattedDate = new Date();
    console.log(formattedDate);
    var db = req.db;
    var collection = db.get('coll_app');
    collection.insert({
        name: req.body.name,
        api_type: 'DAAS',
        api_ver: '1.0',
        descr: req.body.descr,
        version: '1.0',
        endpoint: 'TBD',
        status: 'Saved',
        servicename: req.body.name,
        created_by: 'System',
        created_date: formattedDate,
        last_updated_by: 'System',
        last_updated_date: formattedDate,
        messages: [{message: 'First Version'}],
        stackato_config: {org: req.body.selectedOrg,space: req.body.selectedSpace},
        api_config: {
            db_name: req.body.db_name,
            query: req.body.db_query
        }
    }, function(err, app){
        if (err) {
            res.send("There was a problem adding the information to the database.");
        }
        else {
            res.redirect("/#/apps");
        }
    });
});


router.put('/name/:name', function(req, res){
    var db = req.db;
    var collection = db.get('coll_app');
    collection.update({
        name: req.params.name
    },
    req.body, function(err, app){
        if (err) throw err;
        res.json(app);
    });
});

/* Directly from UI
router.put('/name/:name', function(req, res){
    var db = req.db;
    var collection = db.get('coll_app');
    collection.update({
        name: req.params.name
    },
    {
        name: req.body.appName,
        api_type: req.body.apiType,
        api_ver: req.body.apiVersion,
        descr: req.body.appDescr,
        version: req.body.appVersion,
        endpoint: req.body.appEndpoint,
        status: req.body.appStatus,
        servicename: req.body.appServiceName,
        created_by: req.body.appCreatedBy,
        created_date: req.body.appCreatedDate,
        last_updated_by: req.body.appLastUpdatedBy,
        last_updated_date: req.body.appLastUpdatedDate,
        messages: [{message: req.body.message}],
        stackato_config: {org: req.body.stackatoOrg,space: req.body.stackatoSpace},
        api_config: {
            query: req.body.apiQuery, 
            db_config: {
                db_type: req.body.apiDbType,
                host: req.body.apiDbHost,
                port: req.body.apiDbPort,
                uname: req.body.apiDbUserName,
                pwd: req.body.apiDbPassword,
                conn_string: req.body.apiDbConnString,
                db_name: req.body.apiDbName,
                schema: req.body.apiDbSchema
            }
        }
    }, function(err, app){
        if (err) {
            res.send("There was a problem adding the information to the database.");
        }
        else {
            res.redirect("appslist");
        }
    });
});
*/

router.delete('/name/:name', function(req, res){
    var db = req.db;
    var collection = db.get('coll_app');
    collection.remove({ name: req.params.name }, function(err, app){
        if (err) throw err;
        res.json(app);
    });
});

module.exports = router;
