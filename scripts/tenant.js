/*
 * Copyright (c) 2016 Argent Technologies, LLC.
 *
 * Written with: mongodb@2.1.3
 * A Node script connecting to a MongoDB database given a MongoDB Connection URI.
*/

  var mongodb = require('mongodb');
  var utils = require('../api/utils/utils')


  // Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname

  // var uri = 'mongodb://<dbuser>:<dbpassword>@ds011024.mlab.com:11024/ag-dev'; // similar scheme in production
  // var uri = 'mongodb://localhost:27017/<localdb>';
  var uri = 'mongodb://localhost:27017/praxicorp';

  mongodb.MongoClient.connect(uri, function(err, db) {
    
    if(err) throw err;
    
    /*
     * First we'll add a few users. Nothing is required to create the 
     * users collection; it is created automatically when we insert.
     */

    var users = db.collection('users');

    // Note that the insert method can take either an array or a dict.

    users.find({}).toArray(function (err, docs) {

      if(err) throw err;

      docs.forEach(function (doc) {

        var tid = utils.randomString(32);

        users.update({ _id: doc._id }, 
          { $set: { tenant_id: 'tid_' + tid } },
          { multi: true },
          function (err, result) {

            if(err) throw err;

          }
        );    
      });

      // Only close the connection when the app is terminating.
      db.close(function (err) {
        if(err) throw err;
      });

    });

});
