var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    var db = req.db;
    var collection = db.get('coll_dbconfig');
    collection.find({}, function(err, databases){
        if (err) throw err;
      	res.json(databases);
    });
});

router.get('/name/:name', function(req, res) {
    var db = req.db;
    var collection = db.get('coll_dbconfig');
    collection.find({db_name: req.params.name}, function(err, database){
        if (err) throw err;
        console.log(req.params.name+ " | Fetched database details: "+database);
      	res.json(database[0]);
    });
});

router.get('/type/:type', function(req, res) {
    var db = req.db;
    var collection = db.get('coll_dbconfig');
    collection.find({name: req.params.name}, function(err, database){
        if (err) throw err;
      	res.json(database);
    });
});

router.get('/dbname', function(req, res) {
    var query = require('url').parse(req.url,true).query;
    var dbNameReg = '^'+query.dbname;
    var db = req.db;
    var collection = db.get('coll_dbconfig');
    collection.find({db_name: {$regex: dbNameReg, $options: 'i'}}, function(err, database){
        if (err) throw err;
      	res.json(database);
    });
});

router.get('/dbtype', function(req, res) {
    var query = require('url').parse(req.url,true).query;
    var dbTypeReg = '^'+query.dbtype;
    var db = req.db;
    var collection = db.get('coll_dbconfig');
    collection.find({db_type: {$regex: dbTypeReg, $options: 'i'}}, function(err, database){
        if (err) throw err;
      	res.json(database);
    });
});


router.post('/', function(req, res){
    var db = req.db;
    var collection = db.get('coll_dbconfig');
    console.log('Inserting DB: '+req.body.name);
    collection.insert(req.body, function(err, app){
        if (err) throw err;
        res.send(app);
        console.log('Successfully Inserted: '+app.name);
    });
});

router.post('/update', function(req, res) {
    console.log("Updating ");
    var appObjectId = req.body._id;
    delete req.body._id;
    console.log("Updating app status for objectId: "+appObjectId);

    var db = req.db;
    var collection = db.get('coll_dbconfig');
    collection.update({_id: appObjectId}, {$set: req.body}, 
        function(err, response){
            if (err) throw err;
            console.log("Successfully updated app status: "+response);
            res.json(response);
    });
});

router.delete('/:id', function(req, res){
     var appObjectId =req.params.id ;
      delete req.body.appObjectId;
    var db = req.db;
    var collection = db.get('coll_dbconfig');
    collection.remove({ _id: appObjectId }, function(err, app){
        if (err) throw err;
        res.send(app);
    });
});

module.exports = router;