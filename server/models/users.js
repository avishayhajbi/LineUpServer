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
		debugger;
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

exports.notify = function(data) {
	
	var ids = data.ids;
	delete data.ids;

	userdb.find({
			"userId": {
				$in: Array.isArray(ids) ? ids : [ids]
			}
		},
		function(err, docs) {
				
			if (err || docs == 0) {
				console.log("err in save data");
				return;
			}
			if (data.to == "singles") {
				delete data.to;
				for (var i = 0; i < docs.length; i++) {
					var doc = docs[i].toJSON();
					for (var j = 0; j < ids.length; j++) {
						if (ids[j] === doc.userId) {
							sendMessage({
								usersNewTime: data[j].usersNewTime,
								token: doc.pushToken,
								lineId: data.lineId,
								type: data.type,
								title:data.title
							});
						}
					}
				}
			} else  if (data.to == "all") {
				delete data.to;
				data.token = [];
				for (var i = 0; i < docs.length; i++) {
					var doc = docs[i].toJSON();
					for (var j = 0; j < ids.length; j++) {
						if (ids[j] === doc.userId) {
							data.token.push(doc.pushToken);
						}
					}
				}
				sendMessage(data);
			} else  if (data.to == "one") {
				delete data.to;
				var doc = docs[0].toJSON();
				data.token = doc.pushToken;
				sendMessage(data);
			}
		}
	);
}


var sender = new gcm.Sender("AIzaSyCom1Ugg5EdZeBjZSiEpgy5mdzuVklqQok");

function sendMessage(data) {
	var token = data.token;
	delete data.token;
	var message = new gcm.Message();
	
	for (var i in data) {
		var key = i;
		var value = data[i];
		message.addData(key, value);	
	}

	message.addData("soundname", 'beep.wav');
	message.addData("msgcnt", '3');
	message.delay_while_idle = 1;

	console.log("notifyUser.token@ ", token);

	sender.send(message, Array.isArray(token) ? token : [token], 4, function(err, result) {
		if (err) {
			console.log("notifyUser.send.err@ ", err);
			return;
		}
		console.log("notifyUser.send@ ", result);
	});
}