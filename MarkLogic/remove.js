var marklogic = require("marklogic");
var my = require("./my-connection.js");

// MarkLogic db
var mldb = marklogic.createDatabaseClient(my.connInfo);
var q = marklogic.queryBuilder;

var count = 0;

mldb.documents.query(
	q.where(
		q.collection("ios_reviews")
	)
).result(function(documents) {
	documents.forEach(function(document) {
		mldb.documents.remove(document["uri"]).result(function(response) {
			count++;
			console.log(count);
		});
	});
});

// do MarkLogic queries only return things in batches of 10???