var MongoClient = require("mongodb").MongoClient;
//var fs = require("fs");
var async = require("async");
var stanforddb = require("./stanford-db.js");

var totalDocs = 568082642 - 1;

var average = {
	"number_of_docs": 0,
	"price" : 0,
	"rating" : 0,
	"timestamp" : 0,
};
var average_permissions = {
	"number_of_docs": 0,
	"price" : 0,
	"rating" : 0,
	"timestamp" : 0,
};
var average_no_permissions = {
	"number_of_docs": 0,
	"price" : 0,
	"rating" : 0,
	"timestamp" : 0,
};

var count;


MongoClient.connect("mongodb://" + stanforddb.url + "/apple_ios", function(err, db)
{
	if (err)
	{
		console.log("cannot connect");
		throw err;
	}
	console.log("connected to database");
	ios = db.collection("main");

	var size = 100000;

	var cursor = ios.find({}, ["app_name", 	"price", "timestamp", "ratingCountList", "hasInAppPurchases", "supportsPassbook"]);//.limit(200); //.batchSize(200);
	

	var i = 0;
	count = 0;

	var collect_data = function(callback) {
	
		cursor.each(function(err, doc) {
			count++;
			//will make us ignore the last document in the cursor, but that is ok.
			if (count == totalDocs)
			{
				db.close();
				callback();
			}
			if (doc == null)
			{
				db.close();
				callback();
			}
			if (err)
			{
				console.log("ERROR");
				db.close();
				throw err;
			}
			if (i === 0) 
			{
				//console.log(doc);
				recordObject(doc);
			}

			//use this to control how large a sample size you want.
			i = (i+1)%size;
		});
	};



	async.series([
		function(callback) {
			collect_data(callback);
		}
	], 
	function(err, results) {
			console.log();
			console.log("async done");
			console.log();

			// average["price"] = average["price"]/average["number_of_docs"];
			// average["timestamp"] = average["timestamp"]/average["number_of_docs"];
			// average["rating"] = average["rating"]/average["number_of_docs"];

			// average_permissions["price"] = average_permissions["price"]/average_permissions["number_of_docs"];
			// average_permissions["timestamp"] = average_permissions["timestamp"]/average_permissions["number_of_docs"];
			// average_permissions["rating"] = average_permissions["rating"]/average_permissions["number_of_docs"];

			// average_no_permissions["price"] = average_no_permissions["price"]/average_no_permissions["number_of_docs"];
			// average_no_permissions["timestamp"] = average_no_permissions["timestamp"]/average_no_permissions["number_of_docs"];
			// average_no_permissions["rating"] = average_no_permissions["rating"]/average_no_permissions["number_of_docs"];
	
			console.log("general average: ");
			console.log("  number of docs: " + average["number_of_docs"]);
			console.log("  price: " + average["price"]);
			console.log("  timestamp: " + average["timestamp"]);
			console.log("  rating: " + average["rating"]);

			console.log("permissions average: ");
			console.log("  number of docs: " + average_permissions["number_of_docs"]);
			console.log("  price: " + average_permissions["price"]);
			console.log("  timestamp: " + average_permissions["timestamp"]);
			console.log("  rating: " + average_permissions["rating"]);

			console.log("no permissions average: ");
			console.log("  number of docs: " + average_no_permissions["number_of_docs"]);
			console.log("  price: " + average_no_permissions["price"]);
			console.log("  timestamp: " + average_no_permissions["timestamp"]);
			console.log("  rating: " + average_no_permissions["rating"]);

	}
	); 


});


var recordObject = function(doc) {
	console.log(count);

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
	average["number_of_docs"]++;
	if ("price" in doc)
	{
		average["price"] = ( price_value(doc["price"]) * (1/average["number_of_docs"]) ) + ( average["price"] * ( (average["number_of_docs"]-1)/average["number_of_docs"] ));
	}
	if ("ratingCountList" in doc) 
	{
		average["rating"] = ( average_rating(doc["ratingCountList"]) * 1/average["number_of_docs"] ) + ( average["rating"] * (average["number_of_docs"]-1)/average["number_of_docs"] );
	}
	//penalty for not having ratings
	else
	{
		average["rating"] = ( average["rating"] * (average["number_of_docs"]-1)/average["number_of_docs"] );
	}
	if ("timestamp" in doc)
	{
		average["timestamp"] = ( timestamp_value(doc["timestamp"]) * 1/average["number_of_docs"] ) + ( average["timestamp"] * (average["number_of_docs"]-1)/average["number_of_docs"] );
	}
	//include in general average
};
var record_permissions = function(doc) {
	//doc guaranteed to not be null
	average_permissions["number_of_docs"]++;
	if ("price" in doc)
	{
		average_permissions["price"] = ( price_value(doc["price"]) * (1/average_permissions["number_of_docs"]) ) + ( average_permissions["price"] * ( (average_permissions["number_of_docs"]-1)/average_permissions["number_of_docs"] ));
	}
	if ("ratingCountList" in doc) 
	{
		average_permissions["rating"] = ( average_rating(doc["ratingCountList"]) * 1/average_permissions["number_of_docs"] ) + ( average_permissions["rating"] * (average_permissions["number_of_docs"]-1)/average_permissions["number_of_docs"] );
	}
	//penalty for not having ratings
	else
	{
		average_permissions["rating"] = ( average_permissions["rating"] * (average_permissions["number_of_docs"]-1)/average["number_of_docs"] );
	}
	if ("timestamp" in doc)
	{
		average_permissions["timestamp"] = ( timestamp_value(doc["timestamp"]) * 1/average_permissions["number_of_docs"] ) + ( average_permissions["timestamp"] * (average_permissions["number_of_docs"]-1)/average_permissions["number_of_docs"] );
	}

	//include in permissions average
};
var record_no_permissions = function(doc) {
	//doc guaranteed to not be null
	average_no_permissions["number_of_docs"]++;
	if ("price" in doc)
	{
		average_no_permissions["price"] = ( price_value(doc["price"]) * (1/average_no_permissions["number_of_docs"]) ) + ( average_no_permissions["price"] * ( (average_no_permissions["number_of_docs"]-1)/average_no_permissions["number_of_docs"] ));
	}
	if ("ratingCountList" in doc) 
	{
		average_no_permissions["rating"] = ( average_rating(doc["ratingCountList"]) * 1/average_no_permissions["number_of_docs"] ) + ( average_no_permissions["rating"] * (average_no_permissions["number_of_docs"]-1)/average_no_permissions["number_of_docs"] );
	}
	else
	{
		average_no_permissions["rating"] = ( average_no_permissions["rating"] * (average_no_permissions["number_of_docs"]-1)/average_no_permissions["number_of_docs"] );
	}
	if ("timestamp" in doc)
	{
		average_no_permissions["timestamp"] = ( timestamp_value(doc["timestamp"]) * 1/average["number_of_docs"] ) + ( average["timestamp"] * (average["number_of_docs"]-1)/average["number_of_docs"] );
	}
	//include in no permissions average
};



var price_value = function(str) {
	if (str == null)
	{
		return 0;
	}
	return parseFloat(str.substring(1));
};
var timestamp_value = function(str) {
	if (str == null) 
	{
		return 0;
	}
	return parseFloat(str);
}
var average_rating = function(ratings) {
	if (ratings == null)
	{
		return 0;
	}
	var sum = 0;
	var number_of_ratings = 0;
	for (var j = 0; j < 5; j++)
	{
		value = parseFloat(ratings[j]);
		sum += value*(5-j);
		number_of_ratings += value;

	}

	return (sum/number_of_ratings);
}



