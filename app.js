var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');


var request = require('request');
var config = require('./lib/config.js');
var restEndPoints = require('./lib/restEndPoints.js');


// Create a service (the app object is just a callback).
var app = module.exports = express();

//Add Express Config..
config.addToApp(app);

//Add REST end-points..
restEndPoints.addToApp(app);


//Only run as server if not called from a testing framework.
if (!module.parent) {
  //if not running on Heroku..
  if (!process.env.RUNNING_ON_HEROKU) {
    // Create an HTTP service.
    http.createServer(app).listen(80);
    console.log('Running on: port 80');

    // Create an HTTPS service identical to the HTTP service.
    var options = {
      key: fs.readFileSync('/etc/apache2/ssl/host.key'),
      cert: fs.readFileSync('/etc/apache2/ssl/server.crt')
    };
    console.log('Running on: port 443');
    https.createServer(options, app).listen(443);
  } else {
    console.log('Running on: port ' + process.env.PORT);
    http.createServer(app).listen(process.env.PORT);
  }
  console.log("process.env.RUNNING_ON_HEROKU = " + (process.env.RUNNING_ON_HEROKU ? 'true' : 'false'));
}