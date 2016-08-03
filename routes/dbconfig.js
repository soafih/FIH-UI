var express = require('express');
var router = express.Router();

var _ = require('lodash');
var asyncjs = require('async');
//var ex = require('../config/jdbc-conn');
NodeJDBC = require('nodejdbc');
Promise = require('bluebird');


var JDBC = require('jdbc');
var jinst = require('jdbc/lib/jinst');

if (!jinst.isJvmCreated()) {
  jinst.addOption("-Xrs");
  jinst.setupClasspath(['./driver/ojdbc6_g.jar']);
}

/*var config = {
    libs : './driver/ojdbc7.jar',
    className: 'oracle.jdbc.driver.OracleDriver',
    url: 'jdbc:oracle:thin:@//ffeuswduxdb95.foxinc.com:1521/PRJSOAD',
    properties: {
        username: 'soa_custom',
        password: 'soa_cust124'
    }
};*/

var oracledb = new JDBC({
  url: 'jdbc:oracle:thin:@//ffeuswduxdb95.foxinc.com:1521/ENTSOAD',
  className: 'oracle.jdbc.driver.OracleDriver',
  minpoolsize: 5,
  maxpoolsize: 10,
  username: 'ENT_SOAINFRA',
  password: 'Int_s0a'
  //properties: {
    
  //}
});
router.post('/testdbconn', function (req, res) {
    // Select statement example.
    oracledb.reserve(function (err, connObj) {
        // The connection returned from the pool is an object with two fields
        // {uuid: <uuid>, conn: <Connection>}
        if (connObj) {
            console.log("Using connection: " + connObj.uuid);
            // Grab the Connection for use.
            var conn = connObj.conn;

            conn.createStatement(function (err, statement) {
                if (err) {
                    callback(err);
                } else {
                    statement.executeQuery("SELECT sysdate FROM dual;", function (err, resultset) {
                        if (err) {
                            callback(err);
                        } else {
                            // Convert the result set to an object array.
                            resultset.toObjArray(function (err, results) {
                                if (results.length > 0) {
                                    console.log("ID: " + results[0].sysdate);
                                }
                                callback(null, resultset);
                            });
                        }
                    });
                }
            });
        }
    });
});
    /*console.log("Entered testdbconn");
    nodejdbc = new NodeJDBC(config);
    
    console.log('Executing query: '+req.body.db_query);
    var sql = req.body.db_query;
    nodejdbc = new NodeJDBC(config);
    promise = nodejdbc.createStatement().then(function(statement){
        statement.executeQuery(sql).then(function(rs){
            result = [];
            while(rs.next()){
                name = rs.getString('SYSDATE');
//                id = rs.getString('ID');
                result.push = {
                    sysdate: name
                };
            }
            return result;
        });
    });

    var result = [];   
    promise.then(function (result){
        nodejdbc.getConnection().then(function(connection){ 
            connection.close();
        });
    });
    console.log(result);*/


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