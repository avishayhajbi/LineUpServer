var lineListsServer = require('../models/lineListsServer');
var meetingServer = require('../models/meetingServer');
var lineServer = require('../models/lineServer');
var web = require('../models/web');
var users = require('../models/users');
var auth = require('./auth');

module.exports = function(app) {

	app.get('/api/getRandomlineList?',users.checkUserToken, lineListsServer.getRandomlineList);
	app.get('/api/searchLineList?', users.checkUserToken  , lineListsServer.searchlineList);
	app.get('/api/getLine?',users.checkUserToken, lineListsServer.getLine);

	app.get('/api/joinLine?',users.checkUserToken, meetingServer.joinLine);
	app.get('/api/getMeetingInfo?',users.checkUserToken, meetingServer.getMeetingInfo);
	app.get('/api/confirmMeeting?',users.checkUserToken, meetingServer.confirmMeeting);
	app.get('/api/followMeeting?',users.checkUserToken, meetingServer.followMeeting);
	app.get('/api/cancelMeeting?',users.checkUserToken, meetingServer.cancelMeeting);

	app.get('/api/createLine?',users.checkUserToken, lineServer.createLine);
	app.get('/api/nextMeeting?',users.checkUserToken, lineServer.nextMeeting);
	app.get('/api/getLineInfo?',users.checkUserToken, lineServer.getLineInfo);
	app.get('/api/postponeLine?',users.checkUserToken, lineServer.postponeLine);
	app.get('/api/endLine?',users.checkUserToken, lineServer.endLine);

	app.get('/api/connectToFB?',users.checkUserToken, users.connectToFaceBook);
	app.get('/api/updateLists?',users.checkUserToken, users.updateLists);
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