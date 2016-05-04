module.exports = function (app, options) {

  /*  This is where the API endpoint strings are defined.
      For example we concatonate endpoint.version + endpont.base + endpoint.ping
      to get the endpoint http://{host}:{port}/v1/stripe/ping (host/port being either localhost, 
      the IP of the API, or the web endpoint url)
  */
  var endpoint = {
    version: '/v1',
    base: '/stripe',
    ping: '/ping',
    oauth: '/oauth',
    account: '/account',     
    balance: '/balance',               
    charge: '/charge',                         
    history: '/history',                         
    cards: '/cards',                         
    coupons: '/coupons',                         
    customers: '/customers',                         
    events: '/events',             
    invoices: '/invoices',             
    products: '/products',             
    plans: '/plans',             
    recipients: '/recipients',             
    skus: '/skus',             
    tokens: '/tokens',             
    bitcoin: '/bitcoin',  
    external: '/external'                  
  };

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here https://dashboard.stripe.com/account/apikeys
  /* 
      Here we configure the setup of the endpoint, the most part important being
      userController which allows us to utilize our User object functions such as getUser
      as well as things like cors and bodyParser which makes handling JSON requests easier
  */
  var userController = require('../auth/controllers/user-controller');
  var secrets = require('../auth/config/secrets');
  var options = secrets.stripeOptions;
  var log4js = require('log4js');
  var logger = log4js.getLogger();
  var cors = require('cors');
  var bodyParser = require('body-parser');
  var expressValidator = require('express-validator');
  app.use(cors());
  app.use(bodyParser.json());
  app.use(expressValidator());

  // Sets up our personal stripe with our own API key, not a delegated stripe account
  var stripe = require("stripe")(options.apiKey);

  /*
   |--------------------------------------------------------------------------
   | Stripe OAuth
   |--------------------------------------------------------------------------
   */  
  var TOKEN_URI = 'https://connect.stripe.com/oauth/token';
  var AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';
  // var CLIENT_ID = process.env.STRIPE_CLIENT_ID;
  // var API_KEY = process.env.STRIPE_KEY;
  var qs = require('querystring');
  var request = require('request');

  // Configure our personal Stripe keys based on DEV or PROD environment
  // TODO: Eventually configure this for our delegated requests as well
  process.env.ENVIRONMENT == 'DEV' || process.env.ENVIRONMENT == undefined ? CLIENT_ID = process.env.STRIPE_TEST_CLIENT_ID : '';
  process.env.ENVIRONMENT == 'PROD' ? CLIENT_ID = process.env.STRIPE_CLIENT_ID : '';

  process.env.ENVIRONMENT == 'DEV' || process.env.ENVIRONMENT == undefined ? stripeApiKey = process.env.STRIPE_TEST_KEY : '';
  process.env.ENVIRONMENT == 'DEV' || process.env.ENVIRONMENT == undefined ? stripePublishableKey = process.env.STRIPE_TEST_PUB_KEY : '';
  process.env.ENVIRONMENT == 'PROD' ? stripeApiKey = process.env.STRIPE_KEY : '';
  process.env.ENVIRONMENT == 'PROD' ? stripePublishableKey = process.env.STRIPE_PUB_KEY : '';

  // /v1/stripe/oauth/callback
  app.get(endpoint.version + endpoint.base + endpoint.oauth + '/callback', userController.authorize, function(req, res) {
    var code = req.query.code;
    // console.log('received code', code);
    // Make /oauth/token endpoint POST request
    request.post({
      url: TOKEN_URI,
      form: {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code: code,
        client_secret: stripeApiKey
      }
    }, function(err, r, body) {
      
      var accessToken = JSON.parse(body).access_token;
      // console.log(body);
      // Do something with your accessToken

      res.send({ 'stripeToken': accessToken, 'stripeData':body });
      
    });
  });



  /* 
      This is an example charge endpoint, currently it is under development as we use test values
      such as "usd" to denote currency and a static value of 100 ($1.00) which will eventually
      be made into a request variable such as req.body.amount and req.body.currency.

      EXAMPLE REQUEST
      curl -X POST \
      -H "Content-Type: application/json" \
      -u sk_test_jqQvmd0K1WbTSgP25zIgIWyp: \
      -d '{"customer":"cus_80JM7yd0HXslf6", "amount": 54322, "currency": "usd"}' \
         http://192.168.1.232:5001/v1/stripe/charge

      // To use this example change the request url to your own IP and keep the port the same
  */
  app.post(endpoint.version + endpoint.base + endpoint.charge, function(req, res, next) {
    logger.trace('example charge request received');
    var stripeToken = req.body.stripeToken;
    var amount = req.body.amount;
    var currency = req.body.currency;
    var customer = req.body.customer;
    var source = req.body.token;
    logger.debug('source is ', source)
    var chargeObject = {
        source: source,
        amount: "100", // amount in cents, again
        currency: "usd",
        customer: customer
    }

    logger.debug('example charge object is', chargeObject)
    stripe.charges.create(chargeObject).then(function(charge) {
        logger.info("charge success", charge);
        return res.json({msg: "success", charge: charge})
    }, function(err) {
        logger.error(err);
        return res.json({msg: err})
    });
  })

  // TODO: Reinforce API
  // ACCOUNT
  app.get(endpoint.version + endpoint.base + endpoint.account, function(req, res, next) {
      var accountId = req.body.accountId;
      stripe.account.retrieve(accountId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.account, function(req, res, next) {
      stripe.account.create([params]).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  }); 
  app.get(endpoint.version + endpoint.base + endpoint.account, function(req, res, next) {
      stripe.account.list([params]).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  }); 
  app.put(endpoint.version + endpoint.base + endpoint.account, function(req, res, next) {
      stripe.account.update([params]).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  
  // EXTERNAL ACCOUNTS
  // Endpoint /v1/stripe/account/cards
  app.post(endpoint.version + endpoint.base + endpoint.account + endpoint.cards, function(req, res, next) {
      logger.trace("request received | add account external card")
      var accountId = req.body.accountId;
      var cardObject = {
        card: {
          "number": req.body.number,
          "exp_month": req.body.exp_month,
          "exp_year": req.body.exp_year,
          "cvc": req.body.cvc,
          "currency": "usd"
        }
      };
      // logger.debug(cardObject);
      // logger.debug(accountId);
      // logger.debug("debugging");

      if(accountId == "" || accountId == null || accountId == undefined) {
        logger.error("no accountId specified");
        return res.json({msg:"no accountId specified"}).end();
      }
      // First create a tokenized card based on the request
      stripe.tokens.create(cardObject, function(err, token) {
          logger.debug(token);
          // asynchronously called
          if(err) {
            logger.error(err);
            next();
          }
          var tokenObj = {
            external_account: token.id
          }
          // Then add the source to Stripe using the token
          stripe.accounts.createExternalAccount(accountId, tokenObj, function(err, card) {
              // asynchronously called
              if(err) {
                logger.error(err);
                next();
              }
              return res.json({msg:"card added!"}).end();
            }
          );          
      });
  });   

  app.post(endpoint.version + endpoint.base + endpoint.account + endpoint.cards + "/list/", function(req, res, next) {
      logger.trace("request received | get credit card");
      var accountId = req.body.accountId;
      stripe.accounts.listExternalAccounts(accountId, {object: "card"}, function(err, cards) {
        if(err) {
          logger.error(err);
          next();
        }
        return res.json({cards:cards}).end();
      });
  });   

  // BALANCE
  app.post(endpoint.version + endpoint.base + endpoint.balance, userController.authorize, function(req, res, next) {
      logger.trace("retrieve balance called")
      logger.debug(req.body)
      userController.getUser(req.body.userId).then(function (user) {
        logger.trace("user found, retrieving balance")
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.balance.retrieve().then(function(balance) {
            // logger.info(balance)
            res.json({balance:balance})
        }, function(err) {
            logger.error(err)
            return res.json({msg: "error", err: err}).end();
        })
      })   
  });  
  app.get(endpoint.version + endpoint.base + endpoint.balance, function(req, res, next) {
      logger.info("list transaction balance called")
      var params = {"foo": "bar"}
      stripe.balance.listTransactions(params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  }); 
  app.get(endpoint.version + endpoint.base + endpoint.balance, function(req, res, next) {
      logger.info("retrieve single transaction balance called")
      var transactionId = req.body.transactionId;
      stripe.balance.retrieveTransaction(transactionId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });

  // CHARGES
  // Endpoint: /v1/stripe/charges/create
  /* 
      This is our delegated charge endpoint, it is where we make requests on behalf
      of our users to get paid by a charge.  In order to utilize this API endpoint a 
      credit card token must be sent with the request, this is done on the UI layer
      and is possible to replicate using Stripe's generated card token on their 
      API documentation (i.e. tok_17xfeeBtUid5FqMrknGVLq2k) and can be found here
      https://stripe.com/docs/api#create_charge.

      In order to create the charge we get the user in our database by the requested
      username, and get that User's stripe secret key accordingly.  We then make the 
      delegated request on behalf of that user to Stripe, and that user is then credited
      the amount specified by the customer on the app.

      For now we are utilizing static values of amount, currency, and description.  We utilize
      Apple Pay on the UI to generate the card token, and that is implemented here
      in req.body.token.

      After the parameters are set we create the charge using the params object, and respond
      with the charge in the response and send that back as JSON.  If there is an error we
      log the error.
  */
  app.post(endpoint.version + endpoint.base + endpoint.charge + "/create", function(req, res, next) {
      // TODO
      // Create a request to charge
      // If the charge is approved proceed with the charge request

      // Flow
      // Create a charge with the credit card token
      // Find the user in the database
      // Make a delegated request on behalf of the user
      logger.debug(req.body);
      logger.debug("got the request")
      userController.getDelegatedUserByUsername(req.body.delegatedUser).then(function (delegateUser) {
        logger.trace("inside delegate user, setting info for user " + delegateUser.username)
        var stripe = require('stripe')(delegateUser.stripe.secretKey);
        var params = {
          amount: "100",
          currency: "usd",
          source: req.body.token,
          description: "Testing charge"
        }

        // Charge a card based on customer ID, the customer must have a linked credit card

        stripe.charges.create(params).then(function(charge, err) {
            // logger.info(res)
            res.json({msg: "success", charge: charge}).end();
        }, function(err) {
            logger.error(err)
            res.json({msg: "error", err: err}).end();
        })
      }) 
  });
  app.get(endpoint.version + endpoint.base + endpoint.charge, function(req, res, next) {
      var params = {"foo": "bar"}
      stripe.charges.list([params]).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.put(endpoint.version + endpoint.base + endpoint.charge, function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.charges.retrieve(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.get(endpoint.version + endpoint.base + endpoint.charge, function(req, res, next) {
      var params = {"foo": "bar"};
      var chargeId = req.body.chargeId;
      stripe.charges.capture(chargeId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.charge + "/refund", function(req, res, next) {
      var params = {"foo": "bar"};
      var chargeId = req.body.chargeId;
      stripe.charges.refund(chargeId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.put(endpoint.version + endpoint.base + endpoint.charge, function(req, res, next) {
      var params = {"foo": "bar"};
      var chargeId = req.body.chargeId;
      stripe.charges.update(chargeId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.charge + "/dispute/close", function(req, res, next) {
      var params = {"foo": "bar"};
      var chargeId = req.body.chargeId;
      stripe.charges.closeDispute(chargeId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.charge + "/meta", function(req, res, next) {
      var params = {"foo": "bar"};
      var chargeId = req.body.chargeId;
      stripe.charges.setMetadata(chargeId, metadataObject).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.get(endpoint.version + endpoint.base + endpoint.charge + "/meta", function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.charges.getMetadata(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.charge + "/mark/safe", function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.charges.markAsSafe(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.charge + "/mark/fraud", function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.charges.markAsFraudulent(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });

  // COUPONS
  app.post(endpoint.version + endpoint.base + endpoint.coupons, function(req, res, next) {
      var params = {"foo": "bar"};
      stripe.coupons.create(params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.coupons, function(req, res, next) {
      var params = {"foo": "bar"};
      stripe.coupons.list([params]).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.coupons, function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.coupons.retrieve(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.coupons, function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.coupons.del(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });


  // CUSTOMERS

  /* 
      Make delegated request to create customer (become customer) and attach
      a token using either credit card or Apple Pay
  */
  app.post(endpoint.version + endpoint.base + endpoint.customers, function(req, res, next) {
      var params = {"foo": "bar"};
      stripe.customers.create(params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });  
  app.get(endpoint.version + endpoint.base + endpoint.customers, function(req, res, next) {
      var params = {"foo": "bar"};
      stripe.customers.list(params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.put(endpoint.version + endpoint.base + endpoint.customers, function(req, res, next) {
      var params = {"foo": "bar"};
      var customerId = req.body.customerId;
      stripe.customers.update(customerId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });  
  app.get(endpoint.version + endpoint.base + endpoint.customers, function(req, res, next) {
      var customerId = req.body.customerId;
      stripe.customers.retrieve(customerId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.delete(endpoint.version + endpoint.base + endpoint.customers, function(req, res, next) {
      var customerId = req.body.customerId;
      stripe.customers.del(customerId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });          
  app.post(endpoint.version + endpoint.base + endpoint.customers, function(req, res, next) {
      var customerId = req.body.customerId;
      var metadataObject = req.body.metadataObject;
      stripe.customers.setMetadata(customerId, metadataObject).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });         
  app.get(endpoint.version + endpoint.base + endpoint.customers, function(req, res, next) {
      var customerId = req.body.customerId;
      stripe.customers.getMetadata(customerId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });        

  // SUBSCRIPTIONS
  app.post(endpoint.version + endpoint.base + endpoint.subscriptions, function(req, res, next) {
      var params = {"foo": "bar"};
      var customerId = req.body.customerId;
      stripe.subscriptions.createSubscription(customerId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.put(endpoint.version + endpoint.base + endpoint.subscriptions, function(req, res, next) {
      var params = {"foo": "bar"};
      var customerId = req.body.customerId;
      var subscriptionId = req.body.subscriptionId;
        stripe.subscriptions.updateSubscription(customerId, subscriptionId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.post(endpoint.version + endpoint.base + endpoint.subscriptions, function(req, res, next) {
      var params = {"foo": "bar"};
      var customerId = req.body.customerId;
      var subscriptionId = req.body.subscriptionId;
      stripe.subscriptions.cancelSubscription(customerId, subscriptionId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.get(endpoint.version + endpoint.base + endpoint.subscriptions, function(req, res, next) {
      var params = {"foo": "bar"};
      stripe.subscriptions.listSubscriptions(params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.get(endpoint.version + endpoint.base + endpoint.subscriptions, function(req, res, next) {
      var customerId = req.body.customerId;
      var subscriptionId = req.body.subscriptionId;
      stripe.subscriptions.retrieveSubscription(customerId, subscriptionId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   

  // CARDS
  app.post(endpoint.version + endpoint.base + endpoint.cards, function(req, res, next) {
      var params = {"foo": "bar"};
      var customerId = req.body.customerId;
      stripe.cards.createSource(customerId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.get(endpoint.version + endpoint.base + endpoint.cards, function(req, res, next) {
      var customerId = req.body.customerId;
      stripe.cards.listCards(customerId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.get(endpoint.version + endpoint.base + endpoint.cards, function(req, res, next) {
      var customerId = req.body.customerId;
      var cardId = req.body.cardId;
      stripe.cards.retrieveCard(customerId, cardId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.put(endpoint.version + endpoint.base + endpoint.cards, function(req, res, next) {
      var params = {"foo": "bar"};
      var customerId = req.body.customerId;
      var cardId = req.body.cardId;
      stripe.cards.updateCard(customerId, cardId, params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.delete(endpoint.version + endpoint.base + endpoint.cards, function(req, res, next) {
      var customerId = req.body.customerId;
      var cardId = req.body.cardId;
      stripe.cards.deleteCard(customerId, cardId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });   
  app.delete(endpoint.version + endpoint.base + endpoint.cards, function(req, res, next) {
      var customerId = req.body.customerId;
      stripe.cards.deleteDiscount(customerId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });     

  // HISTORY
  app.post(endpoint.version + endpoint.base + endpoint.history, userController.authorize, function(req, res, next) {
      logger.debug(req.body);
      logger.debug("received history request");
      userController.getUser(req.body.userId).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var limit = req.body.limit
        stripe.balance.listTransactions({ limit: limit }, function(err, transactions) {
          if(err) {
            logger.error(err)
          }
          // logger.info(transactions)
          res.json({transactions:transactions})
          // asynchronously called
        });
      })       
  });   

  // // EVENTS (types of events)
  /*
      Get user events and display in notiications list
  */
  // stripe.events.list([params])
  app.post(endpoint.version + endpoint.base + endpoint.events, userController.authorize, function(req, res, next) {
      logger.debug(req.body);
      logger.debug("received event request");
      userController.getUser(req.body.userId).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var limit = req.body.limit
        stripe.events.list(
          { limit: limit },
          function(err, events) {
            if(err) {
              logger.error(err)
            }
            // asynchronously called
            res.json({events:events})
        });
      })       
  }); 
  // stripe.events.retrieve(eventId)

  // // INVOICEITEMS (resource invoiceItems)
  // stripe.invoiceItems.create(params)
  // stripe.invoiceItems.list([params])
  // stripe.invoiceItems.update(invoiceItemId[, params])
  // stripe.invoiceItems.retrieve(invoiceItemId)
  // stripe.invoiceItems.del(invoiceItemId)

  // // INVOICES
  // stripe.invoices.create(params)
  // stripe.invoices.list([params])
  // stripe.invoices.update(invoiceId[, params])
  // stripe.invoices.retrieve(invoiceId)
  // stripe.invoices.retrieveLines(invoiceId)
  // stripe.invoices.retrieveUpcoming(customerId[, params])
  // stripe.invoices.pay(invoiceId)

  // // PLANS
  // stripe.plans.create(params)
  // stripe.plans.list([params])
  // stripe.plans.update(planId[, params])
  // stripe.plans.retrieve(planId)
  // stripe.plans.del(planId)

  // // PRODUCTS
  // stripe.products.create(params)
  // stripe.products.list([params])
  // stripe.products.update(productId[, params])
  // stripe.products.retrieve(productId)
  // stripe.products.del(productId)

  // // RECIPIENTS
  // stripe.recipients.create(params)
  // stripe.recipients.list([params])
  // stripe.recipients.update(recipientId[, params])
  // stripe.recipients.retrieve(recipientId)
  // stripe.recipients.del(recipientId)
  // stripe.recipients.setMetadata(recipientId, metadataObject) (metadata info)
  // stripe.recipients.setMetadata(recipientId, key, value)
  // stripe.recipients.getMetadata(recipientId)

  // // SKUS
  // stripe.skus.create(params)
  // stripe.skus.list([params])
  // stripe.skus.update(skuId[, params])
  // stripe.skus.retrieve(skuId)
  // stripe.skus.del(skuId)

  // // TOKENS
  // stripe.tokens.create(params)
  // stripe.tokens.retrieve(tokenId)

  // // TRANSFERS
  // stripe.transfers.create(params)
  // stripe.transfers.list([params])
  // stripe.transfers.retrieve(transferId)
  // stripe.transfers.update(transferId[, params])
  // stripe.transfers.reverse(transferId[, params])
  // stripe.transfers.cancel(transferId) (Deprecated -- use reverse)
  // stripe.transfers.listTransactions(transferId[, params])
  // stripe.transfers.setMetadata(transferId, metadataObject) (metadata info)
  // stripe.transfers.setMetadata(transferId, key, value)
  // stripe.transfers.getMetadata(transferId)

  // // BITCOIN (resource bitcoinReceivers)
  // stripe.bitcoinReceivers.create(params)
  // stripe.bitcoinReceivers.retrieve(receiverId)
  // stripe.bitcoinReceivers.list([params])
  // stripe.bitcoinReceivers.getMetadata(receiverId)
}