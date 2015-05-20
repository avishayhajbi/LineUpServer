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

exports.notifyAll= function( type , meetings , delayTime ,lineTitle ,lineId ) {

		var ids = [];
		var list = [];

		for (var i = 0; i < meetings.length; i++) {
			ids.push(meetings[i].userId);
			meetings[i].time = new Date(meetings[i].time.getTime() + delayTime * 60000);
			list.push({
				message: type,
				key1: lineTitle,
				key2: lineId,
				key3: meetings[i].userId,
				key4: meetings[i].userName,
				key5: meetings[i].time
			});
		}
		sendNotifications(ids, list);
		return meetings;

}


exports.sendNotifications = function (ids , list) {
	;
	if (!ids || !list) {
		console.log("no ids in sendNotifications");
		return;
	}

	userdb.find({"userId": { $in  : ids} }, function(err , docs){
			debugger;		
			if(err || !docs) {
				console.log("users not in DB to send notification");
			
			}
			for (var i = 0; i < docs.length; i++) {
				var doc = docs[i].toJSON();
				for (var j = 0; j < list.length; j++) {
					if(list[j].key3 === doc.userId)	 {
						sendNotification(list[j] ,doc.token);
						}
				}
			}
			
	});	
}


var sender = new gcm.Sender("AIzaSyCom1Ugg5EdZeBjZSiEpgy5mdzuVklqQok");

function sendNotification(data, token) {

	var message = new gcm.Message();
	for (var i in data) {
		message.addData(i, data[i]);
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