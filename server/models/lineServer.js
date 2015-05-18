var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var utils = require('../includes/utils.js');
var users = require('./users.js');
var cron = require('node-schedule');
var combineHandler = require('./combineHandler.js');

exports.createLine = function(req, res) {

	if (!req.query.line) {
		console.log('no search query return nothing');
		res.send(false);
		return;
	}
	var line = JSON.parse(req.query.line);
	var jobTimes = [];
	var i;

	for (i = 0; i < line.availableDates.length; i++) {
		line.availableDates[i].from = new Date(line.availableDates[i].from);
		line.availableDates[i].to = new Date(line.availableDates[i].to);
		line.availableDates[i].nextMeeting = line.availableDates[i].from;
		jobTimes.push(new Date(line.availableDates[i].from.getTime() - line.confirmTime * 60000));
	}
	line.day = {
		indexOfDay: 0,
		maxDays: i
	};
	line.drawMeetings = true;
	line.active = false;
	line.currentMeeting = 0;
	line.availableDates = utils.sort(line.availableDates, "from");
	line.meetings = [];
	line.canceldMeetings = [];
	line.passedMeetings = [];
	line.meetingsCounter = 0;

	db.create(line, function(err, data) {

		console.log("insert new");
		if (err || !data) {
			console.log(err);
			res.send(false);
			return;
		}
		var doc = data.toJSON();
		addJobs(data._id.toString(), jobTimes);
		console.log("insert new");
		res.send(data._id);

	});

};


exports.nextMeeting = function(req, res) {

	if (!req.query.lineId) {
		console.log('no search query return nothing');
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	db.findOne({
		"_id": lineId
	}, function(err, data) {

		if (err || !data) {
			console.log(err);
			res.send(false);
			return
		}

		var doc = data.toJSON();

		doc.passedMeetings.push(doc.currentMeeting);

		handleNextConfirmations(lineId, doc.meetings, doc.confirmTime, doc.druation);


		if (!doc.currentMeeting) {
			console.log("no more meetings");
			res.send(false);
			return;
		}
		//if there is more meetings

		var forwardMeetings = false;
		var next = doc.meetings.pop();


		if (next) {
			//yes there is another meeting 
			var CheckIfNextDay = new Date(new Date(next.time).getTime() - new Date(doc.currentMeeting.time).getTime());
			//check if the meeting is in the this day of other
			if (CheckIfNextDay.getTime() / 60000 <= doc.druation) {
				//meeting is in this day 
				doc.currentMeeting = next;

				var message = {
					message: "202",
					title: "LineUp",
					key1: lineId,
					key2: doc.currentMeeting.time
				}
				users.notifyUser(doc.currentMeeting.userId, message);

				var offset = next.time.getTime() - new Date().getTime();
				if (offset > 5 || offset < -5) {
					forwardMeetings = true;

					res.send("next meeting enterd " + " meeting took more/less 5 min notifiy all users");
				} else {
					res.send("next meeting enterd");
				}
			} else {
				//metting is tomorw close the line for now 
				doc.currentMeeting = null;
				doc.day.indexOfDay++;
				doc.active = false;
				res.send("line done for today will start again next day");
			}

		} else {
			//no more meetings in list 
			var offset = new Date(doc.availableDates[doc.day.indexOfDay].to - new Date());
			if (offset < doc.druation) {
				//no more room for meetings 
				if (doc.day.indexOfDay < doc.day.maxDays - 1) {
					// line finish for today
					res.send("line done for today");
				} else {
					// line ended
					doc.drawMeetings = false;
					res.send("line ended");
				}
				doc.currentMeeting = null;
				doc.active = false;

			} else {
				//TODO ask admon what to do
				res.send("askWhatToDo");
			}

		}

		db.update({
			"_id": lineId
		}, {
			currentMeeting: doc.currentMeeting,
			active: doc.active,
			drawMeetings: doc.drawMeetings,
			day: doc.day,
			meetings: doc.meetings,
			passedMeetings: doc.passedMeetings
		}, {
			upsert: true
		}, function(err, data) {

			if (err || !data || data === 0) {
				console.log(err);
				res.send(false);
				return
			}

			if (forwardMeetings) combineHandler.forwardMeetings(doc);
		});


	});

}

exports.whatToDo = function(req, res) {

	if (!req.query.lineId || !req.query.answer) {
		console.log('no req');
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var answer = req.query.answer; //0 - open ,  1- close;
	db.fineOne({
		"_id": lineId
	}, function(err, data) {
		if (err || !data) {
			console.log(err);
			res.send(false);
			return;
		}
		var doc = data.toJSON();
		if (answer === "0") {
			res.send("301"); //line will stay open
			return;
		} else if (answer === "1") {
			if (doc.day.indexOfDay < doc.day.maxDays - 1) {
				// line finish for today
				res.send("302"); //line finish for today
				return;
			} else {
				// line ended
				doc.drawMeetings = false;
				res.send("303"); // line ende
			}
			doc.currentMeeting = null;
			doc.active = false;

		} else {
			console.log("no answer");
			res.send("304");
			// no answer
			return;
		}


		db.update({
			"_id": lineId
		}, {
			drawMeetings: doc.drawMeetings,
			currentMeeting: doc.currentMeeting,
			active: doc.active
		}, function(err, data) {
			if (err || !data || data == 0) {
				console.log(err);
				return;
			}
		});

	});

}

exports.postponeLine = function(req, res) {

}


exports.endLine = function(req, res) {

}

exports.getLineInfo = function(req, res) {

}



function addJobs(lineId, jobTimes) {
	if (!lineId || !jobTimes) return;
	for (var i = 0; i < jobTimes.length; i++) {
		// schedule every time a day start event
		cron.scheduleJob(lineId, jobTimes[i], function() {
			db.findOne({
				"_id": lineId
			}, function(err, data) {

				if (err || !data) {
					console.log(err);
					res.send(false);
					return
				}
				var line = data.toJSON();

				handleNextConfirmations(lineId, line.meetings, line.confirmTime, line.druation);

				if (line.currentMeeting == "0") {
					line.currentMeeting = line.meetings.pop();

					db.update({
						"_id": lineId
					}, {
						currentMeeting: line.currentMeeting,
						$pop: {
							mettings: -1
						}
					}, function(err, data) {
						//TODO check if data save
					});
				}

			});
		});
	}
}



function handleNextConfirmations(lineId, meetings, confirmTime, druation) {

	if (!lineId || !meetings || meetings.length == 0 || !confirmTime || !druation) return;

	var now = new Date();
	var tz_correction_minutes = now.getTimezoneOffset() - meetings[0].time.getTimezoneOffset();
	now.setMinutes(now.getMinutes() + tz_correction_minutes);

	var toConfirm = new Date(now.getTime() + confirmTime * 60000);

	for (var i = 0; i < meetings.length; i++) {
		var top = new Date(meetings[i].time.getTime() + druation * 60000);
		var bottom = new Date(meetings[i].time.getTime() - druation * 60000);
		if (toConfirm >= bottom && toConfirm <= top && !meetings[i].confirmed) {


			var message = {
				message: "201",
				title: "LineUp",
				key1: lineId,
				key2: meetings[i].time
			}
			users.notifyUser(meetings[i].userId, message);

			//sechedule check if confirm cron
			var reConfrim = new Date(now.getTime() + confirmTime * 15000);
			scheduleWaitConfirm(lineId, meetings[i].userId, reConfrim, confirmTime);
		}
	}

}

function scheduleWaitConfirm(lineId, userId, time, confirmTime) {
	if (!lineId || !userId || !time || !confirmTime) return;
	var params = {
		lineId: lineId,
		userId: userId
	};
	cron.scheduleJob(params, time, function() {

		db.findOne({
			"_id": params.lineId
		}, "meetings confirmTime druation", function(err, data) {

			if (err || !data) {
				console.log(err);
				res.send(false);
				return
			}
			var doc = data.toJSON();
			var meeting;
			for (var i = 0; i < doc.meetings.length; i++) {
				if (doc.meetings[i].userId == userId) {
					meeting = doc.meetings[i];
					break;
				}
			}
			if (!meeting) return;
			if (!meeting.confirmed && new Date(meeting.time.getTime() - doc.confirmTime * 30000) > new Date()) {
				newTime = new Date(new Date().getTime() + doc.confirmTime * 15000);

				var message = {
					message: "201",
					title: "LineUp",
					key1: lineId,
					key2: meeting.time
				}
				users.notifyUser(params.userId, message);
				scheduleWaitConfirm(params.lineId, params.userId, newTime, doc.timeConfirm);
			}

		});
	});
}