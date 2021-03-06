var Db = require('mongodb').Db
  , MongoClient = require('mongodb').MongoClient
  , Server = require('mongodb').Server
  , ReplSetServers = require('mongodb').ReplSetServers
  , ObjectID = require('mongodb').ObjectID
  , Binary = require('mongodb').Binary
  , GridStore = require('mongodb').GridStore
  , Grid = require('mongodb').Grid
  , Code = require('mongodb').Code
  , BSON = require('mongodb').pure().BSON
  , assert = require('assert')
  , bcrypt = require('bcrypt')
	, LocalStrategy = require('passport-local').LocalStrategy
	, FacebookStrategy = require('passport-facebook').Strategy
	, _ = require('underscore')
	, $ = require('jquery').create();

var db;

exports.getDb = function(_db){
	db = _db;
}

// Get individual project or if query string, get project matches
exports.get = function(req, res){

	if(req.user){
		if(req.query){
			console.log(req.query);
			db.collection('projects', function(err, collection){
				if(req.query == {} || !req.query){
					//no query
					collection.find({}, function(err, cursor){
						cursor.toArray(function(err, documents){
							console.log(documents);
							res.json(documents);
						})
					});
				}
				else if(req.query.page){
					//more pages
					console.log(req.query.page);
					var limit = 10;
					var skip = (req.query.page - 1) * 10;
					delete req.query.page;
					collection.find(req.query, {limit: limit, skip: skip}, function(err, cursor){
					cursor.toArray(function(err, documents){
						res.json(documents);
					});
				});
				}
				else{
					var limit = req.query.page ? req.query.page*10 : 2;
					if(req.query._id){
						//just one
						//req.query._id = ObjectID(req.query._id);
						console.log(req.query._id);
						collection.find({_id: ObjectID(req.query._id.toString())}, {limit: 1}, function(err, cursor){
							cursor.toArray(function(err, documents){
								//console.log("lol");
								//console.log(documents);
								res.json(documents);
							});
						});
					}
					else{
						//explore 1st page
						collection.find(req.query, {limit: limit}, function(err, cursor){
						cursor.toArray(function(err, documents){
							//console.log("lols");
							//console.log(documents);
							res.json(documents);
						});
						});
					}
				}
			});

		}
		else{
			db.collection('projects', function(err, collection){
				collection.findOne({name: req.body.identifier}, function(err, doc){
					if(err){
						res.send('failed');
					}
					else if(doc == null){
						res.send('no project');
					}
					else if(doc){
						res.send(doc);
					}
				});
			});
		}
	}
	else{
    	res.send("not logged in");
  	}
} 

// Open (Create) a new project idea
exports.create = function(req, res) {
	if(req.user){
		db.collection('projects', function(err, collection){
			collection.findOne({identifier: req.body.identifier}, function(err, doc){
				if(err){
					res.send('failed');
				}
				if(doc == null){
					collection.insert({name:  req.body.name, 
																		identifier: req.body.identifier,
																		category: req.body.category,
																		idea: req.body.idea,
																		originator: req.user._id,
																		dateCreated: new Date(),
																		members: [],
																		upvotes: 0,
																		downvotes: 0
																		},
														{safe: true},
														function(err, doc){ console.log(doc); res.send(doc); }); 

				}
				else if(doc){
					console.log('project exists');
					res.redirect('/');
				}
			});
		});
	}
	else {
		res.send("not logged in");
	}
}


exports.del = function(req, res){
	if(req.user){
		db.collection('projects', function(err, collection){
			collection.remove({identifier: req.body.identifier}, {single: true}, function(err, item){
				res.redirect('/');
			});
		});
	}
	else{
		res.redirect('/');
	}
}

exports.update = function(req, res){
	if(req.user){
		if(req.body.updateType == 'join'){
			db.collection('projects', function(err, collection){
				collection.findOne({_id: ObjectID(req.body.projectId)}, function(err, doc){
					if(err){
						res.send('failed');
					}
					if(doc){

						//console.log(_.indexOf(doc.members, req.user._id));
						//if no members yet.
						if(!doc.members){
							console.log("this shouldn't happen");
							res.send("failed");
						}
						//if members
						else if(typeof doc.members != 'undefined' && _.indexOf(doc.members, req.user._id) == -1){
							doc.members.push(ObjectID(req.user._id.toString()));
							var newMembers = doc.members;
							collection.findAndModify({_id: ObjectID(doc._id.toString())}, 
								[['_id','asc']], 
								{$set: {members: newMembers}}, 
								{new: true},
								function(err, object){
									if(err) console.log(err.message);
									else{
										res.send(object);
										db.collection('users', function(err, userCollection){
											userCollection.findOne({_id: req.user._id}, function(err, userDoc){
												console.log("ppp");
												console.log(userDoc);
												if(err){
													res.send('failed');
												}
												else if(userDoc){
													if(typeof userDoc.projects == 'undefined'){
														userCollection.findAndModify({_id: ObjectID(userDoc._id.toString())}, 
															[['_id','asc']], 
															{$set: {projects: [ObjectID(req.body.projectId.toString())]}}, 
															{new: true}, 
															function(err, record){
															console.log("haha" + record.projects);
														});
													}
													else if(typeof userDoc.projects != 'undefined' && _.indexOf(userDoc.projects, req.body.projectId) == -1){
														userDoc.projects.push(ObjectID(req.body.projectId));
														var newProjects = userDoc.projects;
														userCollection.findAndModify({_id: ObjectID(userDoc._id.toString())}, [['_id','asc']], {$set: {projects: newProjects}}, function(err, record){
															console.log("hahas" + record.projects);
														});
													}
													else{
														res.send('failed');
													}
												}
											})
										});
									}
								}
							);

						}
					
						else if(_.indexOf(doc.members, req.user._id) != -1){
							console.log('4');
							res.send('already joined');
						}
					}
				});
			});
		}
	}
}
// Search for projects
exports.projects = function(req, res){

}

// More projects in search --- ajax request --- json response
exports.moreProjects = function(req, res){

}
