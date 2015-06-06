var mongoose = require('mongoose');

//line data scheme and model
//user
var dataSchema = mongoose.model('Lines', {
	location: [{
		latitude: String,
		longitude: String,
		address: String
	}],
	title: String,
	druation: Number,
	confirmTime: String,
	manuall: Boolean,
	active: Boolean,
	lineManagerId: String,
	drawMeetings: Boolean,
	meetingsCounter: Number,
	currentMeeting: {
		userId: String,
		userName: String,
		confirmed: Boolean,
		time: Date
	},
	meetings: [{
		userId: String,
		userName: String,
		confirmed: Boolean,
		time: Date
	}],
	canceldMeetings: [{
		userId: String,
		userName: String,
		confirmed: Boolean,
		time: Date
	}],
	passedMeetings: [{
		userId: String,
		userName: String,
		confirmed: Boolean,
		time: Date
	}]
});


var db = mongoose.model('Lines', dataSchema);
exports.db = db;

//user
var userSchema = mongoose.model('Users', {
	username: String,
	fbId: String,
	password: String,
	pushToken: String,
	email: String,
	activeLines: [String],
	passedLines: [String],
	activeMeetings: [String],
	passedMeetings: [String]
});

var userdb = mongoose.model('Users', userSchema);
exports.userdb = userdb;