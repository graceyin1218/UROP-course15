var unirest = require("unirest");
var MongoClient = require("mongodb").MongoClient;
var stanforddb = require("./stanford-db.js");
var request = require("sync-request");
var sleep = require("sleep");


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

	count = 0;


//synchronous way of iterating over a mongodb cursor
// http://stackoverflow.com/questions/18119387/iterating-over-a-mongodb-cursor-serially-waiting-for-callbacks-before-moving-to

android.find({}, function(err, resultCursor) {
	// I believe item == mongodb document
  function processItem(err, doc) {
    	if(doc === null) {
      		return; // All done!
    	}
    	count++;
		if (count%10000 == 0) {
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

		// Synchronous HTTP request!!

		var res = request("GET", "https://gplaystore.p.mashape.com/applicationReviews?id=" + app_id + "&lang=en&page=2", {
			headers: {
				"X-Mashape-Key": "lCbaNKES1SmshAXGZwfFKIClgm7Tp1akcNVjsnvEiCJ9kN0S3H",
				"Accept": "application/json"
			}
		});

		//console.log(JSON.parse(res.body));


  		for (var i = 0; i < res.body.length; i++) {
  			var r = res.body[i];
			var newDoc = {
  				"app_id": app_id,
  				"app_name": app_name,
  				"title": r["title"],
  				"body": r["body"],
  				"rating": r["rating"],
  				"date": r["date"],
  				"dateIso": r["dateIso"]
  			};
//  		console.log(newDoc);
			// this is asynchronous
            reviews.insert(newDoc, function(err, records) {
                if (err) throw err;
                // do nothing
            });
        }

        // wait 0.5 seconds for the review scraping to finish for each document
        sleep.sleep(0.5);

    	externalAsyncFunction(doc, function(err) {
      		resultCursor.nextObject(processItem);
    	});

  }

  resultCursor.nextObject(processItem);
} 

// Mongodb's cursor.each is asynchronous. We want a synchronous version. (look above)

// 	var cursor = android.find({}, {"app_id":1, "appname":1, "_id":0}).limit(25000); //.limit(1);
// 	count = 0;

// 	cursor.each(function(err, doc) {
// 		count++;
// 		if (count%10000 == 0) {
// 			console.log(count);
// 		}
// 		if (err) {
// 			console.log("ERROR");
// 			// Cannot close prematurely, because of stupid callbacks
//       //db.close();
// 			throw err;
// 		}
// 		if (doc == null) {
// 			console.log("\n\ndone\n\n");
// 			// Cannot close prematurely. Look above.
//       //db.close();
// 			return;
// 		}

// 		var app_id = doc["app_id"];
// 		var app_name = doc["appname"];

// 		// Synchronous HTTP request!!

// 		var res = request("GET", "https://gplaystore.p.mashape.com/applicationReviews?id=" + app_id + "&lang=en&page=2", {
// 			headers: {
// 				"X-Mashape-Key": "lCbaNKES1SmshAXGZwfFKIClgm7Tp1akcNVjsnvEiCJ9kN0S3H",
// 				"Accept": "application/json"
// 			}
// 		});

// 		//console.log(JSON.parse(res.body));


//   		for (var i = 0; i < res.body.length; i++) {
//   			var r = res.body[i];
// 			var newDoc = {
//   				"app_id": app_id,
//   				"app_name": app_name,
//   				"title": r["title"],
//   				"body": r["body"],
//   				"rating": r["rating"],
//   				"date": r["date"],
//   				"dateIso": r["dateIso"]
//   			};
// //  		console.log(newDoc);
//             reviews.insert(newDoc, function(err, records) {
//                 if (err) throw err;
//                 // do nothing
//             });
//         }

//         if (callback_count == 3296514) {
//            process.exit();
//         }

// 		});

//           if (callback_count == 25000) {    //3296514) {
//               process.exit();
//           }


// original asynchronous version. A lot has been copied and pasted from this.

		// SCRAPE REVIEWS
// 		unirest.get("https://gplaystore.p.mashape.com/applicationReviews?id=" + app_id + "&lang=en&page=2")
// 		.header("X-Mashape-Key", "lCbaNKES1SmshAXGZwfFKIClgm7Tp1akcNVjsnvEiCJ9kN0S3H")
// 		.header("Accept", "application/json")
// 		.end(function (result) {
//   				//console.log(result.status, result.headers, result.body);
//   				//console.log();
//           //

//           // quick way to tell if we are done with all the callbacks..
//           callback_count++;
//           if (callback_count % 10000 == 0) {
//               console.log("added " + callback_count + " docs");
//           }


//   				for (var i = 0; i < result.body.length; i++) {
//   					var res = result.body[i];
// 					var newDoc = {
//   						"app_id": app_id,
//   						"app_name": app_name,
//   						"title": res["title"],
//   						"body": res["body"],
//   						"rating": res["rating"],
//   						"date": res["date"],
//   						"dateIso": res["dateIso"]
//   					};
// //  					console.log(newDoc);
//             reviews.insert(newDoc, function(err, records) {
//                 if (err) throw err;
//                 // do nothing
//             });
//           }

//           if (callback_count == 3296514) {
//               process.exit();
//           }

// 		 });

	// })
});


process.on("SIGINT", function() {
	console.log("\n\nCANCELLED PROCESS\n\n");
	//console.log("viewed " + (count-1) + " documents");
	//console.log('\n');
  //global_db.close();
  	process.exit(1);
});

process.on("exit", function() {
	console.log("\n\nCOMPLETED PROCESS\n\n");
	console.log("viewed " + (count-1) + " documents");
	console.log('\n');
  global_db.close();
});



