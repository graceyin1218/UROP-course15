var marklogic = require("marklogic");
var my = require("./my-connection.js");
var stanforddb = require("../stanford-db.js");
var https = require("https");

var MongoClient = require("mongodb").MongoClient;

var cursor_count;
var insert_count;

// MarkLogic db
var mldb = marklogic.createDatabaseClient(my.connInfo);

var addToMarkLogic = function(doc) {
  // doc = [doc];
  mldb.documents.write(
  {
    uri: "/" + doc.app_id + ".json",
    contentType: "application/json",
    collections: ["ios_reviews"],
    content: doc
  })

  // doc.map(function(item) {
  //   return {
  //     uri: "/" + item.app_id + ".json",
  //     contentType: "application/json",
  //     collections: ["test-collection"],
  //     content: item
  //   }
  // });
};



MongoClient.connect("mongodb://" + stanforddb.url + "/apple_ios", function(err, db)
{
  if (err) {
    console.log("cannot connect");
    throw err;
  }

  console.log("connected to MongoDB database");
  ios = db.collection("main");
  var cursor = ios.find({$and: [{"categories":"Family"}, {"categories":"Games"}, {"languages":{$regex: "English"}}, {"hasInAppPurchases":{$exists: true}}]}).limit(2000); //, {"app_id": 1, "app_name":1, "categories":1, "languages":1, }).limit(10);

  cursor_count = 0;
  insert_count = 0;

  cursor.each(function(err, doc) {
    cursor_count++;
    if (cursor_count%100 == 0) {
      console.log("cursor count: " + cursor_count);
      console.log("insert count: " + insert_count);
      console.log();
    }

    if (err) {
      console.log("ERROR");
      db.close();
      throw err;
    }
    if (doc == null) {
      console.log("\n\ndone\n\n");

      //get this to print something useful

      db.close();
      return;
    }

    //won't work beyond 10 documents from itunes.
    //perhaps there is a limit as to how often we can spam itunes..
    setTimeout(function() {


    https.get("https://itunes.apple.com/us/rss/customerreviews/id=" + doc["app_id"] + "/sortBy=mostRecent/json", function(res) {
      res.setEncoding("utf8");
      var body = "";
      res.on("data", function(chunk) {
        body += chunk;
      });
      res.on("end", function() {
        // if (body == null || body == "")
        // {
        //   return;
        // }

        body = JSON.parse(body);

        if (!("entry" in body["feed"])){
          console.log("no reviews for app id " + doc["app_id"]);
          console.log();
          return;
        }

        insert_count++;

        //get app info

        var app = body["feed"]["entry"][0];
        var app_id = app["id"]["attributes"]["im:id"];
        var app_name = app["im:name"]["label"];

        var price = app["im:price"]["attributes"]["amount"];
        var currency = app["im:price"]["attributes"]["currency"];
        // console.log("App:");
        console.log("inserted " + app_id + "\n");
//        console.log(app_name);
        // console.log(app["im:price"]["attributes"]["amount"]);
        // console.log(app["im:price"]["attributes"]["currency"]);

//        console.log("\n");

        var mlentry = {
//          "uri": "/" + app_id + ".json",
          "app_name": app_name,
          "app_id": app_id,
          "price": price,
          "currency": currency,
          "timestamp": doc["timestamp"],
          "hasInAppPurchases": doc["hasInAppPurchases"],
          "supportsPassbook": doc["supportsPassbook"],
          "isGameCenter": doc["isGameCenter"],
          "reviews": []
        };

        //get reviews
        // console.log("Reviews:");
        for(var i = 1; i < body["feed"]["entry"].length; i++){
          var review = body["feed"]["entry"][i];

          var item = {
            "review_id": review["id"]["label"],
            "app_version": review["im:version"]["label"],
            "rating": review["im:rating"]["label"],
            "review_title": review["title"]["label"],
            "review_content": review["content"]["label"]
          };
          mlentry["reviews"].push(item);
//           console.log(review["id"]["label"]);
//           console.log(review["im:version"]["label"]);
//           console.log(review["im:rating"]["label"]);
//           console.log(review["title"]["label"]);
//           console.log(review["content"]["label"]);
// //          console.log(review["link"]["attributes"]["href"]);

//           console.log("\n");
        }

        addToMarkLogic(mlentry);

        return;
      });
    }).on("error", function(e) {
      console.log("Error");
      console.log(e);
    });

//from setTimeout
  }, 1000);

  });
});


process.on("exit", function() {
  console.log("DONE\n");
  console.log("viewed " + (cursor_count-1) + " documents");
  console.log("inserted " + insert_count + " documents");
  console.log();
});

process.on("SIGINT", function() {
  console.log("Interrupted\n");
  process.exit();
})

// NOTE:
// cursor will return 4,396,428 documents.

