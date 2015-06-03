var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

module.exports = function(app, config) {
	
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());
	app.use(allowCrossDomain);
}

var allowCrossDomain = function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
}