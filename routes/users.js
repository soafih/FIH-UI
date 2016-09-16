var express = require('express');
var router = express.Router();

var async = require('async');
var stackato = require('./mod/stackato-mod');
var permCheck = require('./mod/permission-check');

var db = {};

router.get('/', function(req, res) {
    var db = req.db;
    var collection = db.get('coll_user');
    collection.find({}, function(err, users){
        if (err) throw err;
      	res.json(users);
    });
});

router.get('/roles', function(req, res) {
    var db = req.db;
    var collection = db.get('coll_role');
    collection.find({}, function(err, roles){
        if (err) throw err;
      	res.json(roles);
    });
});

module.exports = router;
