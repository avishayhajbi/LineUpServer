var express = require('express');
// var fs = require('fs');
var http = require('http');
// var https = require('https');
// var crypto = require('crypto');
// var privateKey  = fs.readFileSync('./sslcert/privkey.pem', 'utf8');
// var certificate = fs.readFileSync('./sslcert/cert.crt', 'utf8');



// var credentials = crypto.createCredentials({key: privateKey, cert: certificate});
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./server/config/config')[env];

var app = express();

require('./server/config/express')(app,config);

require('./server/config/passport')(config);

require('./server/config/mongoose')(config);

require('./server/config/routes')(app);



var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

httpServer.listen(config.port);
console.log('http Listening on port:' + config.port + '...');
// httpsServer.listen(config.portHttps);
// console.log('https Listening on port:' + config.portHttps + '...');
