var lineListsServer = require('../models/lineListsServer');
var meetingServer = require('../models/meetingServer');
var lineServer = require('../models/lineServer');
var web = require('../models/web');

var users = require('../models/users');

module.exports = function (app) {

	app.get('/api/lineList?', lineListsServer.getlineList);
	app.get('/api/searchLineList?', lineListsServer.searchlineList);
	app.get('/api/getLine?', lineListsServer.getLine);

	app.get('/api/joinLine?', meetingServer.joinLine);
	app.get('/api/cancelMeeting?', meetingServer.cancelMeeting);
	app.get('/api/meetingPosition?', meetingServer.meetingPosition);
	app.get('/api/confirmMeeting?', meetingServer.confirmMeeting);

	app.get('/api/createLine?', lineServer.createLine);
	app.get('/api/nextMeeting?', lineServer.nextMeeting);
	app.get('/api/whatToDo?', lineServer.whatToDo);

	app.get('/api/userConnect?', users.userConnect);
    app.get('/api/connectToFB?', users.connectToFaceBook);
    app.get('/api/pushToken?', users.pushToken);

     app.get('/', web.home);
     app.get('/help', web.help);
     app.get('/lineRedirect' , web.lineRedirect);


	
}


