var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var users = require('./users.js');
var utils = require('../includes/utils.js');


exports.forwardMeetings = function(data) {
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

		for (var i = 0; i < meetings.length; i++) {
			//if day is the same and canceld time was before this meeting 
			//forward the meeting in druation time and notifiy user
			if (utils.getFullDate(meetings[i].time) === utils.getFullDate(time) && utils.getFullTime(time) < utils.getFullTime(meetings[i].time)) {
				meetings[i].time = new Date(meetings[i].time.getTime() - druation * 60000);
				var message = {
					message: "your time in line: " + title + " updated ,  new time is: " + meetings[i].time,
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