var express = require('express');
var router = express.Router();

/*var oracledb = require('oracledb');

router.post('/testdbconn', function(req, res) {
    oracledb.getConnection(
    {
        user          : "soa_custom",
        password      : "soa_cust124",
        connectString : "ffeuswduxdb95.foxinc.com:1521/PRJSOAD"
    },
    function(err, connection)
    {
        if (err) { console.error(err.message); return; }
        console.log('Connected to Oracle DB');
        console.log('Executing query: '+req.body.db_query);
        connection.execute(
        //"select * from dual",  // bind value for :id
        req.body.db_query,
        [], // Query Parameters
        function(err, result)
        {
            if (err) { console.error("Error in fetching data from OracleDB: "+err.message); throw err; }
            console.log("Result from OracleDB:"+result.rows);
            res.send(result);
        });
    });
});
*/


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