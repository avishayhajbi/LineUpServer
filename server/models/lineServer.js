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

	line.nextAvailabeMeeting = line.startDate;
	line.drawMeetings = true;
	line.active = false;
	line.currentMeeting = 0;
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
		//TODO improve code for jobs
		//addJobs(data._id.toString(), jobTimes);
		res.send(data._id);
	});

};

//im sorry
exports.nextMeeting = function(req, res) {

	if (!req.query.lineId || !req.query.lineManagerId) {
		console.log('no search query return nothing');
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var lineManagerId = req.query.lineManagerId;
	db.findOne({
		"_id": lineId,
		"lineManagerId": lineManagerId
	}, function(err, data) {

		if (err || !data) {
			console.log(err);
			res.send(false);
			return
		}

		var line = data.toJSON();
		line.passedMeetings.push(line.currentMeeting);

		// handleNextConfirmations(lineId, doc.title, doc.meetings, doc.confirmTime, doc.druation);

		if (!line.meetings[0].time) {
			console.log("no more meetings");

			if (new Date() - line.endDate < line.druation) {
				console.log("no room for meetings closing line");
				line.drawMeetings = false;
				line.active = false;
				res.send("noMoreMeetingsLineClosed");	
			}
			else {
				//ask manager if to close to line or wait to new users
				res.send("noMoreMeetingsAskWhatToDo");
			}

		} else {
			//if there is more meetings
			var next = line.meetings.pop();
			if (next) {
				line.currentMeeting = next;
				//nofity next user to enter line
				var notify = {
						ids: line.currentMeeting.userId,
						lineId: lineId,
						type: "?",
						title: line.title,
						to: "one"
					}
				//users.notify(notify);
				//nofity next next user if exist is meeting getting closer
				if (line.meetings[1].time) {
					var notify = {
							ids: line.meetings[1].userId,
							lineId: lineId,
							type: "?",
							title: line.title,
							to: "one"
						}
						//users.notify(notify);
				}
				//check if meeting took more than 5 minutes if yes notify all
				//and change time
				var offset = next.time.getTime() - new Date().getTime();
				if (offset >= 5 || offset <= 5) {

					var notificationsId = [];
					var usersNewTime = [];
					for (var i = 0; i < line.meetings.length; i++) {
						notificationsId.push(line.meetings[i].userId);
						line.meetings[i].time = new Date(line.meetings[i].time.getTime() - offset * 60000);
						usersNewTime.push(line.meetings[i].time);

					}
					if (line.nextAvailabeMeeting != null) {
						line.nextAvailabeMeeting = new Date(line.nextAvailabeMeeting.getTime() - offset * 60000);
					} else {
						var newTime = new Date(line.nextAvailabeMeeting.getTime() - offset * 60000);
						if (newTime <= line.endDate) {
							line.nextAvailabeMeeting = newTime;
							line.drawMeetings = true;
						}
					}

					if (notificationsId.length > 0) {
						//notify all user after canceld line that line shorted
						var notify = {
							ids: notificationsId,
							lineId: lineId,
							type: "?",
							title: line.title,
							to: "singels",
							usersNewTime: usersNewTime
						}
						users.notify(notify);
					}
				}
				res.send(true);
			}
		}
		db.update({
			"_id": lineId
		}, {
			currentMeeting: line.currentMeeting,
			active: line.active,
			drawMeetings: line.drawMeetings,
			meetings: line.meetings,
			passedMeetings: line.passedMeetings,
			nextAvailabeMeeting:line.nextAvailabeMeeting,

		}, {
			upsert: true
		}, function(err, data) {
			if (err || !data || data === 0) {
				console.log(err);
				return;
			}
		});
	});
}

exports.postponeLine = function(req, res) {

	if (!req.query.lineId || !req.query.lineManagerId || !req.query.time) {
		console.log('no req');
		res.send(false);
		return;
	}

	var lineId = req.query.lineId;
	var lineManagerId = req.query.lineManagerId;
	var delayTime = req.query.time;

	db.findOne({
		"_id": lineId,
		"lineManagerId": lineManagerId
	}, function(err, data) {

		if (err || !data) {
			console.log(err);
			res.send(false);
			return;
		}

		var doc = data.toJSON();
		var meetings = doc.meetings;

		var notificationsId = [];
		var usersNewTime = [];
		for (var i = 0; i < meetings.length; i++) {
			meetings[i].time = new Date(meetings[i].time.getTime() + delayTime * 60000);
			usersNewTime.push(meetings[i].time);
			notificationsId.push(meetings[i].userId);
		}

		//notify all users that line postponeLine
		if (notificationsId.length > 0) {
			var notify = {
				ids: notificationsId,
				lineId: lineId,
				type: "204",
				title: doc.title,
				to: "singels",
				usersNewTime: usersNewTime
			}
			users.notify(notify);
		}

		if (doc.nextAvailabeMeeting !== null) {
			doc.nextAvailabeMeeting = new Date(doc.nextAvailabeMeeting + delayTime * 60000);
			if (doc.nextAvailabeMeeting > doc.endDate) {
				doc.nextAvailabeMeeting = null;
				doc.drawMeetings = false;
			}
		}

		db.update({
			"_id": lineId,
			"lineManagerId": lineManagerId
		}, {
			meetings: meetings,
			drawMeetings: doc.drawMeetings,
			nextAvailabeMeeting: doc.nextAvailabeMeeting
		}, function(err, data) {
			if (err || !data || data === 0) {
				console.log(err);
				res.send(false);
				return;
			}
			res.send(true);

		});

	});

}

exports.endLine = function(req, res) {

	if (!req.query.lineId || !req.query.lineManagerId) {
		console.log('no req');
		res.send(false);
		return;
	}

	var lineId = req.query.lineId;
	var id = req.query.lineManagerId;

	db.findOne({
		"_id": lineId,
		"lineManagerId": id
	}, "meetings drawMeetings active title", function(err, data) {

		if (err || !data) {
			console.log(err);
			res.send(false);
			return;
		}
		var doc = data.toJSON();
		var meetings = doc.meetings;

		var notificationsId = [];
		for (var i = 0; i < meetings.length; i++) {
			notificationsId.push(meetings[i].userId);

		}
		//notify all users that line ended
		if (notificationsId.length > 0) {
			var notify = {
				ids: notificationsId,
				lineId: lineId,
				type: "206",
				title: doc.title,
				to: "all"
			}
			users.notify(notify);
		}

		db.update({
			"_id": lineId
		}, {
			drawMeetings: false,
			active: false
		}, function(err, data) {
			if (err || !data || data === 0) {
				console.log(err);
				res.send(false);
				return;
			}
			res.send(true);
		});
	});

}

exports.getLineInfo = function(req, res) {

	if (!req.query.lineId || !req.query.lineManagerId) {
		console.log('noReq');
		res.send(false);
		return;
	}

	var lineId = req.query.lineId;
	var lineManagerId = req.query.lineManagerId;

	db.findOne({
		"_id": lineId,
		"lineManagerId": lineManagerId
	}, function(err, data) {

		if (err || !data) {
			console.log(err);
			res.send(false);
			return;
		}
		var line = data.toJSON();
		line.lineId = line._id;
		delete line._id;
		res.send(line);
	});
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

				// handleNextConfirmations(lineId, line.title, line.meetings, line.confirmTime, line.druation);

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

function handleNextConfirmations(lineId, title, meetings, confirmTime, druation) {

	if (!lineId || !meetings || meetings.length == 0 || !confirmTime || !druation) return;

	var now = new Date();
	var tz_correction_minutes = now.getTimezoneOffset() - meetings[0].time.getTimezoneOffset();
	now.setMinutes(now.getMinutes() + tz_correction_minutes);

	var toConfirm = new Date(now.getTime() + confirmTime * 60000);

	for (var i = 0; i < meetings.length; i++) {
		var top = new Date(meetings[i].time.getTime() + druation * 60000);
		var bottom = new Date(meetings[i].time.getTime() - druation * 60000);
		if (toConfirm >= bottom && toConfirm <= top && !meetings[i].confirmed) {

			users.notifyAll("201", [doc.meetings[i]], 0, doc.title, lineId);

			//sechedule check if confirm cron
			var reConfrim = new Date(now.getTime() + confirmTime * 15000);
			scheduleWaitConfirm(lineId, title, meetings[i].userId, reConfrim, confirmTime);
		}
	}

}

function scheduleWaitConfirm(lineId, title, userId, time, confirmTime) {
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

				users.notifyAll("201", [doc.meetings[i]], 0, title, lineId);

				scheduleWaitConfirm(params.lineId, params.userId, newTime, doc.timeConfirm);
			}

		});
	});
}