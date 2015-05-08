var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var users = require('./users.js');
var utils = require('../includes/utils.js');


exports.confirmMeeting = function(req, res) {

	var meeting = JSON.parse(req.query.meeting);
	console.log("metting:" + meeting);

	if (meeting === undefined || meeting === '' || !meeting || meeting === null) {
		console.log('confirmMeeting@  no search query return nothing');
		res.send(false);
		return;
	}
	db.moveToConfirmed(meeting.lineId, meeting, function(err, data) {
		
		if (err) {
			console.log("confirmMeeting.DBmoveToConfirmed.err@ ", err);
			res.send(false);
			return;
		}
		res.send(true);

	});

};

exports.cancelConfirm = function(req, res) {

	var meeting = JSON.parse(req.query.meeting);
	console.log("metting:" + meeting);

	if (meeting === undefined || meeting === '' || !meeting || meeting === null) {
		console.log('confirmMeeting@  no search query return nothing');
		res.send(false);
		return;
	}
	db.moveToConfirmed(meeting.lineId, meeting, function(err, data) {
		
		if (err) {
			console.log("confirmMeeting.DBmoveToConfirmed.err@ ", err);
			res.send(false);
			return;
		}
		res.send(true);

	});

};



exports.getPosition = function(req, res) {
	var meeting = JSON.parse(req.query.meeting);
	if (meeting === undefined || meeting === '' || !meeting || meeting === null) {
		console.log('getPosition@ no search query return nothing');
		res.send(false);
		return;
	}
	db.find({
		"_id": meeting.lineId
	}, "meetings", function(err, data) {

		if (err) {
			console.log("getPosition.find.err@ ", err);
			res.send(false);
			return;
		}
		if (!data[0]._doc.meetings) { 
			console.log("getPosition.find.err@ cant get position");
			res.send(false);
			return;
		}
		var meetings = data[0]._doc.meetings;
		meetings = utils.sort(meetings, "time");
		var position = utils.search(meetings, meeting.userId, false, "index");
		if (position !== false) {
			res.send(position.toString());
			return;
		}
		res.send(false);
	});

};


exports.cancelMeeting = function(req, res) {

	var cancel = JSON.parse(req.query.toCancel);
	if (cancel === undefined || cancel === '' || !cancel || cancel === null) {
		console.log('cancelMeeting@ no search query return nothing');
		res.send(false);
		return;
	}
	db.update({
		"_id": cancel.lineId
	}, {
		$pull: {
			meetings: {
					userId: cancel.userId
				}
			}
		
	}, function(err, data) {
		
		if (err) {
			console.log("cancelMeeting.update.err@ ", err);
			res.send(false);
			return;
		}
		if (data > 0) {
			delete cancel.userId;
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
	db.find({
		"_id": lineId
	}, "meetings waitingAproval druation availableDates title lineManagerId", function(err, result) {
		
		if (err) {
			console.log("forwardMeetings.find.err@ ", err);
			return;
		}
		var doc = result[0]._doc;
		var title = doc.title;
		var meetings = doc.meetings;
		var availableDates = doc.availableDates;
		var druation = doc.druation;
		var lineManagerId = doc.lineManagerId;
		//go on all meetings and forward them in the druation time
		
		for (var i = 0; i < meetings.length; i++) {
			//if day is the same and canceld time was before this meeting 
			//forward the meeting in druation time and notifiy user
			if (utils.getFullDate(meetings[i].time) === utils.getFullDate(time) && utils.getFullTime(time) < utils.getFullTime(meetings[i].time)) {
				meetings[i].time = new Date(meetings[i].time.getTime() - druation * 60000);
				var message = {
					message: "your time in line: "+title  + " updated ,  new time is: " + meetings[i].time,
					title: "LineUp",
					key1: lineId,
					key2: meetings[i].time
				}
				users.notifyUser(meetings[i].userId, message);
			}
		}
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

		var message = {
			message: data.userName + " canceled is reservasion at:" + data.title,
			title: "LineUp",
			key1: lineId,
			key2: data.userName
		};
		users.notifyUser(lineManagerId, message);


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