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
    collection.find({name: req.params.name}, function(err, database){
        if (err) throw err;
      	res.json(database);
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

module.exports = router;