var mongoose = require('mongoose');
var data = require('./SchemeModel.js');


exports.createLine = function(req, res) {
  if (req.query.line === undefined || req.query.line === '' || !req.query.line) {
    console.log('no search query return nothing');
    res.send('null');
  } else {
    var line = JSON.parse(req.query.line);
    data.create(line, function(err, data) {
      console.log("insert new");
      if (err) res.send("null");
      else {
        res.send(data._id);
      }

    });
  }
};