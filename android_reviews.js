var unirest = require("unirest");
var MongoClient = require("mongodb").MongoClient;
var stanforddb = require("./stanford-db.js");


// These code snippets use an open-source library. http://unirest.io/nodejs
// unirest.get("https://gplaystore.p.mashape.com/applicationReviews?id=com.shivay.SBGitaHi4&lang=en&page=1")
// .header("X-Mashape-Key", "lCbaNKES1SmshAXGZwfFKIClgm7Tp1akcNVjsnvEiCJ9kN0S3H")
// .header("Accept", "application/json")
// .end(function (result) {
//   console.log(result.status, result.headers, result.body);
// });

var count;

MongoClient.connect("mongodb://" + stanforddb.url + "/google_play", function(err, db) {
	if (err) {
		console.log("cannot connect");
		throw err;
	}
	console.log("connected to database");
	var android = db.collection("main_sql");
	var reviews = db.collection("reviews");

	var cursor = android.find({}, {"app_id":1, "appname":1, "_id":0}).limit(5);
	count = 0;

	cursor.each(function(err, doc) {
		count++;
		if (count%1000 == 0) {
			console.log(count);
		}
		if (err) {
			console.log("ERROR");
			db.close();
			throw err;
		}
		if (doc == null) {
			console.log("\n\ndone\n\n");
			db.close();
			return;
		}

		var app_id = doc["app_id"];
		var app_name = doc["appname"];

		// SCRAPE REVIEWS
		unirest.get("https://gplaystore.p.mashape.com/applicationReviews?id=" + app_id + "&lang=en&page=2")
		.header("X-Mashape-Key", "lCbaNKES1SmshAXGZwfFKIClgm7Tp1akcNVjsnvEiCJ9kN0S3H")
		.header("Accept", "application/json")
		.end(function (result) {
  				//console.log(result.status, result.headers, result.body);
  				//console.log();
  				for (var i = 0; i < result.body.length; i++) {
  					var res = result.body[i];
					var newDoc = {
  						"app_id": app_id,
  						"app_name": app_name,
  						"title": res["title"],
  						"body": res["body"],
  						"rating": res["rating"],
  						"date": res["date"],
  						"dateIso": res["dateIso"]
  					};
  					console.log(newDoc);
  				}

		 });

	})
});


process.on("SIGINT", function() {
	console.log("\n\nCANCELLED PROCESS\n\n");
	console.log("viewed " + (count-1) + " documents");
	console.log('\n');
});

process.on("exit", function() {
	console.log("\n\nCOMPLETED PROCESS\n\n");
	console.log("viewed " + (count-1) + " documents");
	console.log('\n');
});



