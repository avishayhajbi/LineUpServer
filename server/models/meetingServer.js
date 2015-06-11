var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var db = require('./SchemeModel.js').db;
var users = require('./users.js');
var userdb = require('./SchemeModel.js').userdb;
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
		var lineManagerId = line.lineManagerId;
		var title = line.title;

		if (!line.drawMeetings || line.nextAvailabeMeeting == null) {
			console.log("noRoom");
			res.send("noRoom");
			return;
		}
		for (var i = 0; i < line.meetings.length; i++) {
			if (line.meetings[i].userId == userId) {
				console.log("userSignedIn");
				res.send("userSignedIn");
				return;
			}
		}
		meeting.confirmed = false;
		meeting.time = line.nextAvailabeMeeting;
		line.meetingsCounter++;

		line.nextAvailabeMeeting = new Date(line.nextAvailabeMeeting.getTime() + line.druation * 60000);

		//if nextmeeting is after line finishes
		if (line.nextAvailabeMeeting > line.endDate) {
			line.nextAvailabeMeeting = null;
			line.drawMeetings = false;
			line.meetingsCounter--;
		}


		var details = {
			position: line.meetingsCounter.toString(),
			time: meeting.time,
			confirmed: meeting.confirmed,
			active: line.active,
			druation: line.druation,
			confirmTime: line.confirmTime,
			lineId: lineId,
			title: title,
			location: line.location,
			startDate: line.startDate,
			endDate: line.endDate
		}


		db.update({
				"_id": lineId
			}, {
				$set: {
					nextAvailabeMeeting: line.nextAvailabeMeeting,
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
				if (data.ok > 0 || data > 0) {
					meeting.title = title;
					meeting.lineId = lineId;
					delete meeting.userId;

					userdb.update({
						"_id": userId
					}, {
						$push: {
							activeMeetings: meeting
						}
					}, function(err, data) {

						if (err || !data) {
							console.log("joinLine.findOne.err@ ", err);
							res.send(false);
							return;
						}
						if (data.ok > 0 || data > 0) {
							//send to manager notification aboutt new user
							var notifiy = {
									notificationsId: lineManagerId,
									lineId: lineId,
									type: "managerNewUser",
									to: "one",
									title: title,
									userName: userName
								}
								//users.notify(notifiy);
							res.send(details);
						} else {
							res.send(false);
						}
					});

				}
			});
	});

};

exports.getMeetingInfo = function(req, res) {

	if (!req.query.lineId || !req.query.userId) {
		console.log("no req");
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
				var pos = parseInt(i) + 1;
				var details = {
					position: pos.toString(),
					time: meetings[i].time,
					confirmed: meetings[i].confirmed,
					active: line.active,
					druation: line.druation,
					confirmTime: line.confirmTime,
					lineId: line._id,
					title: line.title,
					location: line.location,
					startDate: line.startDate,
					endDate: line.endDate
				}
				res.send(details);
				return;
			}
		}
		res.send(false);
	});
}

exports.confirmMeeting = function(req, res) {

	if (!req.query.lineId || !req.query.userId || !req.query.userName) {
		console.log("no request");
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var userId = req.query.userId;
	var userName = req.query.userName;


	db.findOneAndUpdate({
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
			var line = data.toJSON();
			//notify manager meeting confirmed
			var notify = {
				ids: line.lineManagerId,
				lineId: lineId,
				type: "?",
				title: line.title,
				to: "one",
				userName: cancel.userName
			}

			users.notify(notify);
			res.send(true);

		});



};

exports.cancelMeeting = function(req, res) {

	if (!req.query.lineId || !req.query.userId || !req.query.time || !req.query.userName) {
		console.log('cancelMeeting@ no search query return nothing');
		res.send(false);
		return;
	}
	var lineId = req.query.lineId;
	var userId = req.query.userId;
	var time = new Date(req.query.time);
	var userName = req.query.userName;

	var cancel = {
		userId: userId,
		time: time,
		userName: userName
	};

	db.findOne({
		"_id": lineId
	}, function(err, data) {
		
		if (err || !data) {
			console.log("cancelMeeting.find.err@ ", err);
			res.send(false);
			return;
		}
		var line = data.toJSON();
		line.meetingsCounter--;
		var notificationsId = [];
		var usersNewTime = [];
		for (var i = 0; i < line.meetings.length; i++) {
			if (line.meetings[i].time > cancel.time) {
				notificationsId.push(line.meetings[i].userId);
				line.meetings[i].time = new Date(line.meetings[i].time.getTime() - line.druation * 60000);
				usersNewTime.push(line.meetings[i].time);
			}
		}
		if (line.nextAvailabeMeeting != null) {
			line.nextAvailabeMeeting = new Date(line.nextAvailabeMeeting.getTime() - line.druation * 60000);
			if (line.nextAvailabeMeeting > line.endDate) {
				line.nextAvailabeMeeting = null;
				line.drawMeetings = false;
			}
		} else {
			var newTime = new Date(line.nextAvailabeMeeting.getTime() - line.druation * 60000);
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
			//notify manager user canceled
			var notify2 = {
				ids: line.lineManagerId,
				lineId: lineId,
				type: "?",
				title: line.title,
				to: "one",
				userName: cancel.userName
			}
			users.notify(notify2);
		}


		db.update({
			"_id": lineId
		}, {
			meetingsCounter: line.meetingsCounter,
			nextAvailabeMeeting: line.nextAvailabeMeeting,
			drawMeetings: line.drawMeetings,
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
			if (data > 0 || data.ok > 0) {
				moveMeetingToPassed(lineId, userId, line.title);
				res.send(true);
				return;
			}
			res.send(false);

		});

	});

};



function moveMeetingToPassed(lineId, userId, title) {

	userdb.update({
		"_id": userId
	}, {
		$pull: {
			activeMeetings: {
				lineId: lineId
			}
		},
		$push: {
			passedMeetings: {
				lineId: lineId,
				title: title
			}
		}
	}, function(err, data) {
		//TODO wirte this
	});
}