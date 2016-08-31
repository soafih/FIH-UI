var express = require('express');
var router = express.Router();
var permCheck = require('./mod/permission-check');

router.get('/', permCheck.checkPermission('app.view'), function(req, res) {
    // Set our internal DB variable
    var db = req.db;
    var collection = db.get('coll_app');
    collection.find({}, function(err, apps){
        if (err) throw err;
      	res.json(apps);
    });
});

router.post('/userorgspace', permCheck.checkPermission('app.view'), function (req, res) {
    var db = req.db;
    
    var orgs = req.body.orgs;
    var spaces = req.body.spaces;

    var collection = db.get('coll_app');
    collection.find({
        $and: [{
            "stackato_config.org": { "$in": orgs}},
            {"stackato_config.space": { "$in": spaces}}
        ]
    }, function (err, response) {
        if (err) throw err;
        var apps = {"apps": response};
        res.json(apps);
    });
});

router.get('/name/:name', permCheck.checkPermission('app.view'), function(req, res) {
    var db = req.db;
    var collection = db.get('coll_app');
    collection.findOne({name: req.params.name }, function(err, app){
        if (err) throw err;
        console.log("Fetched details for app: "+app);
      	res.json(app);
    });
});

router.get('/objectid/:objectid',  function(req, res) {
    var db = req.db;
    var collection = db.get('coll_app');
    console.log("Fetching app data with object id: "+req.params.objectid);
    collection.findOne(req.params.objectid, function(err, app){
        if (err) throw err;
      	res.json(app);
    });
});

router.post('/', permCheck.checkPermission('app.create'), function(req, res){
    var db = req.db;
    var collection = db.get('coll_app');
    console.log('Inserting APP: '+req.body.name);
    collection.insert(req.body, function(err, app){
        if (err) throw err;
        res.send(app);
        console.log('Successfully Inserted: '+app.name);
    });
});

router.post('/updateStatus', permCheck.checkPermission('app.view'), function(req, res) {
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

router.delete('/name/:name', permCheck.checkPermission('app.delete'), function(req, res){
    var db = req.db;
    var collection = db.get('coll_app');
    collection.remove({ name: req.params.name }, function(err, app){
        if (err) throw err;
        res.send(app);
    });
});

module.exports = router;
