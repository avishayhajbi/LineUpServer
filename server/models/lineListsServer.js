var mongoose = require('mongoose');
var dataSchema = mongoose.Schema({});
dataSchema.set('collection', 'data');
var data = mongoose.model('data', dataSchema);


exports.getlineList = function(req, res) {
  if (req.query.location === undefined || req.query.location === '' || !req.query.location) {
    var lines = lines1; //query for first 100 in db
    console.log('send list without geo');
    res.send(lines1);
  } else {
    //search for closet lines and send
    var lines = lines1; //change to query in db
    console.log('sort lines by geo');
    res.send(orderLineList(req.query.location, lines));
  }
};

exports.searchlineList = function(req, res) {
  if (req.query.value === undefined || req.query.value === '' || !req.query.value || req.query.location === undefined || req.query.location === '' || !req.query.location) {
    console.log('no search query return nothing');
    res.send('null');
  } else {
    //search for closet lines and send
    var lines = lines2; //change to query in db
    console.log('found all cases return  them sorted');
    res.send(orderLineList(req.query.location, lines));
  }
};


exports.getLine = function(req, res) {
  console.log("lineID:" + req.query.lineId);
  if (req.query.lineId === undefined || req.query.lineId != 822) {
    console.log('no search query return nothing');
    res.send(false);
  } else {
    res.send(demoLineInfo);
  }
};


function orderLineList(myLocation, lines) {
  for (var i = 0; i < lines.length; i++) {
    var dX = Math.abs(myLocation.latitude - lines[i].location.latitude);
    var dY = Math.abs(myLocation.longitude - lines[i].location.longitude);
    var distance = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
    lines[i].distanceFromMe = distance;
  }
  lines.sort(function(a, b) {
    return a.distanceFromMe - b.distanceFromMe;
  });
  return lines;

}


var demoLineInfo = {
  id:822,
  lineName: 'JonnyLine',
  lineDescrition: 'get in my belly line',
  configEnabeld: true,
  type: ["1", "2", "3"],
  availableDates: [{
        day: "01-01-2013",
        availableMeetings: ["07:00", "08:00", "09:00", "10:00"]
      }, {
        day: "01-01-2015",
        availableMeetings: ["07:00", "08:00", "09:00", "10:00"]
      }],
  startDate:'11/03/2014',
  endDate:'11/04/2014',
  image:"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"
}

var lines1 = [{
    title: 'Collect coins',
    id: 422,
    location: {
      latitude: 31.2000,
      longitude: 34.1500
    }
  }, {
    title: 'Eat mushrooms',
    id: 312,
    location: {
      latitude: 31.7000,
      longitude: 34.2500
    }
  }, {
    title: 'Get high enough to grab the flag',
    id: 82,
    location: {
      latitude: 31.8000,
      longitude: 34.4500
    }
  }, {
    title: 'wtj line',
    id: 123,
    location: {
      latitude: 31.1000,
      longitude: 34.1500
    }
  }, {
    title: 'my get line ',
    id: 123,
    location: {
      latitude: 31.8000,
      longitude: 34.1500
    }
  }, {
    title: 'jooney line',
    id: 123,
    location: {
      latitude: 31.1400,
      longitude: 34.1200
    }
  }, {
    title: 'when will shenkar finish',
    id: 123,
    location: {
      latitude: 32.1000,
      longitude: 33.3500
    }
  }, {
    title: 'shenkar 666',
    id: 123,
    location: {
      latitude: 32.1000,
      longitude: 35.1500
    }
  }, {
    title: 'snowboard in a week',
    id: 123,
    location: {
      latitude: 32.0000,
      longitude: 33.7500
    }
  },

  {
    title: 'liron is getting marrid more work for me',
    id: 123,
    location: {
      latitude: 31.9000,
      longitude: 34.8500
    }
  }, {
    title: 'shits',
    id: 123,
    location: {
      latitude: 31.5000,
      longitude: 34.1500
    }
  }, {
    title: 'bakbok bli pkak',
    id: 123,
    location: {
      latitude: 32.5000,
      longitude: 35.3500
    }
  }, {
    title: 'Find the woldo',
    id: 123,
    location: {
      latitude: 31.1000,
      longitude: 34.9500
    }
  }, {
    title: 'Find the Princes23423',
    id: 123,
    location: {
      latitude: 32.1100,
      longitude: 34.7500
    }
  }
];

var lines2 = [{
  title: 'Casdasfgsdg',
  id: 123,
  location: {
    latitude: 31.2000,
    longitude: 34.1500
  }
}, {
  title: 'sdfgsdfgsdfhjms',
  id: 123,
  location: {
    latitude: 31.7000,
    longitude: 34.2500
  }
}, {
  title: 'sdfgsdfgsdfgsdfg',
  id: 123,
  location: {
    latitude: 31.8000,
    longitude: 34.4500
  }
}];