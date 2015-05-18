var userdb = require('./SchemeModel.js').userdb;
var gcm = require('node-gcm');

exports.userConnect = function(req, res) {

	var userId = req.query.userId;

	userdb.findOneAndUpdate({
		userId: userId
	}, {
		$setOnInsert: {
			userId: userId
		}
	}, {
		upsert: true
	}, function(err, data) {
		if (err) {
			console.log("userConnect.findOneAndUpdate.err@ " + err);
			res.send(false);
			return;
		}

		if (data.isNew) {
			res.send("newUser");
			return;
		} else {
			res.send("exist");
			return;
		}

	});

}

exports.connectToFaceBook = function(req, res) {

	var userId = req.query.userId;
	var set = {
		fbId: req.query.fbId,
		email: req.query.email
	};
	if (req.query.name) {
		set.name = req.query.name
	}
	userdb.findOneAndUpdate({
		userId: userId
	}, {
		$set: set
	}, {
		upsert: true
	}, function(err, data) {

		if (err) {
			console.log("connectToFaceBook.findOneAndUpdate.err@ " + err);
			res.send(false);
			return;
		}
		if (data.isNew) {
			res.send("signed");
			return;
		} else {
			res.send("exist");
			return;
		}

	});

}

exports.pushToken = function(req, res) {
	var userId = req.query.userId;
	var pushToken = req.query.pushToken;

	userdb.findOneAndUpdate({
		userId: userId
	}, {
		$set: {
			pushToken: pushToken
		}
	}, {
		upsert: true
	}, function(err, data) {

		if (err) {
			console.log("pushToken.findOneAndUpdate.err@ " + err);
			res.send(false);
			return;
		}
		if (data.isNew) {
			res.send("signed");
			return;
		} else {
			res.send("exist");
			return;
		}

	});

}


exports.changeUserName = function(req, res) {
	var userId = req.query.userId;
	var name = req.query.name;

	userdb.findOneAndUpdate({
		userId: userId
	}, {
		$set: {
			name: name
		}
	}, {
		upsert: true
	}, function(err, data) {
		if (err) {
			console.log("pushToken.findOneAndUpdate.err@ " + err);
			res.send(false);
			return;
		}
		if (data.isNew) {
			res.send("signed");
			return;
		} else {
			res.send("exist");
			return;
		}

	});

}


exports.notifyUser = function(userId, message) {
	userdb.getPushToken(userId, function(err, userToken) {
		if (err) {
			console.log("forwardMeetings.userdb.find.err@ ", err);
			return;
		}
		if (userToken) {
			var pushToken = userToken.toJSON();
			sendNotification(message, pushToken);
			return;
		}

	});

}


var sender = new gcm.Sender("AIzaSyCom1Ugg5EdZeBjZSiEpgy5mdzuVklqQok");

		var message = {
			message: "nir" + " canceled is reservasion at:" + "lineUP",
			title: "LineUp",
			key1: "23453456",
			key2: new Date()
		};


sendNotification(message, "APA91bFEfiIyY3dH0CqxuL6aWlsUEp3tATTsvqrHTjzHDN9zQ8bFXEk-yhaoSb8VnSmWmB2mtSXQMeIYI3Ibdi2iFqmvEpblnqWBlmgBg0OHOH_7KjJJVF8N2Cl8wSTDYnkS2PPrLBNKq3MQhPwLXj5yzj2jsIie5A")

function sendNotification(data, token) {

	var message = new gcm.Message();
	for (var i in data) {
		message.addData(i, data[i]);
		console.log(data[i]);
	}
	message.addData("soundname", 'beep.wav');
	message.addData("msgcnt", '3');
	message.delay_while_idle = 1;

	console.log("notifyUser.token@ ", token);
	// var registrationIds = [];
	// registrationIds.push(token);
	sender.send(message, token, 4, function(err, result) {
		if (err) {
			console.log("notifyUser.send.err@ ", err);
			return;
		}
		console.log("notifyUser.send@ ", result);
	});
}