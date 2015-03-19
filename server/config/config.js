var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');
module.exports = {
	development: {
		db:'mongodb://localhost/surf',
		rootPath:rootPath,
		port: process.env.PORT || 3030
	},
	production: {
		db:'mongodb://madvinking:mad001177@ds047950.mongolab.com:47950/surf',
		rootPath:rootPath,
		port: process.env.PORT || 80
	}
}