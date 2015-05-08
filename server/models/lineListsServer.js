var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var utils = require('../includes/utils.js');

exports.getlineList = function(req, res) {

  db.getListOfLines(function(err, data) {
    if (err) {
      console.log(err);
      res.send("null");
      return;
    }
    res.send(data);
  });
};

exports.searchlineList = function(req, res) {
  if (req.query.value === undefined || req.query.value === '' || !req.query.value) {
    console.log('no search query return nothing');
    res.send('null');
  } else {
    db.findLineByTitle(req.query.value, function(err, data) {
      res.send(data);
    });
  }
};

exports.getLine = function(req, res) {

  var lineId = req.query.lineId;
  var userId = req.query.userId;
  if (lineId === undefined || userId === undefined) {
    console.log('getLine@ no search query return nothing');
    res.send(false);
    return;
  }
  db.find({
      "_id": lineId
    },"ImageURI availableDates confirmTime druation location meetingsCounter title" , 
    function(err, data) {

      if (err) {
        console.log("getLine.find.err@ ",err);
        res.send(false);
        return;
      }
      var line = data[0]._doc;
      var availableDates = line.availableDates;
      var position , nextMeeting , i;
      delete line.availableDates;
      delete(line._id);

      for (i = 0; i < availableDates.length; i++) {
        if (availableDates[i].nextMeeting !== null) {
          nextMeeting = availableDates[i].nextMeeting;
          position = availableDates[i].position;
          break;
        }
      }
      if (!nextMeeting || nextMeeting === '') {
        console.log("noRoom");
        res.send("noRoom");
        return;
      }
      line.time = nextMeeting;
      line.position = position;
      
      res.send(line);
      availableDates[i].nextMeeting = new Date(availableDates[i].nextMeeting.getTime() + line.druation * 60000);
      availableDates[i].position++;
      if (availableDates[i].nextMeeting > availableDates[i].to) {
        availableDates[i].nextMeeting = null;
      }

      var wait = {
        time: line.time,
        userId: userId
      };

      db.moveToAproval(lineId, wait, availableDates, function() {
        if (err) {
          console.log(err);
          return;
        }
      });

    }
  );

};