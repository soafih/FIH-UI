
// Initialize Monk for establishing connection with MongoDB
var monk = require('monk');
//var db =  monk('mongodb://5eb31b82-3347-481f-a7f5-f9759fb2583a:22669d9e-531d-4176-bd5c-7844e1add561@10.135.4.49:15001/db');
var db = monk(process.env.MONGODB_URL);
console.log("MongoDB URL: "+process.env.MONGODB_URL);