var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');


module.exports = function (app ,config) {

	app.use(logger('dev'));
	app.use(allowCrossDomain);
}

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}