var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var userdb = require('./SchemeModel.js').userdb;
var utils = require('../includes/utils.js');
var users = require('./users.js');
var cron = require('node-schedule');

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
	line.druationAvarage = line.druation;
	line.currentMeeting = {};
	line.meetings = [];
	line.canceldMeetings = [];
	line.passedMeetings = [];
	line.meetingsCounter = 0;

	if (!line.lineManagerId) {
		res.send(false);
		console.log("no user id in this line please signed in");
	}
	db.create(line, function(err, data) {

		console.log("insert new");
		if (err || !data) {
			console.log(err);
			res.send(false);
			return;
		}
		var line = data.toJSON();
		var lineId = line._id.toJSON();
		var title = line.title;


		var notify1 = {
			ids: line.lineManagerId,
			lineId: lineId,
			type: "lineWillBegin",
			title: title,
			time: (line.druation + line.confirmTime) + " minutes",
			to: "one"
		}

		var notify2 = {
			ids: line.lineManagerId,
			lineId: lineId,
			type: "lineWillBeginIn5",
			title: title,
			to: "one"
		}

		var notify3 = {
			ids: line.lineManagerId,
			lineId: lineId,
			type: "lineStart",
			title: title,
			to: "one"
		}
		var now = new Date();
		var timeToNotify = new Date(line.startDate.getTime() - (line.druation + line.confirmTime) * 60000);
		var timeToNotify2 = new Date(line.startDate.getTime() - 5 * 60000);
		var timeToNotify3 = new Date(line.startDate.getTime());

		//notify manager before line begings
		if (now <= timeToNotify) {
			scheduleJob(notify1, timeToNotify);
		}
		//notify manager 5 minutes before line begings
		if (now <= timeToNotify2) {
			scheduleJob(notify2, timeToNotify2);
		}
		//open line
		if (now <= timeToNotify3) {
			scheduleJob(notify3, timeToNotify3);
		}


		userdb.update({
			"_id": line.lineManagerId
		}, {
			$push: {
				activeLines: {
					lineId: lineId,
					title: title
				}
			}
		}, function(err, data) {

			if (err || !data || data <= 0) {
				res.send(false);
				console.log("failed to save");
				return;
			}
			res.send(lineId);
		})
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
		var title = line.title;
		line.passedMeetings.push(line.currentMeeting);

		var notify = {
			ids: line.currentMeeting.userId,
			lineId: lineId,
			type: "endMeeting",
			title: title,
			to: "one"
		}
		users.notify(notify);


		if (!line.meetings[0]) {
			console.log("no more meetings");

			if (new Date() - line.endDate < line.druation) {
				console.log("no room for meetings closing line");
				line.drawMeetings = false;
				line.active = false;
				res.send("noMoreMeetingsLineClosed");
			} else {
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
					type: "enterLine",
					title: title,
					to: "one"
				}
				users.notify(notify);
				//nofity next next user if exist is meeting getting closer
				if (line.meetings[1]) {
					var notify = {
						ids: line.meetings[1].userId,
						lineId: lineId,
						type: "nextInLine",
						title: title,
						to: "one"
					}
					users.notify(notify);
				}
				//check if meeting took more than 5 minutes if yes notify all
				//and change time
				var offset = next.time.getTime() - new Date().getTime();

				if (offset >= 5 || offset <= 5) {

					line.druationAvarage = (line.druation - offset) * (line.meetingsCounter * line.druationAvarage);

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
							type: "newTime",
							title: title,
							to: "singels",
							usersNewTime: usersNewTime
						}
						users.notify(notify);
						// check if to send confirmation request
						sendConfirmation(lineId);
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
			nextAvailabeMeeting: line.nextAvailabeMeeting,
			druationAvarage: line.druationAvarage

		}, {
			upsert: true
		}, function(err, data) {

			if (err || !data || data === 0) {
				console.log(err);
				return;
			}
		});
		if (!line.drawMeetings) {
			moveLineToPassed(lineId, title, line.lineManagerId);
		}
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

		var line = data.toJSON();
		var title = line.title;
		var meetings = line.meetings;

		var notificationsId = [];
		var usersNewTime = [];

		// interat on meetings and create new time for them
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
				type: "postponeLine",
				title: title,
				to: "singels",
				usersNewTime: usersNewTime
			}
			users.notify(notify);
			//check if to send conformation 
			sendConfirmation(lineId);
		}

		if (line.nextAvailabeMeeting !== null) {
			line.nextAvailabeMeeting = new Date(line.nextAvailabeMeeting + delayTime * 60000);
			if (line.nextAvailabeMeeting > line.endDate) {
				line.nextAvailabeMeeting = null;
				line.drawMeetings = false;
			}
		}

		if (!line.drawMeetings) {
			moveLineToPassed(lineId, title, lineManagerId);
		}

		db.update({
			"_id": lineId,
			"lineManagerId": lineManagerId
		}, {
			meetings: meetings,
			drawMeetings: line.drawMeetings,
			nextAvailabeMeeting: line.nextAvailabeMeeting
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
		var title = doc.title;
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
				type: "endLine",
				title: title,
				to: "all"
			}
			users.notify(notify);
		}

		moveLineToPassed(lineId, title, id);

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



function scheduleJob(notify, time) {

	cron.scheduleJob(notify, time, function() {

		if (notify.type === "lineStart") {
			startLine(notify);
		} else {
			sendConfirmation(notify.lineId);
		}

	});
}

function startLine(notify) {

	db.findOne({
		"_id": notify.lineId
	}, function(err, data) {
		if (err || !data) {
			console.log("cant send confirmation");
			return;
		}
		var line = data.toJSON();
		if (line.meetings[0]) {
			line.currentMeeting = line.meetings.pop();
			notify.username = line.currentMeeting.userName;
		} else {
			notify.type = "lineStartNoUsers";
		}
		line.active = true;
		db.update({
			"_id": notify.lineId
		}, {
			currentMeeting: line.currentMeeting,
			active: line.active,
			meetings: meetings
		}, function(err, data) {

			if (err || !data) {
				console.log("wwee");
				return;
			}
			users.notify(notify);
		});


	});


}

function sendConfirmation(lineId) {

	db.findOne({
		"_id": lineId
	}, function(err, data) {
		debugger;
		if (err || !data) {
			console.log("cant send confirmation");
			return;
		}
		var line = data.toJSON();
		var title = line.title;
		var meetings = line.meetings;
		var notificationsId = [];
		var notificationsId2 = [];
		var usersNewTime = [];
		//intarte all users and send confirmation to them


		for (var i = 0; i < meetings.length; i++) {
			var timeToConfirm = new Date(meetings[i].time.getTime() - line.confirmTime * 60000);
			var timeFromConfirm = new Date(meetings[i].time.getTime() - line.confirmTime * 180000);
			var now = new Date();
			if (!meetings[i].confirmed && now > timeToConfirm) {
				notificationsId2.push(meetings[i].userId);
				line.canceldMeetings.push(meetings[i]);
				line.meetings.splice(i, 1);
			} else if (!meetings[i].confirmed && timeFromConfirm <= now <= timeToConfirm) {
				notificationsId.push(meetings[i].userId);
				usersNewTime.push(meetings[i].time);
			}

		}
		if (notificationsId.length > 0) {
			var notify = {
				ids: notificationsId,
				lineId: lineId,
				type: "askConfirmed",
				usersNewTime: usersNewTime,
				title: title,
				to: "singels"
			}

			users.notify(notify);
		}


		if (notificationsId2.length > 0) {

			var notify2 = {
				ids: notificationsId2,
				lineId: lineId,
				type: "noConfirmation",
				title: title,
				to: "all"
			}

			db.update({
				"_id": lineId
			}, {
				canceldMeetings: line.canceldMeetings,
				meetings: line.meetings
			}, function(err, data) {
				if (err) {
					console.log("meetingsToCancel.err@ ", err);
					return;
				}
				if (data > 0 || data.ok > 0) {
					users.notify(notify2);
					return;
				}
			});
		}

	});
}

function moveLineToPassed(lineId, title, userId) {

	userdb.update({
		"_id": userId
	}, {
		$pull: {
			activeLines: {
				lineId: lineId
			}
		},
		$push: {
			passedLines: {
				lineId: lineId,
				title: title
			}
		}
	}, function(err, data) {
		//TODO wirte this
	});
}