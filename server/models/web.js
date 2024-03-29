var userdb = require('./SchemeModel.js').userdb;
var gcm = require('node-gcm');
var fs = require('fs');

var home = fs.readFileSync('server/web/home.html', "utf8");
exports.home = function(req, res) {
		res.status(200).send(home);
}
var help = fs.readFileSync('server/web/help.html', "utf8");
exports.help = function(req, res) {
		res.status(200).send(help);
}


var top = '<html><head><title>LineUp</title></head><body><script type="text/javascript">';
var bottom = '</script></body></html>';
exports.lineRedirect = function(req, res) {
	
		if (!req.query.lineId) {
			console.log("noLineId");
			res.status(200).send(home);	
			return;
		}
		var link = 'window.open("lineup://'+req.query.lineId+'", "_system");';
		res.status(200).send(top+link+bottom);
}

exports.meetingRedirect = function(req, res) {
		if (!req.query.lineId || !req.query.userId) {
			console.log("noIds");
			res.status(200).send(home);	
			return;
		}
		var link = 'window.open("lineup://'+req.query.lineId+'&&'+req.query.userId+'", "_system");';
		res.status(200).send(top+link+bottom);
}