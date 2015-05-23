var userdb = require('./SchemeModel.js').userdb;
var gcm = require('node-gcm');
var fs = require('fs');

var home = fs.readFileSync('server/web/home.html', "utf8");
exports.home = function(req, res) {
		res.status(200).send(home);
}

var top = '<html><head><title>LineUp</title></head><body><script type="text/javascript">';
var bottom = '</script></body></html>';
exports.lineRedirect = function(req, res) {
	
		if (!req.query.lineId) {
			console.log("noLineId");
			res.status(200).send(home);	
			return;
		}
		var link = 'window.open("lineup://lineId='+req.query.lineId+'", "_system");';
		res.status(200).send(top+link+bottom);
}