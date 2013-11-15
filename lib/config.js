var express = require('express');
var path = require('path');
var ejs = require('ejs');

function Config() {

	//Store APP_SECRET in this object (singleton)
	this.APP_SECRET = process.env.APP_SECRET;

	this.addToApp = function(app) {
		//Set API_SECRET via environment variable
		//app.APP_SECRET = process.env.APP_SECRET;

		app.configure(function() {
			app.use(express.favicon());
			app.set('view engine', 'ejs');
			app.use(express.logger('dev'));
			app.use(express.cookieParser());
			app.use(express.bodyParser());
			app.use(express.methodOverride());
			app.use(express.static(path.join(__dirname, '/../', 'public')));
		});
	}
}

module.exports = exports = new Config;