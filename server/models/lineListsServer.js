var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var utils = require('../includes/utils.js');

exports.getlineList = function(req, res) {

  db.getListOfLines(function(err, data) {
    if (err) {
      console.log(err);
      res.send(false);
      return;
    }
    res.send(data);
  });
};

exports.searchlineList = function(req, res) {
  if (req.query.value === undefined || req.query.value === '' || !req.query.value) {
    console.log('no search query return nothing');
    res.send(false);
  } else {
    db.findLineByTitle(req.query.value, function(err, data) {
      res.send(data);
    });
  }
};

exports.getLine = function(req, res) {

  var lineId = req.query.lineId;
  if (!lineId) {
    console.log('getLine@ no search query return nothing');
    res.send(false);
    return;
  }
  db.findOne({
      "_id": lineId},
      "availableDates title active drawMeetings day druation location confirmTime"
    ,
    function(err, data) {

      if (err || !data) {
        console.log("getLine.find.err@ ", err);
        res.send(false);
        return;
      }
      var line = data.toJSON();

      if (!line.drawMeetings) {
        console.log("noRoom");
        res.send("noRoom");
      }
      var lineInfo = {
        startDate: line.availableDates[line.day.indexOfDay].from,
        endDate: line.availableDates[line.day.indexOfDay].to,
        meeting: line.availableDates[line.day.indexOfDay].nextMeeting,
        title: line.title,
        meetingDruation: line.druation,
        confirmTime: line.confirmTime,
        img: line.ImageURI,
        lineId: lineId
      }
      res.send(lineInfo);

    });

};