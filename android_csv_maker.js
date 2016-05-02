var fs = require("fs");
var MongoClient = require("mongodb").MongoClient;
var stanforddb = require("./stanford-db.js");

var fields;
var count;

var calculateDate = function(rawdate) {
  rawdate = rawdate.split("-");
  var date = new Date(Number(rawdate[2]), Number(rawdate[0]), Number(rawdate[1]));
  timestamp = date.getTime()/1000;
  return timestamp;
};

var file = "android_gaming_all.csv";
var fields = ["app_id", "reportdate", "appname", "content_rating", "overallrating", "cur_version", "num_ratings", "permission1", "permission2", "permission3", "permission4", "permission5", "permission6", "permission7", "permission8", "permission9", "permission10", "size", "app_url", "android_requirement", "devname", "dev_website", "category", "price", "num_reviews", "installs", "appdescription", "phone_only"];
var results = {};
var appIDs = [];

// key = app id.
// value = (called "value") the whole doc... (including the id)
//          + the timestamp in numerical form


var replaceAll = function(str, search, replacement) {
  var target = str;
  //return target.replace(new RegExp(search, "g"), replacement);
  // Also Valid:
  return target.split(search).join(replacement);
};


//filterNewlines should also get rid of commas...
var filterNewlines = function(s) {
  if (typeof s != "string") {
    // can only be a number... or maybe object ID, but that isn't that big of a concern..
    if (typeof s == "undefined") {
      s = "";
    }
    else if (s == null) {
      s = "";
    }
    else if (typeof s == "number") {
      s = s.toString();
    }
  }
  s = replaceAll(s, "\n", "");
  return replaceAll(s, ",", "");
};

var headers_written = false;

// TODO: eventually find a way to erase android_gaming.csv before starting to write to it...
// but for now, deleting/renaming it before running this program should be fine O:)

var write = function() {
  // HEADERS

  if (!headers_written)
  {
    fs.appendFileSync(file, "app_id");
    for (var i = 1; i < fields.length; i++){
      fs.appendFileSync(file, "," + fields[i]);
    }
    fs.appendFileSync(file, "\n");
    headers_written = true;
  }

  // ROWS

  Object.keys(results).forEach(function(key) {
    var value = results[key]["value"];
    fs.appendFileSync(file, value["app_id"]);
    for (var i = 1; i < fields.length; i++) {
      fs.appendFileSync(file, "," + filterNewlines(value[fields[i]]));
    }
    fs.appendFileSync(file, "\n");
  });


};




MongoClient.connect("mongodb://" + stanforddb.url + "/google_play", function(err, db) {
  if (err) {
    console.log("cannot connect");
    throw err;
  }

  console.log("connected to database");
  android = db.collection("main_sql");

  //var cursor = android.find({"category":"Entertainment"});
  var cursor = android.find({});

  count = 0;

  cursor.each(function(err, doc) {
    count++;
    if (count % 1000 == 0) {
      console.log(count);
    }

    //need to free memory every once in a while..
    if (count % 100000 == 0) {
      write();
      results = {};
    }

    if (err) {
      console.log("ERROR");
      db.close();
      throw err;
    }
    if (doc == null) {
      console.log("\n\ndone\n\n");
      write();
      console.log("written to csv file: " + file);
      db.close();
      return;
    }


    var newID = doc["app_id"];
//    var newTimestamp = calculateDate(doc["reportdate"]);


// for android_gaming_all.csv , just take one instance of each app. Doesn't necessarily need to be the earliest.

    if (newID in appIDs) {
//      if (newTimestamp < results[newID]["timestamp"]) {
//        results[newID]["timestamp"] = newTimestamp;
//        results[newID]["value"] = doc;
//      }
    }
    else {
      appIDs.push(newID);
      results[newID] = {};
//      results[newID]["timestamp"] = newTimestamp;
      results[newID]["value"] = doc;
    }

//    //print EVERYTHING!!
//    results[count] = {};
//    results[count]["value"] = doc;
  });

});




