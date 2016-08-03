/*
 * Copyright (c) 2016 Argent Technologies, LLC.
 *
 * Written with: mongodb@2.1.3
 * A Node script connecting to a MongoDB database given a MongoDB Connection URI.
*/


var mongodb = require('mongodb');

// Create seed data

var seedData = [
  {
    "id": "sub_aosfd890asd",
    "tenant_id": "tid_soa3pomvjLTDuZj15uXVJN6NEhRNxyTT",
    "object": "subscription",
    "application_fee_percent": null,
    "cancel_at_period_end": false,
    "canceled_at": null,
    "created": 1462405921,
    "current_period_end": 1470354721,
    "current_period_start": 1467676321,
    "customer": "cus_8OMUpXvsmp2Tcu",
    "discount": null,
    "ended_at": null,
    "livemode": false,
    "metadata": {
    },
    "plan": {
      "id": "bronze-expert-302",
      "object": "plan",
      "amount": 999,
      "created": 1462405911,
      "currency": "usd",
      "interval": "month",
      "interval_count": 1,
      "livemode": false,
      "metadata": {
      },
      "name": "Bronze Expert",
      "statement_descriptor": null,
      "trial_period_days": null
    },
    "quantity": 1,
    "start": 1462405921,
    "status": "active",
    "tax_percent": null,
    "trial_end": null,
    "trial_start": null
  },
  {
    "id": "sub_0as8d9f0s8dfas",
    "tenant_id": "tid_soa3pomvjLTDuZj15uXVJN6NEhRNxyTT",
    "object": "subscription",
    "application_fee_percent": null,
    "cancel_at_period_end": false,
    "canceled_at": null,
    "created": 1462405921,
    "current_period_end": 1470354721,
    "current_period_start": 1467676321,
    "customer": "cus_8OMUpXvsmp2Tcu",
    "discount": null,
    "ended_at": null,
    "livemode": false,
    "metadata": {
    },
    "plan": {
      "id": "gold-expert-302",
      "object": "plan",
      "amount": 999,
      "created": 1462405911,
      "currency": "usd",
      "interval": "month",
      "interval_count": 1,
      "livemode": false,
      "metadata": {
      },
      "name": "Gold Expert",
      "statement_descriptor": null,
      "trial_period_days": null
    },
    "quantity": 1,
    "start": 1462405921,
    "status": "active",
    "tax_percent": null,
    "trial_end": null,
    "trial_start": null
  },
  {
    "id": "sub_8OMVmpK49XZW1n",
    "tenant_id": "tid_Rv6ii9MKYdcGxeLsPUfBFUoalqXZLrO8",
    "object": "subscription",
    "application_fee_percent": null,
    "cancel_at_period_end": false,
    "canceled_at": null,
    "created": 1462405921,
    "current_period_end": 1470354721,
    "current_period_start": 1467676321,
    "customer": "cus_8OMUpXvsmp2Tcu",
    "discount": null,
    "ended_at": null,
    "livemode": false,
    "metadata": {
    },
    "plan": {
      "id": "platinum-expert-302",
      "object": "plan",
      "amount": 999,
      "created": 1462405911,
      "currency": "usd",
      "interval": "month",
      "interval_count": 1,
      "livemode": false,
      "metadata": {
      },
      "name": "Platinum Expert",
      "statement_descriptor": null,
      "trial_period_days": null
    },
    "quantity": 1,
    "start": 1462405921,
    "status": "active",
    "tax_percent": null,
    "trial_end": null,
    "trial_start": null
  }
];

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname

// var uri = 'mongodb://user:pass@host:port/db';
// var uri = 'mongodb://localhost:27017/praxicorp';
// var uri = 'mongodb://<user>:<kakarot>@ds011024.mlab.com:11024/ag-dev'; // similar scheme in production

mongodb.MongoClient.connect(uri, function(err, db) {
  
  if(err) throw err;
  
  /*
   * First we'll add a few scribes. Nothing is required to create the 
   * scribes collection; it is created automatically when we insert.
   */

  var scribes = db.collection('scribes');

   // Note that the insert method can take either an array or a dict.

  scribes.insert(seedData, function(err, result) {
    
    if(err) throw err;

    scribes.find({}).toArray(function (err, docs) {

      if(err) throw err;

      docs.forEach(function (doc) {
        console.log('Added ', doc['id']);
      });
     
      db.close(function (err) {
        if(err) throw err;
      });
    });
  });
});
