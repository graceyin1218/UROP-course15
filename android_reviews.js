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
var global_db;

var callback_count = 0;

MongoClient.connect("mongodb://" + stanforddb.url + "/google_play", function(err, db) {
	if (err) {
		console.log("cannot connect");
		throw err;
	}
	console.log("connected to database");
	global_db = db;
  var android = db.collection("main_sql");
	var reviews = db.collection("reviews");

	var cursor = android.find({}, {"app_id":1, "appname":1, "_id":0}); //.limit(1);
	count = 0;

	cursor.each(function(err, doc) {
		count++;
		if (count%1000 == 0) {
			console.log(count);
		}
		if (err) {
			console.log("ERROR");
			// Cannot close prematurely, because of stupid callbacks
      //db.close();
			throw err;
		}
		if (doc == null) {
			console.log("\n\ndone\n\n");
			// Cannot close prematurely. Look above.
      //db.close();
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
          //

          // quick way to tell if we are done with all the callbacks..
          callback_count++;
          if (callback_count % 10000 == 0) {
              console.log("added " + callback_count + " docs");
          }


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
//  					console.log(newDoc);
            reviews.insert(newDoc, function(err, records) {
                if (err) throw err;
                // do nothing
            });
          }

          if (callback_count == 3296514) {
              process.exit();
          }

		 });

	})
});


process.on("SIGINT", function() {
	console.log("\n\nCANCELLED PROCESS\n\n");
	//console.log("viewed " + (count-1) + " documents");
	//console.log('\n');
  //global_db.close();
});

process.on("exit", function() {
	console.log("\n\nCOMPLETED PROCESS\n\n");
	console.log("viewed " + (count-1) + " documents");
	console.log('\n');
  global_db.close();
});



