var MongoClient = require("mongodb").MongoClient;


var fields;
var count; 

var calculateDate = function(rawdate) {
	rawdate = rawdate.split("-");
	var date = new Date(Number(rawdate[2]), Number(rawdate[0]), Number(rawdate[1]));
	timestamp = date.getTime()/1000;
	return timestamp;
};

var report = function() {
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
};

MongoClient.connect("mongodb://migmongo1.stanford.edu:27017/google_play", function(err, db) 
{
	if (err)
	{
		console.log("cannot connect");
		throw err;
	}

	console.log("connected to database");
	ios = db.collection("main_sql");

	var cursor = ios.find({});//.limit(5);

	fields = null;

	// for periodic updates, just to make sure this isn't stalling..
	count = 0;

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
			report();
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
				if ("reportdate" in doc)
				{
					// string mm-dd-yyyy
					timestamp = calculateDate(doc["reportdate"]); 
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
						if ("reportdate" in doc)
						{
							timestamp = calculateDate(doc["reportdate"]);
							
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

process.on('exit', function(){
	//do nothing.
	//should have reported by itself.
});

//catches ctrl+c event
process.on('SIGINT', function() {
	console.log("");
	console.log("");
	console.log("");
	console.log("");
	report();
	process.exit();
});

