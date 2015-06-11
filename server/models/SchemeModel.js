var mongoose = require('mongoose');

//line data scheme and model
//user
var dataSchema = mongoose.model('Lines', {
	location: [{
		latitude: String,
		longitude: String,
		address: String,
		_id: false
	}],
	title: String,
	druation: Number,
	druationAvarage: Number,
	confirmTime: String,
	manuall: Boolean,
	active: Boolean,
	nextAvailabeMeeting: Date,
	lineManagerId: String,
	startDate: Date,
	endDate: Date,
	drawMeetings: Boolean,
	meetingsCounter: Number,
	currentMeeting: {
		userId: String,
		userName: String,
		confirmed: Boolean,
		time: Date,
		_id: false
	},
	meetings: [{
		userId: String,
		userName: String,
		confirmed: Boolean,
		time: Date,
		_id: false
	}],
	canceldMeetings: [{
		userId: String,
		userName: String,
		confirmed: Boolean,
		time: Date,
		_id: false
	}],
	passedMeetings: [{
		userId: String,
		userName: String,
		confirmed: Boolean,
		time: Date,
		_id: false
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
	activeLines: [{
		title: String,
		lineId: String,
		_id:false
	}],
	passedLines: [{
		title: String,
		lineId: String,
		_id:false
	}],
	activeMeetings: [{
		title: String,
		lineId: String,
		time:Date,
		_id:false
	}],
	passedMeetings: [{
		title: String,
		lineId: String,
		_id:false
	}]
});

var userdb = mongoose.model('Users', userSchema);
exports.userdb = userdb;