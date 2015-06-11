var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var utils = require('../includes/utils.js');

exports.getRandomlineList = function(req, res) {

  db.find({}, "title location", function(err, data) {
    if (err) {
      console.log(err);
      res.send(false);
      return;
    }
    res.send(data);
  });
};

exports.searchlineList = function(req, res) {

  if (!req.query.value) {
    console.log('no search query return nothing');
    res.send(false);
    return;
  }

  var re = new RegExp(req.query.value, "i");

  db.find({
    title: re
  }, "title location", function(err, data) {
    res.send(data);
  });

};

exports.getLine = function(req, res) {

	if (!req.query.lineId || !req.query.userId) {
		console.log('joinLine@  no search query return nothing');
		res.send("noSuchLine");
		return;
	}


  var lineId = req.query.lineId;
  var userId = req.query.userId;
  
  db.findOne({
      "_id": lineId
    },
    function(err, data) {

      if (err || !data) {
        console.log("getLine.find.err@ ", err);
        res.send(false);
        return;
      }
      var line = data.toJSON();

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
      var lineInfo = {
        startDate: line.startDate,
        endDate: line.endDate,
        time: line.nextAvailabeMeeting,
        title: line.title,
        druation: line.druation,
        active: line.active,
        location: line.location,
        confirmTime: line.confirmTime,
        img: line.ImageURI,
        lineId: lineId
      }
      res.send(lineInfo);

    });

};