var MongoClient = require("mongodb").MongoClient;

//var async = require("async");

// Array.prototype.contains = function (x)
// {
// 	for (i in this) 
// 	{
// 		if (this[i] == x) return true;
// 	}
// 	return false;
// }

MongoClient.connect("mongodb://migmongo1.stanford.edu:27017/apple_ios", function(err, db) 
{
	if (err)
	{
		console.log("cannot connect");
		throw err;
	}

	console.log("connected to database");
	ios = db.collection("main");

	var cursor = ios.find({}).limit(250001);//.limit(5);

	var fields = null;

	// for periodic updates, just to make sure this isn't stalling..
	var count = 0;

	cursor.each(function(err, doc) 
	{
		count++;
		if (count%10000 == 1)
		{
			console.log(count);
		}

		if (err)
		{
			console.log("ERROR");
			db.close();
			throw err;
		}
		if (doc == null)
		{
			console.log("\n\ndone\n\n");
			console.log("all fields: \n");
			console.log(fields);

			console.log("\n\nshared fields:\n");
			for(var i = 0; i < fields.length; i++)
			{
				if (fields[i]["shared"])
				{
					console.log(fields[i]);
				}
			}
			console.log("\n");

			console.log("examined " + (count-1) + " documents");
			console.log("");

			db.close();
			return;
		}
		var keys = Object.keys(doc);

		// console.log("current doc");
		// console.log(keys);
		// console.log("\n");

		if (fields == null)
		{
			fields = [];
			for (var i = 0; i < keys.length; i++)
			{
				// timestamp of 0 if there is no timestamp
				var timestamp = 0;
				if ("timestamp" in doc)
				{
					timestamp = doc["timestamp"];
				}
				fields.push({
					key: keys[i],
					value: timestamp,
					shared: true
				});
			}
		}
		else 
		{
			for (var i = 0; i < fields.length; i++) 
			{
				var shared = false;
				for (var j = 0; j < keys.length; j++)
				{
					if (fields[i]["key"] == keys[j])
					{
						shared = true;
						//update the timestamp, if necessary
						if ("timestamp" in doc)
						{
							var timestamp = doc["timestamp"];
							if (typeof doc["timestamp"] !== "number")
							{
								timestamp = Number(doc["timestamp"]);
							}
							if (timestamp < fields[i]["value"])
							{
								fields[i]["value"] = timestamp;
							}

						}
						break;
					}
				}

				if (!shared)
				{
					if (fields[i]["shared"])
					{
						fields[i]["shared"] = false;
						console.log(fields[i]);
						console.log("");
					}

					//console.log(fields[i]);
					// fields.splice(i, 1);
					// i--;
				}
			}
		}
		// console.log("common fields");
		// console.log(common_fields);
		// console.log("\n\n");
	});
});
