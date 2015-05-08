var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var utils = require('../includes/utils.js');

exports.createLine = function(req, res) {

  if (req.query.line === undefined || req.query.line === '' || !req.query.line) {
    console.log('no search query return nothing');
    res.send(false);
    return;
  }
  var line = JSON.parse(req.query.line);
  for (var i = 0; i < line.availableDates.length; i++) {
    line.availableDates[i].from = new Date(line.availableDates[i].from);
    line.availableDates[i].to = new Date(line.availableDates[i].to);
    line.availableDates[i].nextMeeting = line.availableDates[i].from;
    line.availableDates[i].currentPosition = 0;
  }

  line.availableDates = utils.sort(line.availableDates, "from");
  line.waitingAproval = [];
  line.meetings = [];
  line.meetingsCounter = 0;

  db.create(line, function(err, data) {
    console.log("insert new");
    if (err) {
      console.log(err);
      res.send(false);
      return
    }
    console.log("insert new");
    res.send(data._id);

  });

};