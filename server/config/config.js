var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');
module.exports = {
	development: {
		db:'mongodb://localhost/LineUp',
		rootPath:rootPath,
		port: process.env.PORT || 3030,
		portHttps: process.env.PORT || 3040
	},
	production: {
		db:'mongodb://madvinking:mad001177@ds031932.mongolab.com:31932/lineup',
		rootPath:rootPath,
		port: process.env.PORT || 80,
		portHttps: process.env.PORT || 443
	}
		
}