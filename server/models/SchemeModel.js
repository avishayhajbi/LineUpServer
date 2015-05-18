var mongoose = require('mongoose');

//line data scheme and model
var dataSchema = mongoose.Schema({}, {
	strict: false
});
dataSchema.set('collection', 'Lines');

//line scheme functions
dataSchema.statics.moveToApproved = function(id, meeting, cb) {
	meeting.time = new Date(meeting.time);
	delete meeting.lineId;
	return db.update({
		"_id": id
	}, {
		$pull: {
			waitingAproval: {
				userId: meeting.userId
			}
		},
		$push: {
			meetings: meeting
		}
	}, cb);

}

dataSchema.statics.getListOfLines = function(cb) {
	return db.find({}, "title location", cb);
}

dataSchema.statics.findLineByTitle = function(name, cb) {
	var re = new RegExp(name, "i");
	return db.find({
		title: re
	}, "title location", cb);
}

dataSchema.statics.moveToWaitAproval = function(lineId, wait, availableDates, cb) {

	db.update({
		"_id": lineId
	}, {
		$push: {
			waitingAproval: wait
		},
		$set: {
			availableDates: availableDates
		},
		$inc: {
			meetingsCounter: 1
		}
	}, cb);

}

var db = mongoose.model('Lines', dataSchema);
exports.db = db;
exports.dataSchema = dataSchema;


//user data scheme and model
var userSchema = mongoose.Schema({}, {
	strict: false
});

userSchema.statics.getPushToken = function(userid, cb) {

	userdb.findOne({
		"userId": userid
	}, "pushToken", cb);
}

var userdb = mongoose.model('Users', userSchema);



exports.userdb = userdb;