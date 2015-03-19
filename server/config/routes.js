var lineListsServer = require('../models/lineListsServer');
var meetingServer = require('../models/meetingServer');
var mongoose = require('mongoose');

module.exports = function (app) {
	app.get('/api/lineList?', lineListsServer.getlineList);
	app.get('/api/searchlineList?', lineListsServer.searchlineList);
	app.get('/api/getLine?', lineListsServer.getLine);


	app.get('/api/requestMeeting?', meetingServer.requestMeeting);

// 	app.get('/partials/:partialPath', function (req, res) {
// 	res.render('partials/' + req.params.partialPath);
// });

// 	app.get('*', function (req, res) {
// 	res.render('index');
// });
	
}
