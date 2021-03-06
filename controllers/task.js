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
	, FacebookStrategy = require('passport-facebook').Strategy;
	
var db;

exports.getDb = function(_db){
	db = _db;
}

exports.add = function(req, res) {
  if(req.user){
    db.collection('tasks', function(err, collection){
      if(err){
        console.log(err);
        res.send('failed');
      }
      collection.insert({task: req.body.task, 
        project: req.body.projectIdentifier, 
        creator: ObjectID(req.user._id.toString()),
        dateCreated: new Date(),
        completed: false,
        upvotes: 0,
        downvotes: 0
      },
        function(err, doc){console.log(doc);res.send(doc);});
      
    });
  }
  else{
    res.send("not logged in");
  }
}

exports.getOne= function(req, res){

}

exports.getAll = function(req, res){
  if(req.user){
    if(req.query){
      console.log(req.query);
      db.collection('tasks', function(err, collection){
        if(req.query.project){
        collection.find({project: req.query.project}, 
          {limit: 10, skip: req.query.page *10, sort:[['dateCreated', -1]]}, 
          function(err, cursor){
          if(err){
            res.send('failed')
          }else{
            cursor.toArray(function(err, documents){
              res.json(documents)
            });
          }
        });
      }
      else if(req.query._id){
          collection.find({_id: ObjectID(req.query._id.toString())}, 
          {limit: 1}, 
          function(err, cursor){
          if(err){
            res.send('failed')
          }else{
            cursor.toArray(function(err, documents){
              res.json(documents)
            });
          }
      });
    }
  });
    }
    else res.send("lol");
  }
  else res.send("not logged in");
}


exports.del = function(req, res) {
  if(req.user){
    db.collection('tasks', function(err, col){
      col.remove({_id: ObjectID(req.params.id)}, {w: 1, single: true}, function(err, num){
        assert.equal(null, err);
        assert.equal(1, num);
        res.send(undefined);
      });
    });
  }
  else{
    res.redirect('/');
  }
}

exports.update = function(req, res){
  if(req.user){
    if(req.body.updateType =='upvote'){
      db.collection('ideas', function(err, collection){
        collection.findOne({_id: ObjectID(req.body.projectId)}, function(err, doc){
          if(err){
            res.send('failed');
          }
          else if(doc){
            collection.findAndModify({_id: doc._id},
              [['_id','asc']],
              {$set: {upvotes: doc.upvotes + 1}},
              function(err, object){
                if(err) console.log(err.message);
                else{
                  res.send(object);
                }
              });
          }
        });
      });
    }
    else if(req.body.updateType =='downvote'){
      db.collection('ideas', function(err, collection){
        collection.findOne({_id: ObjectID(req.body.projectId)}, function(err, doc){
          if(err){
            res.send('failed');
          }
          else if(doc){
            collection.findAndModify({_id: doc._id},
              [['_id','asc']],
              {$set: {upvotes: doc.upvotes - 1}},
              function(err, object){
                if(err) console.log(err.message);
                else{
                  res.send(object);
                }
              });
          }
        });
      });
    }
    else if(req.body.updateType =='complete'){
      db.collection('ideas', function(err, collection){
        collection.findOne({_id: ObjectID(req.body.projectId)}, function(err, doc){
          if(err){
            res.send('failed');
          }
          else if(doc){
            collection.findAndModify({_id: doc._id},
              [['_id','asc']],
              {$set: {completed: true}},
              function(err, object){
                if(err) console.log(err.message);
                else{
                  res.send(object);
                }
              });
          }
        });
      });
    }
  }
}

exports.finish = function(req, res){

}
