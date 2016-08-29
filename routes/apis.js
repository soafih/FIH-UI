var express = require('express');
var router = express.Router();
var permCheck = require('./mod/permission-check');

router.get('/', function(req, res) {
    // Set our internal DB variable
    var db = req.db;
    var collection = db.get('coll_api');
    collection.find({}, function(err, apis){
        if (err) throw err;
        res.status(200);
      	res.json(apis);
    });
});

router.get('/name/:name', permCheck.checkPermission('api.view'), function(req, res) {
    var db = req.db;
    var collection = db.get('coll_api');
    collection.findOne({ name: req.params.name }, function(err, api){
        if (err) throw err;
      	res.json(api);
    });
});

router.get('/name/:name/version/:version', permCheck.checkPermission('api.view'), function(req, res) {
    var db = req.db;
    var collection = db.get('coll_api');
    collection.findOne({ name: req.params.name, version: req.params.version }, function(err, api){
        if (err) throw err;
      	res.json(api);
    });
});

/*
router.post('/', function(req, res){
    var db = req.db;
    var collection = db.get('coll_api');
    console.log('Inserting API: '+req.body.name);
    collection.insert(req.body, function(err, api){
        if (err) throw err;
        console.log('Successfully Inserted: '+app.name);
        res.send(app);
    });
});
*/
router.post('/', permCheck.checkPermission('api.create'), function(req, res){
    var formattedDate = '2016-01-01T00:00:00.000Z';
    var db = req.db;
    var collection = db.get('coll_api');
    collection.insert({
        name: req.body.name,
        descr: req.body.description,
        version: req.body.version,
        references: req.body.references,
        published_date: formattedDate,
        icon: req.body.icon,
        api_ep: '',
        created_by: 'system',
        created_date: formattedDate,
        last_updated_by: 'system',
        last_updated_date: formattedDate
    }, function(err, api){
        if (err) {
            res.send("There was a problem adding the information to the database.");
        }
        else {
            res.json(api);
        }
    });
});

router.put('/name/:name', permCheck.checkPermission('api.create'), function(req, res){
    var db = req.db;
    var collection = db.get('coll_api');
    collection.update({
        name: req.params.name
    },
    req.body, function(err, api){
        if (err) throw err;
        res.json(api);
    });
});

/* Update directly
router.put('/name/:name', function(req, res){
    var db = req.db;
    var collection = db.get('coll_api');
    collection.update({
        name: req.params.name
    },
    {
        name: req.body.apiName,
        descr: req.body.apiDescr,
        version: req.body.apiVersion,
        references: req.body.apiReferences,
        published_date: req.body.apiPublishedDate,
        icon: req.body.apiIcon,
        api_ep: req.body.apiEP,
        created_by: req.body.apiCreatedBy,
        created_date: req.body.apiCreatedDate,
        last_updated_by: req.body.apiLastUpdatedBy,
        last_updated_date: req.body.apiLastUpdatedDate
    }, function(err, api){
        if (err) {
            res.send("There was a problem adding the information to the database.");
        }
        else {
            res.redirect("apislist");
        }
    });
});
*/

router.delete('/name/:name', permCheck.checkPermission('api.delete'), function(req, res){
    var db = req.db;
    var collection = db.get('coll_api');
    collection.remove({ name: req.params.name }, function(err, api){
        if (err) throw err;
        res.json(api);
    });
});

module.exports = router;
