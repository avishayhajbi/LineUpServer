var lineListsServer = require('../models/lineListsServer');
var meetingServer = require('../models/meetingServer');
var lineServer = require('../models/lineServer');
var web = require('../models/web');
var users = require('../models/users');
var auth = require('./auth');

module.exports = function(app) {

	app.get('/api/getRandomlineList?', lineListsServer.getRandomlineList);
	app.get('/api/searchLineList?', lineListsServer.searchlineList);
	app.get('/api/getLine?', lineListsServer.getLine);

	app.get('/api/joinLine?', meetingServer.joinLine);
	app.get('/api/getMeetingInfo?', meetingServer.getMeetingInfo);
	app.get('/api/confirmMeeting?', meetingServer.confirmMeeting);
	app.get('/api/cancelMeeting?', meetingServer.cancelMeeting);

	app.get('/api/createLine?', lineServer.createLine);
	app.get('/api/nextMeeting?', lineServer.nextMeeting);
	app.get('/api/getLineInfo?', lineServer.getLineInfo);
	app.get('/api/postponeLine?', lineServer.postponeLine);
	app.get('/api/endLine?', lineServer.endLine);

	app.get('/api/connectToFB?', users.connectToFaceBook);
	app.get('/api/updateLists?', users.updateLists);
	app.get('/api/pushToken?', users.pushToken);

	app.post('/api/logIn', auth.authenticateLogin);
	app.post('/api/signUp', auth.authenticateSignUp);
	app.post('/api/logOut', function(req, res) {
		req.logout();
		res.end();
	});

	app.get('/', web.home);
	app.get('/help', web.help);
	app.get('/lineRedirect', web.lineRedirect);
	app.get('/meetingRedirect', web.meetingRedirect);

	

}