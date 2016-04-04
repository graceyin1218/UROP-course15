var MongoClient = require("mongodb").MongoClient;
var stanforddb = require("./stanford-db.js");
//var fs = require("fs");

var totalDocs = 568082642;

var average = {
	"price" : 0,
	"rating" : 0,
	"timestamp" : 0,
};
var average_permissions = {
	"price" : 0,
	"rating" : 0,
	"timestamp" : 0,
};
var average_no_permissions = {
	"price" : 0,
	"rating" : 0,
	"timestamp" : 0,
};


MongoClient.connect("mongodb://" + stanforddb.url + "/apple_ios", function(err, db)
{
	if (err)
	{
		console.log("cannot connect");
		throw err;
	}
	console.log("connected to database");
	ios = db.collection("main");

	// console.log(ios.findOne({}, function(err, doc) {
	// 	console.log(doc);
	// }));

	var size = 50

	var cursor = ios.find({}, ["app_name", 	"price", "timestamp", "ratingCountList", "hasInAppPurchases", "supportsPassbook"]).limit(200).batchSize(200);
	
	var i = 0;
	var count = 0;
	cursor.each(function(err, doc) {
		count++;
		//will make us ignore the last document in the cursor, but that is ok.
		if (count == totalDocs)
		{
			db.close();
			return;
		}
		if (err)
		{
			console.log("ERROR");
			db.close();
			throw err;
		}
		if (i === 0) 
		{
			recordObject(doc);
			console.log(doc);
			console.log("\n\n");
			console.log(price_value(doc["price"]))
		}

		//use this to control how large a sample size you want.
		i = (i+1)%size;
	});


	// cursor.each(function(err, doc) {
	// 	if (!i)
	// 	{
	// 		console.log("\n\n done");
	// 		db.close();
	// 		return;
	// 	}
	// 	if (err)
	// 	{
	// 		console.log("error with doc in cursor");
	// 		throw err;
	// 	}
	// 	if (doc == null)
	// 	{
	// 		console.log("doc is null");
	// 		return db.close();
	// 	}

	// 	console.log("contains in app purchases?");
	// 	console.log("\t" + ("hasInAppPurchases" in doc));
	// 	console.log(doc);

	// 	i = false;

	// 	db.close();
	// }); 

});


var recordObject = function(doc) {
	if (doc == null)
	{
		return;
	}

	record_general(doc);

	//then record to "yes permissions" or "no permissions" csv files
	if ("hasInAppPurchases" in doc)
	{
		record_permissions(doc);
	}
	else 
	{
		record_no_permissions(doc);
	}

};

var record_general = function(doc) {
	//doc guaranteed to not be null


	//include in general average
};

var record_permissions = function(doc) {
	//doc guaranteed to not be null

	//include in permissions average
};

var record_no_permissions = function(doc) {
	//doc guaranteed to not be null

	//include in no permissions average
};

var price_value = function(str) {
	return parseFloat(str.substring(1));
};

var average_rating = function(ratings) {
	var sum = 0;
	var i = 0;
	for rating in ratings {
		sum +=- parseFloat(rating);
		i++;
	}
	return (sum/i);
}



