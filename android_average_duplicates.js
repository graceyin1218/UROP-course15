var MongoClient = require("mongodb").MongoClient;
var stanforddb = require("./stanford-db.js");


var average = function(app_ids) {
	var sum = 0;
	var num_ids = 0;
	//console.log(Object.keys(app_ids));
	keys = Object.keys(app_ids);

	for (var i = 0; i < keys.length; i++) {
//		console.log(keys[i]);
		sum += app_ids[keys[1]];
		num_ids++;
	}
	var ans = sum/num_ids;
	console.log("Average number of duplicates: " + ans);
};

MongoClient.connect("mongodb://" + stanforddb.url + "/google_play", function(err, db) {
  if (err) {
    console.log("cannot connect");
    throw err;
  }

  console.log("connected to database");
  android = db.collection("main_sql");

  var cursor = android.find({}, {"timeout": false});//.limit(50000);

  //var numIDs = cursor.count();

  var app_ids = {};

  var count = 0;
  cursor.each(function(err, doc) {
  	count++;
  	if (count % 1000 == 0) {
  		console.log(count);
  	}
    if (err) {
    	throw err;
    	db.close();
    	return;
    }
    if (doc == null) {
    	average(app_ids);
    	db.close();
    	return;
    }

    if (doc["app_id"] in Object.keys(app_ids)) {
 // 		console.log("adding");
    	app_ids[doc["app_id"]] += 1;
 //   	console.log("adding to " + doc["app_id"]);
    }
    else {
  //  	console.log("creating");
    	app_ids[doc["app_id"]] = 1;
  //  	console.log("creating " + doc["app_id"]);
    }
  });

});

