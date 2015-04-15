var mongoose = require('mongoose');
var db = require('./SchemeModel.js');


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
  console.log("lineID:" + req.query.lineId);
  if (req.query.lineId === undefined || req.query.userId === undefined) {
    console.log('no search query return nothing');
    res.send(false);
    return;
  }

  db.find({
    "_id": req.query.lineId
  }, {
      availableDates:{$slice:1}
  }, function(err, data) {
      var line = data[0]._doc;
      db.update( { "_id":  req.query.lineId }, { $pop: { availableDates: -1 } } , function(err ,dat){});
      db.update( { "_id":  req.query.lineId }, { $push: { waitingAproval: line.availableDates[0] } } , function(err ,dat){});
      delete line.lineManagerId;
      delete line.waitingAproval;
      delete line.__v;
      
    res.send(line);
  });

};

// function getNextMeeting(dates) {
//   debugger;
//   console.log(dates);
//   if (dates.length === 0 || dates == undefined) return false;
//   for (var i = 0; i < dates.length; i++) {
//     if (dates[i].meetings.length > 0) {
//       var meeting = {
//         time: dates[i].meetings.shift(),
//         day: dates[i].day
//       };
//       return [meeting, dates];
//     } else {
//       dates.shift();
//       i--;
//     }
//   }
//   return false;
// }