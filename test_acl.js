        var mongodb = require('mongodb');
        var acl = require('acl');
        
        var client = mongodb.connect('mongodb://31a05a3c-4f8a-41e3-a25d-f007059edbeb:6e017e2e-018f-4791-8f8f-3fd2ab01ab42@10.215.72.33:15001/db');
        var monk = require('monk');
//var db =  monk('mongodb://5eb31b82-3347-481f-a7f5-f9759fb2583a:22669d9e-531d-4176-bd5c-7844e1add561@10.135.4.49:15001/db');
var db = monk(process.env.MONGODB_URL);
        // create a redis backend
        //var client = require('redis').createClient(6379, '127.0.0.1', {no_ready_check: true});

        // initialize acl system storing data in the redis backend
        // Or Using the mongodb backend

        acl = new acl(new acl.mongodbBackend(db, "acl_"));
acl.allow([
            {
            roles: ['registered'],
            allows:[
                    {resources: 'user', permissions:['put', 'get', 'delete']},
                    {resources: 'device/assign', permissions:['put']},
                    {resources: '/owner', permissions:['get']}
                    ]
            }]);
        /* now assign permissions to roles */

        // allow guests to view posts
        acl.allow("guest", "post", "view");

        // allow registered users to view and create posts
        acl.allow("registered users", "post", ["view", "create"]);

        // allow administrators to perform any action on posts
        acl.allow("administrator", "post", "*");
    

        // make user "Alice" {id: 1, name: "Alice"} an administrator
        acl.addUserRoles(1, "administrator");

        // make user "Bob" {id: 2, name "Bob"} a registered user
        acl.addUserRoles(2, "registered user");

        // make all users that are not signed in (i.e. id=0) guests
        acl.addUserRoles(0, "guest");
    