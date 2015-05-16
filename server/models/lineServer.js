var mongoose = require('mongoose');
var db = require('./SchemeModel.js').db;
var dataSchema = require('./SchemeModel.js').dataSchema;
var utils = require('../includes/utils.js');
var cron = require('node-schedule');
var combineHandler = require('./combineHandler.js');
exports.createLine = function(req, res) {

  if (!req.query.line) {
    console.log('no search query return nothing');
    res.send(false);
    return;
  }
  var line = JSON.parse(req.query.line);
  var jobTimes = [];
  var i;
  
  for (i = 0; i < line.availableDates.length; i++) {
    line.availableDates[i].from = new Date(line.availableDates[i].from);
    line.availableDates[i].to = new Date(line.availableDates[i].to);
    line.availableDates[i].nextMeeting = line.availableDates[i].from;
    jobTimes.push(new Date(line.availableDates[i].from.getTime() - line.confirmTime * 60000));
  }
  line.day = {
    indexOfDay: 0,
    maxDays: i
  };
  line.drawMeetings = true;
  line.active = false;
  line.currentMeeting = 0;
  line.availableDates = utils.sort(line.availableDates, "from");
  line.meetings = [];
  line.canceldMeetings = [];
  line.passedMeetings = [];
  line.meetingsCounter = 0;

  db.create(line, function(err, data) {
    
    console.log("insert new");
    if (err || !data) {
      console.log(err);
      res.send(false);
      return;
    }
    var doc = data.toJSON();
    addJobs(data._id.toString(), jobTimes);
    console.log("insert new");
    res.send(data._id);

  });

};


exports.nextMeeting = function(req, res) {
  debugger;
  if (!req.query.lineId) {
    console.log('no search query return nothing');
    res.send(false);
    return;
  }
  var lineId = req.query.lineId;
  db.fineOne({
    "_id": lineId
  }, function(err, data) {
    debugger;
    if (err || !data) {
      console.log(err);
      res.send(false);
      return
    }

    var doc = data.toJSON();
    
    doc.passedMeetings.push(doc.currentMeeting);

    handleNextConfirmations(lineId, doc.meetings, doc.confirmTime, doc.druation);

    //if there is more meetings
    var next = doc.meetings.pop();
    if (next) {
      //yes there is another meeting 
      var CheckIfNextDay = new Date(new Date(next.time) - new Date(doc.currentMeeting.time));
      //check if the meeting is in the this day of other
      if (CheckIfNextDay <= doc.druation) {
        //meeting is in this day 
        doc.currentMeeting = next;
        notifyUser("user:" + doc.currentMeeting.userName + "please enter line:" + doc.lineTitle);
        var offset = doc.nextMeeting.time.getTime() - new Date().getTime();
        if (offset > 5 || offset < -5) {
          combineHandler.forwardMeetings(doc);
          res.send("next meeting enterd " + " meeting took more/less 5 min notifiy all users");
        } else {
          res.send("next meeting enterd");
        }
      } else {
        //metting is tomorw close the line for now 
        doc.currentMeeting = null;
        doc.day.indexOfDay++;
        doc.active = false;
        res.send("line done for today will start again next day");
      }

    } else {
      //no more meetings in list 
      var offset = new Date(doc.availableDates[doc.day.indexOfDay].to - new Date());
      if (offset < doc.druation) {
        //no more room for meetings 
        if (doc.day.indexOfDay < doc.day.maxDays - 1) {
          // line finish for today
          res.send("line done for today");
        } else {
          // line ended
          doc.drawMeetings = false;
          res.send("line ended");
        }
        doc.currentMeeting = null;
        doc.active = false;

      } else {
        //TODO ask admon what to do
        res.send("ask manager what to do with line");
      }

    }
    var data = new dataSchema();
    data = doc;
    db.update({
      "_id": lineId
    }, doc , {upsert: true}
    , function(err, data) {
      
    });


  });

}

exports.whatToDo = function(req, res) {

  if (!req.query.lineId || !req.query.answer) {
    console.log('no req');
    res.send(false);
    return;
  }
  var lineId = req.query.lineId;
  var answer = req.query.answer; //0 - open ,  1- close;
  db.fineOne({
    "_id": lineId
  }, function(err, data) {
    if (err || !data) {
      console.log(err);
      res.send(false);
      return;
    }
    var doc = data.toJSON();
    if(answer === "0") {
      res.send("line will stay open");
      return;
    } else if (answer === "1") {
      if (doc.day.indexOfDay < doc.day.maxDays - 1) {
        // line finish for today
        res.send("line done for today");
      } else {
        // line ended
        doc.drawMeetings = false;
        res.send("line ended");
      }
      doc.currentMeeting = null;
      doc.active = false;

    } else {
      console.log("no answer");
      res.send(false);
      return;
    }


        db.update({
      "_id": lineId
    }, {
      doc: doc
    }, function(err, data) {

    });

  });

}


function addJobs(lineId, jobTimes) {
  if (!lineId || !jobTimes) return;
  for (var i = 0; i < jobTimes.length; i++) {
    // schedule every time a day start event
    cron.scheduleJob(lineId, jobTimes[i], function() {
      db.findOne({
        "_id": lineId
      }, function(err, data) {
        debugger;
        if (err || !data) {
          console.log(err);
          res.send(false);
          return
        }
        var line = data.toJSON();
        handleNextConfirmations(lineId, line.meetings, line.confirmTime, line.druation);

        if (line.currentMeeting == "0") {
          line.currentMeeting = line.meetings.pop();

          db.update({
            "_id": lineId
          }, {
            currentMeeting: line.currentMeeting , $pop : {mettings : -1}  
          }, function(err, data) {
            //TODO check if data save
          });
        }

      });
    });
  }
}



function handleNextConfirmations(lineId, meetings, confirmTime, druation) {
  debugger;
  if (!lineId || !meetings || !confirmTime || !druation) return;

  var now = new Date();
  var tz_correction_minutes = now.getTimezoneOffset() - meetings[0].time.getTimezoneOffset();
  now.setMinutes(now.getMinutes() + tz_correction_minutes);

  var toConfirm = new Date(now.getTime() + confirmTime * 60000);

  for (var i = 0; i < meetings.length; i++) {
    var top = new Date(meetings[i].time.getTime() + druation * 60000);
    var bottom = new Date(meetings[i].time.getTime() - druation * 60000);
    if (toConfirm >= bottom && toConfirm <= top && !meetings[i].confirmed) {

      // notifyUser("askConformation from user:", meetings[i].userId, " to line number:", lineId, " to meeting in time:", meetings[i].time);
      //sechedule check if confirm cron
      var reConfrim = new Date(now.getTime() + confirmTime * 15000);
      scheduleWaitConfirm(lineId, meetings[i].userId, reConfrim, confirmTime);
    }
  }

}

function scheduleWaitConfirm(lineId, userId, time, confirmTime) {
  if (!lineId || !userId || !time || !confirmTime) return;
  var params = {
    lineId: lineId,
    userId: userId
  };
  cron.scheduleJob(params, time, function() {

    db.findOne({
      "_id": params.lineId }, "meetings confirmTime druation"
    , function(err, data) {
      
      if (err || !data) {
        console.log(err);
        res.send(false);
        return
      }
      var doc = data.toJSON();
      var meeting;
      for (var i = 0; i < doc.meetings.length; i++) {
        if (doc.meetings[i].userId == userId) {
          meeting = doc.meetings[i];
          break;
        }
      }
      if (!meeting) return;
      if (!meeting.confirmed && new Date(meeting.time.getTime() - doc.confirmTime * 30000) > new Date()) {
        newTime = new Date(new Date().getTime() + doc.confirmTime * 15000);
        notifyUser("askConformation from user:", params.userId, " to line number:", params.lineId, " to meeting in time:", meeting.time);
        scheduleWaitConfirm(params.lineId, params.userId, newTime, doc.timeConfirm);
      }

    });
  });
}
