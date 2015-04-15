var mongoose = require('mongoose');
var dataSchema = mongoose.Schema({}, {
	strict: false
});
dataSchema.set('collection', 'Lines');


var db  = mongoose.model('Lines', dataSchema);

db.getListOfLines = function (cb)  {
return db.find({}, "title location", cb);
}

db.findLineByTitle =  function (name ,cb) {
	var re = new RegExp(name, "i");
	return db.find({
		title: re
	}, "title location" , cb);
}

db.getNextDate =  function (id ,cb) {

db.find({
      "_id": id
    } , function(err , data) { 
    	line = data[0]._doc;
    	availableDates= line.availableDates;
    	delete line.availableDates;
    	delete line.lineManagerId;
    	
    });

}
module.exports = db ;