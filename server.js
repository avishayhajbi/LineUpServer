var express = require('express');

var session = require('express-session');
var passport = require('passport');

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./server/config/config')[env];

var app = express();

require('./server/config/express')(app,config);

require('./server/config/mongoose')(config);

require('./server/config/routes')(app);


app.listen(config.port);
console.log('Listening on port' + config.port + '...');