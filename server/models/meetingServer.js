var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var users = require('./users.js');
var combineHandler = require('./combineHandler.js');
var utils = require('../includes/utils.js');

exports.joinLine = function(req, res) {

	if (!req.query.lineId || !req.query.userId || !req.query.userName) {
		console.log('joinLine@  no search query return nothing');
		res.send(false);
		return;
	}

	var lineId = req.query.lineId;
	var userId = req.query.userId;
	var userName = req.query.userName;
	var meeting = {
		lineId: lineId,
		userId: userId,
		userName: userName
	};
	db.findOne({
		"_id": lineId
	}, function(err, data) {

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
		meeting.confirmed = false;
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
				if (err || !data) {
					console.log("joinLine.findOne.err@ ", err);
					res.send(false);
					return;
				}
				if (data > 0) {
					//users.notify("newUserInLine" ,lineManagerId ,lineId);
					res.send(meeting.time);
				} else {
					res.send(false);
				}

			});
	});

};

exports.updateMeetingInfo = function(req, res) {
	if (!req.query.lineId || !req.query.userId) {
		console.log("no doc");
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var userId = req.query.userId;
	db.findOne({
			"_id": lineId
		}, function(err, data) {

			if (err || !data) {
				console.log(err);
				res.send(false);
				return;
			}
			var line = data.toJSON();
			if (!line) {
				console.log("no line");
				res.send(false);
				return;
			}
			var meetings = line.meetings;

			for (var i = 0; i < meetings.length; i++) {

				if (meetings[i].userId === userId) {
					var details = {
						position: i.toString(),
						time: meetings[i].time,
						confirmed: meetings[i].confirmed,
						active: line.active,
						druation: line.druation,
						confirmTime: line.confirmTime,
						lineId:line._id,
						title:line.title,
						location:line.location
					}
					for (var j = 0; j < line.availableDates.length; j++) {
						if (line.availableDates[j].from.getDate() == meetings[i].time.getDate()) {
							details.startDate = line.availableDates[j].from;
							details.endDate = line.availableDates[j].to;
						}
					}
					
					res.send(details);
					return;
				}		
			}
			res.send(false);
		}
	);
}

exports.confirmMeeting = function(req, res) {

	if (!req.query.lineId || !req.query.userId) {
		console.log("no request");
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var userId = req.query.userId;

	db.update({
			"_id": lineId,
			meetings: {
				$elemMatch: {
					userId: userId
				}
			}
		}, {
			$set: {
				'meetings.$.confirmed': true
			}
		},
		function(err, data) {
			if (err || !data || data === 0) {
				console.log(err);
				res.send(false);
				return;
			}
			res.send(true);
		});

};

exports.cancelMeeting = function(req, res) {

	debugger;

	if (!req.query.lineId || !req.query.userId || !req.query.time || !req.query.userName) {
		console.log('cancelMeeting@ no search query return nothing');
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var userId = req.query.userId;
	var time = req.query.time;
	var userName = req.query.userName;

	var cancel = {
		userId: userId,
		time: time,
		userName: userName
	};
	db.update({
		"_id": lineId
	}, {
		$pull: {
			meetings: {
				userId: userId
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
			forwardMeetings(cancel);
			res.send(true);
			return;
		}
		res.send(false);

	});

};

function forwardMeetings(data) {
	var time = new Date(data.time);
	var lineId = data.lineId;
	db.findOne({
		"_id": lineId
	}, "meetings waitingAproval druation availableDates title lineManagerId", function(err, result) {

		if (err || !result) {
			console.log("forwardMeetings.find.err@ ", err);
			return;
		}
		var doc = result.toJSON();
		var title = doc.title;
		var meetings = doc.meetings;
		var availableDates = doc.availableDates;
		var druation = doc.druation;
		var lineManagerId = doc.lineManagerId;
		//go on all meetings and forward them in the druation time

		var pushMeetings = [];
		for (var i = 0; i < meetings.length; i++) {
			//if day is the same and canceld time was before this meeting 
			//forward the meeting in druation time and notify user
			if (utils.getFullDate(meetings[i].time) === utils.getFullDate(time) && utils.getFullTime(time) < utils.getFullTime(meetings[i].time)) {
				meetings[i].time = new Date(meetings[i].time.getTime() - druation * 60000);
				pushMeetings.push(meetings[i]);
			}
		}
		users.notifyAll("204", pushMeetings, 0, title, lineId);
		//forward the next avilabledate  becusae deleted one meeting
		for (var i = 0; i < availableDates.length; i++) {
			if (utils.getFullDate(availableDates[i].from) === utils.getFullDate(time)) {
				if (availableDates[i].nextMeeting === null) {
					availableDates[i].nextMeeting = availableDates[i].to;
				} else {
					availableDates[i].nextMeeting = new Date(availableDates[i].nextMeeting.getTime() - druation * 60000)
				}
				break;
			}
		}

		//users.notify("userCancelDmeeting" ,lineManagerId ,lineId);
		db.update({
				"_id": lineId
			}, {
				$set: {
					availableDates: availableDates
				},
				$inc: {
					meetingsCounter: -1
				}
			},
			function(err, data) {

				if (err) {
					console.log("forwardMeetings.update.err@ ", err);
					return;
				}
				console.log(data);
			});
	});
}