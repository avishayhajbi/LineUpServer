var lineListsServer = require('../models/lineListsServer');
var meetingServer = require('../models/meetingServer');
var lineServer = require('../models/lineServer');

var users = require('../models/users');

module.exports = function (app) {

	app.get('/api/lineList?', lineListsServer.getlineList);
	app.get('/api/searchLineList?', lineListsServer.searchlineList);
	app.get('/api/getLine?', lineListsServer.getLine);

	app.get('/api/confirmMeeting?', meetingServer.confirmMeeting);
	app.get('/api/cancelConfirm?', meetingServer.cancelConfirm);
	app.get('/api/getPosition?', meetingServer.getPosition);
	app.get('/api/cancelMeeting?', meetingServer.cancelMeeting);


	app.get('/api/createLine?', lineServer.createLine);

	app.get('/api/userConnect?', users.userConnect);
    app.get('/api/connectToFB?', users.connectToFaceBook);
    app.get('/api/pushToken?', users.pushToken);
	
}
