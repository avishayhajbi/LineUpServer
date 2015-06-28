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
	line.nextAvailabeMeeting = new Date(line.startDate);
	line.drawMeetings = true;
	line.active = false;
	line.druationAvarage = line.druation;
	line.currentMeeting = {};
	line.meetings = [];
	line.ended = false;
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
			message: "line: " + title + " will begin in" + (line.druation + line.confirmTime) + " minutes",
			type: "line",
			to: "one"
		}

		var notify2 = {
			ids: line.lineManagerId,
			lineId: lineId,
			type: "line",
			message: "line: " + title + " will begin in 5 minutes",
			to: "one"
		}

		var notify3 = {
			ids: line.lineManagerId,
			lineId: lineId,
			type: "lineStart",
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

			if (err) {
				res.send(false);
				console.log("failed to save");
				return;
			}
			if (data > 0 || data.ok > 0) {
				res.send(lineId);
				return;
			}

		})
	});

};

//im sorry
exports.nextMeeting = function(req, res) {

	if (!req.query.lineId || !req.query.userId) {
		console.log('no search query return nothing');
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var lineManagerId = req.query.userId;
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

		if (!line.active) {
			res.send("lineDidntStart");
			return;
		}

		if (line.currentMeeting && line.currentMeeting.time) {
			line.currentMeeting.meetingTime = parseInt((new Date().getTime() - line.currentMeeting.time.getTime()) / 60000);
			if (line.currentMeeting.meetingTime < 0) {
				line.currentMeeting.meetingTime = -line.currentMeeting.meetingTime;
			}
		}
		line.passedMeetings.push(line.currentMeeting);

		//notify user line ended
		var notify = {
			ids: line.currentMeeting.userId,
			lineId: lineId,
			message: "thanks u form: " + title,
			type: "remove",
			to: "one"
		}
		users.notify(notify);

		var send = true;
		if (!line.meetings[0]) {
			console.log("no more meetings");

			if (line.endDate - new Date() < line.druation) {
				console.log("no room for meetings closing line");
				line.drawMeetings = false;
				line.ended = false;
				line.active = false;
				send = "noMoreMeetingsLineClosed";
			} else {
				//ask manager if to close to line or wait to new users
				send = "noMoreMeetingsAskWhatToDo";
			}

		} else {

			//if there is more meetings

			var next = line.meetings.shift();
			if (next) {
				line.currentMeeting = next;
				//nofity next user to enter line
				var notify = {
					ids: line.currentMeeting.userId,
					lineId: lineId,
					type: "meeting",
					message: "please enter to line: " + title,
					to: "one"
				}
				users.notify(notify);
				//nofity next next user if exist is meeting getting closer
				if (line.meetings[0]) {
					var notify = {
						ids: line.meetings[0].userId,
						lineId: lineId,
						type: "meeting",
						message: "your are next in line: " + title,
						to: "one"
					}
					users.notify(notify);
				}
				//check if meeting took more than 5 minutes if yes notify all
				//and change time

				var offset = (next.time.getTime() - new Date().getTime()) / 60000;

				if (offset >= 5 || offset <= 5) {

					line.druationAvarage = ((line.druation - offset) + ((line.meetingsCounter - 1) * line.druationAvarage)) / line.meetingsCounter;

					var notificationsId = [];
					var message = [];
					for (var i = 0; i < line.meetings.length; i++) {
						notificationsId.push(line.meetings[i].userId);
						line.meetings[i].time = new Date(line.meetings[i].time.getTime() - offset * 60000);
						var newTimeString = line.meetings[i].time.getHours() + ":" + line.meetings[i].time.getMinutes() + "  " + line.meetings[i].time.getDate() + '/' + line.meetings[i].time.getMonth() + '/' + line.meetings[i].time.getFullYear();
						message.push("Line: " + title + " updated time:" + newTimeString);
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
						//notify all user line was shorter or longer
						var notify = {
							ids: notificationsId,
							lineId: lineId,
							type: "meeting",
							to: "singels",
							message: message
						}
						users.notify(notify);
					}

				}

			}
		}
		db.update({
			"_id": lineId
		}, {
			currentMeeting: line.currentMeeting,
			active: line.active,
			ended: line.ended,
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
				res.send(false);
				return;
			}
			res.send(send);

			if (line.ended) {
				moveLineToPassed(lineId, title, line.lineManagerId);
			} else {
				sendConfirmation(lineId);
			}
		});

	});
}

exports.postponeLine = function(req, res) {

	if (!req.query.lineId || !req.query.userId || !req.query.time) {
		console.log('no req');
		res.send(false);
		return;
	}

	var lineId = req.query.lineId;
	var lineManagerId = req.query.userId;
	var delayTime = parseInt(req.query.time);

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
		var message = [];

		// interat on meetings and create new time for them
		for (var i = 0; i < meetings.length; i++) {
			meetings[i].time = new Date(meetings[i].time.getTime() + (delayTime * 60000));
			var newTimeString = line.meetings[i].time.getHours() + ":" + line.meetings[i].time.getMinutes() + "  " + line.meetings[i].time.getDate() + '/' + line.meetings[i].time.getMonth() + '/' + line.meetings[i].time.getFullYear();

			message.push("Line: " + title + " postpone new time:" + newTimeString);
			notificationsId.push(meetings[i].userId);
		}

		//notify all users that line postponeLine
		if (notificationsId.length > 0) {
			var notify = {
				ids: notificationsId,
				lineId: lineId,
				type: "meeting",
				title: title,
				to: "singels",
				message: message
			}
			users.notify(notify);

		}

		if (line.nextAvailabeMeeting !== null) {
			line.nextAvailabeMeeting = new Date(line.nextAvailabeMeeting.getTime() + (delayTime * 60000));
			if (line.nextAvailabeMeeting > line.endDate) {
				line.nextAvailabeMeeting = null;
				line.drawMeetings = false;
			}
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

	if (!req.query.lineId || !req.query.userId) {
		console.log('no req');
		res.send(false);
		return;
	}

	var lineId = req.query.lineId;
	var id = req.query.userId;

	db.findOne({
		"_id": lineId,
		"lineManagerId": id
	}, function(err, data) {

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
				message: "Line: " + title + " canceld",
				lineId: lineId,
				type: "remove",
				to: "all"
			}
			users.notify(notify);
		}

		moveLineToPassed(lineId, title, id);

		db.update({
			"_id": lineId
		}, {
			drawMeetings: false,
			active: false,
			ended: true
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

	if (!req.query.lineId || !req.query.userId) {
		console.log('noReq');
		res.send(false);
		return;
	}

	var lineId = req.query.lineId;
	var lineManagerId = req.query.userId;

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
			users.notify(notify);
		}
		sendConfirmation(notify.lineId);

	});
}

function startLine(notify) {

	db.findOne({
		"_id": notify.lineId
	}, function(err, data) {
		if (err || !data) {
			console.log("cant find line");
			return;
		}
		var line = data.toJSON();
		if (line.ended) {
			return;
		}
		if (line.meetings[0]) {
			line.currentMeeting = line.meetings.shift();
			notify.message = "line: " + line.title + " started next user:" + line.currentMeeting.userName;

			var notify3 = {
				ids: line.currentMeeting.userId,
				message: "please enter line " + line.title,
				lineId: line.lineId,
				type: "meeting",
				to: "one"
			}

			users.notify(notify3);

			//notifay all line startred
			var notificationsId = [];
			for (var i = 0; i < line.meetings.length; i++) {
				notificationsId.push(line.meetings[i].userId);
			}
			if (notificationsId.length > 0) {
				var notify2 = {
					ids: notificationsId,
					message: "line " + line.title + "started",
					lineId: line.lineId,
					type: "meeting",
					to: "all"

				}
				users.notify(notify2);
			}

		} else {
			notify.message = "line: " + line.title + " started but no one signed in :(";
		}
		line.active = true;

		db.update({
			"_id": notify.lineId
		}, {
			currentMeeting: line.currentMeeting,
			active: line.active,
			meetings: line.meetings
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

		if (err || !data) {
			console.log("cant send confirmation");
			return;
		}
		var line = data.toJSON();
		if (line.ended) {
			return;
		}
		var title = line.title;
		var meetings = line.meetings;
		var notificationsId = [];
		var message = [];
		var notificationsId2 = [];
		var usersNewTime = [];
		var skipNext = false;
		var makeNewTimes = 0;
		//intarte all users and send confirmation to them
		console.log("go over all users in line");
		for (var i = 0; i < meetings.length; i++) {

			var timeToConfirm = new Date(meetings[i].time.getTime() - line.confirmTime * 60000);
			var timeFromConfirm = new Date(meetings[i].time.getTime() - line.confirmTime * 180000);
			var now = new Date();
			if (!meetings[i].confirmed && now > timeToConfirm && !skipNext) {
				console.log("user:" + meetings[i].userName + " meeting canceld becuse not confirmed");
				skipNext = true;
				line.meetingsCounter--;
				line.nextAvailabeMeeting = new Date(line.nextAvailabeMeeting.getTime() - line.druation * 60000);
				makeNewTimes++;
				notificationsId2.push(meetings[i].userId);
				line.canceldMeetings.push(meetings[i]);
				line.meetings.splice(i, 1);
				i--;
			} else if (!meetings[i].confirmed && timeFromConfirm <= now <= timeToConfirm) {
				console.log("user:" + meetings[i].userName + " please confirm time:" + meetings[i].time);
				if (skipNext) skipNext = false;
				if (makeNewTimes > 0) {
					meetings[i].time = meetings[i].time = new Date(meetings[i].time.getTime() - (line.druation * 60000 * makeNewTimes));
				}
				notificationsId.push(meetings[i].userId);
				message.push("plesae confirm your meeting in line:" + title + " at " + meetings[i].time);

			} else if (makeNewTimes > 0 && meetings[i].confirmed) {
				console.log("user:" + meetings[i].userName + " got new time:" + meetings[i].time);
				if (skipNext) skipNext = false;
				meetings[i].time = meetings[i].time = new Date(meetings[i].time.getTime() - (line.druation * 60000 * makeNewTimes));
				notificationsId.push(meetings[i].userId);
				message.push("line " + title + " time updated to: " + meetings[i].time);
			}

		}
		//notify user to confirm line
		if (notificationsId.length > 0) {
			var notify = {
				ids: notificationsId,
				lineId: lineId,
				type: "meeting",
				message: message,
				to: "singels"
			}

			users.notify(notify);
		}

		//notify user line was canceld duo to no confirmation
		if (notificationsId2.length > 0) {

			var notify2 = {
				ids: notificationsId2,
				lineId: lineId,
				message: " your meeting was canceld duo to no comfirmation",
				type: "remove",
				to: "all"
			}

			db.update({
				"_id": lineId
			}, {
				canceldMeetings: line.canceldMeetings,
				meetings: meetings,
				nextAvailabeMeeting: line.nextAvailabeMeeting,
				meetingsCounter: line.meetingsCounter
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