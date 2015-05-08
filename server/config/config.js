var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');
module.exports = {
	development: {
		db:'mongodb://localhost/LineUp',
		rootPath:rootPath,
		port: process.env.PORT || 3030,
		FBcallbackURL: 'http://localhost:8080/auth/facebook/callback',
		FBclientID: '800206223408829',
 		FBclientSecret: '0934b5eab337dbcd4fa20313e9e16409',
		GoogleCallbackURL   : 'http://localhost:8080/auth/google/callback',
		GoogleClientID      : 'your-secret-clientID-here',
        GoogleClientSecret  : 'your-client-secret-here'
	},
	production: {
		db:'mongodb://madvinking:mad001177@ds047950.mongolab.com:47950/LineUp',
		rootPath:rootPath,
		port: process.env.PORT || 80,
		FBcallbackURL: /*/need to update/*/"auth/facebook/callback",
		FBclientID: '800206223408829',
 		FBclientSecret: '0934b5eab337dbcd4fa20313e9e16409',
		GoogleCallbackURL   : 'http://localhost:8080/auth/google/callback',
		GoogleClientID      : 'your-secret-clientID-here',
        GoogleClientSecret  : 'your-client-secret-here'
	}
		
    
}