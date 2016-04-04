var marklogic = require("marklogic");
var my = require("./my-connection.js");

// MarkLogic db
var mldb = marklogic.createDatabaseClient(my.connInfo);
var q = marklogic.queryBuilder;

mldb.documents.query(
	q.where(
		q.collection("ios_reviews")
	)
).result(function(documents) {
	documents.forEach(function(document) {
		console.log(document);
	});
});