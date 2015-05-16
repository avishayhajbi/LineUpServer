var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var users = require('./users.js');
var combineHandler = require('./combineHandler.js');
var utils = require('../includes/utils.js');


exports.joinLine = function(req, res) {

	if (!req.query.meeting) {
		console.log('joinLine@  no search query return nothing');
		res.send(false);
		return;
	}

	var meeting = JSON.parse(req.query.meeting);
	if (!meeting) {
		console.log('joinLine@  no search query return nothing');
		res.send(false);
		return;
	}
	debugger;
	console.log("meeting:" + meeting);
	var lineId = meeting.lineId;
	db.findOne({
		"_id": lineId
	}, function(err, data) {
		debugger;
		if (err || !data) {
			console.log("joinLine.findOne.err@ ", err);
			res.send(false);
			return;
		}

		var line = data.toJSON();

		if (!line.drawMeetings) {
			console.log("noRoom");
			res.send("noRoom");
			return;
		}
		meeting.time = line.availableDates[line.day.indexOfDay].nextMeeting;
		line.meetingsCounter++;


		//fowroard meetings
		line.availableDates[line.day.indexOfDay].nextMeeting = new Date(line.availableDates[line.day.indexOfDay].nextMeeting.getTime() + line.druation * 60000);
		//if nextmeeting is after line finishes
		if (line.availableDates[line.day.indexOfDay].nextMeeting > line.availableDates[line.day.indexOfDay].to) {
			//yes it is forward one day 
			line.availableDates[line.day.indexOfDay].nextMeeting = null;
			line.day.indexOfDay++;
			//if this is the last day
			if (line.day.indexOfDay === line.day.maxDays) {
				line.drawMeetings = false;
			}
		}
		delete meeting.lineId;
		db.update({
				"_id": lineId
			}, {
				$set: {
					availableDates: line.availableDates,
					day: line.day,
					drawMeetings: line.drawMeetings,
					meetingsCounter: line.meetingsCounter
				},
				$push: {
					meetings: meeting
				}
			},
			function(err, data) {
				if (err || !data){
					console.log("joinLine.findOne.err@ ", err);
					res.send(false);
					return;
				}
				if (data > 0) {
					res.send(meeting.time);
				} else {
					res.send(false);
				}

			});
	});

};


exports.meetingPosition = function(req, res) {
	if (!req.query.lineId || !req.query.userId) {
		console.log("no doc");
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var userId = req.query.userId;
	db.findOne({
		"_id": lineId
	}, "meetings", function(err, data) {

		if (err || !data) {
			console.log(err);
			res.send(false);
			return;
		}
		var doc = data.toJSON();
		if (!doc) {
			console.log("no doc");
			res.send(false);
			return;
		}
		var meetings = doc.meetings;

		for (var i = 0; i < meetings.length; i++) {
			if (meetings[i].userId === userId) {
				res.send(i.toString());
				return;
			}
		}
		res.send(false);
	});
}

exports.cancelMeeting = function(req, res) {

	var cancel = JSON.parse(req.query.toCancel);

	if (!cancel) {
		console.log('cancelMeeting@ no search query return nothing');
		res.send(false);
		return;
	}
	var lineId = cancel.lineId;
	delete cancel.lineId;
	db.update({
		"_id": lineId
	}, {
		$pull: {
			meetings: {
				userId: cancel.userId
			}
		},
		$push: {
			canceldMeetings: cancel
		}

	}, function(err, data) {

		if (err) {
			console.log("cancelMeeting.update.err@ ", err);
			res.send(false);
			return;
		}
		if (data > 0) {
			delete cancel.userId;
			cancel.lineId = lineId;
			combineHandler.forwardMeetings(cancel);
			res.send(true);
			return;
		}
		res.send(false);

	});

};