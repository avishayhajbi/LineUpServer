// var mongoose = require('mongoose');
// var dataSchema = mongoose.Schema({});
// dataSchema.set('collection', 'data');
// var data = mongoose.model('data', dataSchema);

var demoMeet = {};


exports.requestMeeting = function(req, res) {
	console.log("metting:"+req.query.meeting);
  if (req.query.meeting === undefined || req.query.meeting === '' || !req.query.meeting) {
    console.log('no search query return nothing');
    res.send('null');
  } else {
    //search for closet lines and send
    var lines = lines2; //change to query in db
    console.log('found all cases return  them sorted');
    res.send(orderLineList(req.query.location, lines));
  }
};


