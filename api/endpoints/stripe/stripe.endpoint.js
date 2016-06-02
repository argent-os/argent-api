module.exports = function (app, options) {

  /*  This is where the API endpoint strings are defined.
      For example we concatonate endpoint.version + endpoint.base + "/:uid" + endpoint.ping
      to get the endpoint http://{host}:{port}/v1/stripe/ping (host/port being either localhost, 
      the IP of the API, or the web endpoint url)
  */
  var endpoint = {
    version: '/v1',
    base: '/stripe',
    ping: '/ping',
    oauth: '/oauth',
    account: '/account',
    external_account: '/external_account',     
    balance: '/balance', 
    transactions: '/transactions',             
    subscriptions: '/subscriptions',             
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
    transfers: '/transfers',  
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
  var utils = require('./utils');
  var currencyFormat = require('./currencyFormat');
  var secrets = require('../auth/config/secrets');
  var options = secrets.stripeOptions;
  var log4js = require('log4js');
  var logger = log4js.getLogger();
  var cors = require('cors');
  var moment = require('moment');
  var accounting = require('accounting');
  var getSymbolFromCurrency = require('currency-symbol-map').getSymbolFromCurrency;
  var bodyParser = require('body-parser');
  var expressValidator = require('express-validator');
  app.use(cors());
  app.use(bodyParser.json());
  app.use(expressValidator());

  // Sets up our personal stripe with our own API key, not a delegated stripe account made in the RESTful requests
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
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.oauth + '/callback', userController.authorize, function(req, res) {
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
      This is an example charge endpoint, currently we use test values
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
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/example", function(req, res, next) {
    logger.trace('example charge request received');
    var stripeToken = req.body.stripeToken;
    var amount = req.body.amount;
    var currency = req.body.currency;
    var customer = req.body.customer;
    var source = req.body.token;
    logger.debug('source is ', source)
    var chargeObject = {
        source: source,
        amount: "0", // amount in cents, again
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

  // TODO: Complete API
  // ACCOUNT
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.account, function(req, res, next) {
      logger.trace("request received | get account")
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey); 
        stripe.account.retrieve(user.stripe.accountId, function(err, account) {
            // asynchronously called
            if(err) {
              logger.error(err);
            }
            res.json({account: account})
          }
        );   
      });
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.account, function(req, res, next) {
      stripe.account.create([params])
  }); 
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.account, function(req, res, next) {
      stripe.account.list([params])
  }); 
  app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.account, function(req, res, next) {
      logger.trace("request received | update stripe account")
      var user_id = req.params.uid;
      var parameters = req.body;
      logger.info(parameters)
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey); 
        stripe.account.update(user.stripe.accountId, parameters, function(err, account) {
            // asynchronously called
            if(err) {
              logger.error(err);
            }
            logger.info("updated stripe account")
            res.json({account: account})
          }
        );   
      });
  });
  
  // EXTERNAL ACCOUNTS
  // Endpoint /v1/stripe/a7sd89f7a98df/external_account?type=card
  // Endpoint /v1/stripe/a7sd89f7a98df/external_account?type=bank
  // Add credit card external account
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.external_account, function(req, res, next) {
      logger.trace("request received | add account external account")
      if(req.query.type == "card") {
        var card_obj = {
          card: {
            "number": req.body.number,
            "exp_month": req.body.exp_month,
            "exp_year": req.body.exp_year,
            "cvc": req.body.cvc,
            "currency": "usd"
          }
        };        
      }
      logger.trace("request received | add external account")
      var user_id = req.params.uid
      var token = req.body.external_account;
      userController.getUser(user_id).then(function (user) {
        // First create a tokenized card based on the request
        var stripe = require('stripe')(user.stripe.secretKey); 
        if(req.query.type == "card") {
          stripe.tokens.create(card_obj, function(err, token) {
              logger.debug(token);
              // asynchronously called
              if(err) {
                logger.error(err);
                next();
              }
              // Then add the source to Stripe using the token
              stripe.accounts.createExternalAccount(user.stripe.accountId, { external_account: token.id }, function(err, card) {
                  // asynchronously called
                  if(err) {
                    logger.error(err);
                    next();
                  }
                  return res.json({msg:"card added!"}).end();
                }
              );          
          });          
        } else {
          stripe.accounts.createExternalAccount(user.stripe.accountId, { external_account: token }, function(err, externalAccount) {
              // asynchronously called
              if(err) {
                logger.error(err);
              }
              logger.trace('done')
              res.json({msg:"external account added!", external_account: externalAccount})
            }
          );   
        }
      });
  });   

  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.external_account, function(req, res, next) {
      logger.trace("request received | list external accounts.");
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        // First create a tokenized card based on the request
        var stripe = require('stripe')(user.stripe.secretKey);  
        var acct_id = user.stripe.accountId;
        stripe.accounts.listExternalAccounts(acct_id, function(err, externalAccounts) {
          logger.trace("accounts: " + externalAccounts);
          if(err) {
            logger.error(err);
            next();
          }
          return res.json({external_accounts:externalAccounts}).end();
        });
      });
  });   


  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.external_account + "/:bank_acct_id", function(req, res, next) {
      logger.trace("request received | list external accounts.");
      var user_id = req.params.uid
      var bank_id = req.params.bank_acct_id
      userController.getUser(user_id).then(function (user) {
        // First create a tokenized card based on the request
        var stripe = require('stripe')(user.stripe.secretKey);  
        var acct_id = user.stripe.accountId;
        stripe.accounts.deleteExternalAccount(acct_id, bank_id, function(err, confirmation) {
          logger.trace("done: " + confirmation);
          if(err) {
            logger.error(err);
            next();
          }
          return res.json({ confirmation: confirmation }).end();
        });
      });
  });   

  // BALANCE
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.balance, userController.authorize, function(req, res, next) {
      logger.trace("getting user balance")      
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.balance.retrieve(function(err, balance) {
            if(err) {
                logger.error(err)
            }
            res.json({balance:balance})
        })
      })   
  });  
  // HISTORY
  // Get user balance transactions history
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.balance + endpoint.transactions, userController.authorize, function(req, res, next) {
      logger.trace("getting user transaction history")
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var limit = req.query.limit
        stripe.balance.listTransactions({ limit: limit }, function(err, transactions) {
          if(err) {
            logger.error(err)
          }
          // logger.info(transactions)
          res.json({ transactions:transactions })
          // asynchronously called

        });
      })       
  });     
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.balance + endpoint.transactions, function(req, res, next) {
      stripe.balance.retrieveTransaction(transactionId)
  });
  //
  // transaction history
  //
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.history + "/:interval", function(req, res, next) {
            logger.debug("inside")

      var user_id = req.params.uid;
      var interval = req.params.interval;
      // /v1/stripe/09s8df0a9s8d/history?interval=year&currency=usd&number=10
      var currency = req.query.currency;
      userController.getUser(user_id).then(function (user) {
        logger.debug("inside history")
        var stripe = require('stripe')(user.stripe.secretKey);
        var limit = req.query.limit || 1000;
        var number = req.query.number;
        logger.debug("stripe key is");
        logger.debug(user.stripe.stripeKey);
        stripe.balance.listTransactions({}, function(err, transactions) {
          if(err) {
            logger.error(err)
          }
          switch (interval) {
            case "year":
              numberOfYears = number;
              var yearBegin = utils.getYearBegin(number);
              var yearEnd = utils.getYearEnd(number);
              beginInterval = yearBegin;
              endInterval = yearEnd;
              break;
            case "month":
              numberOfMonths = number;
              var monthBegin = utils.getMonthBegin(number);
              var monthEnd = utils.getMonthEnd(number);
              beginInterval = monthBegin;
              endInterval = monthEnd;
              break;
            case "week":
              numberOfWeeks = number;
              var weekBegin = utils.getWeekBegin(number);
              var weekEnd = utils.getWeekEnd(number);
              beginInterval = weekBegin;
              endInterval = weekEnd;
              break;
            case "day":
              numberOfDays = number;
              var dayBegin = utils.getDayBegin(number);
              var dayEnd = utils.getDayEnd(number);
              beginInterval = dayBegin;
              endInterval = dayEnd;
              break;
            default:
              break;  
          }
          //
          switch(currency){
            case "usd":
              var currencySymbol = getSymbolFromCurrency('USD');
              break;
            case "cad":
              var currencySymbol = getSymbolFromCurrency('CAD');
              break;
            case "aud":
              var currencySymbol = getSymbolFromCurrency('AUD');
              break;  
            case "eur":
              var currencySymbol = getSymbolFromCurrency('EUR');
              break;
            case "gbp":
              var currencySymbol = getSymbolFromCurrency('GBP');
              break;
            default:
              var currencySymbol = "RAW"
              break;
          }

          var transactionArray = [];
          var transactionJSON = {
            data: []
          };
          if(transactions != null) {
            for (var i=0;i<transactions.data.length;i++) {
              var transactionDate = transactions.data[i].created;
              var dateString = moment.unix(transactionDate).format("MM/DD/YYYY");
              
              var dateW = transactions.data[i].created;
              for (var j= 0; j <= number; j++) {
                if((dateW > beginInterval[j]/1000) && (dateW < endInterval[j]/1000)) {
                    
                    var transactionAmount = transactions.data[i].amount;
                    switch(currency){
                    case "usd":
                      var transactionAmountFormatted = currencyFormat.getCommaSeparatedFormat(currencySymbol, transactionAmount);
                      break;
                    case "cad":
                      var transactionAmountFormatted = currencyFormat.getCommaSeparatedFormat(currencySymbol, transactionAmount);
                      break;
                    case "aud":
                      var transactionAmountFormatted = currencyFormat.getCommaSeparatedFormat(currencySymbol, transactionAmount);
                      break;  
                    case "eur":
                      var transactionAmountFormatted = currencyFormat.getDotSeparatedFormat(currencySymbol, transactionAmount);
                      break;
                    case "gbp":
                      var transactionAmountFormatted = currencyFormat.getCommaSeparatedFormat(currencySymbol, transactionAmount);
                      break;
                    default:
                      transactionAmountFormatted = transactionAmount;
                      break;
                  }
                  transactionJSON.data.push({
                    "date"    : dateW,
                    "amount"  : transactionAmountFormatted
                  })
                }
              }
            }
            res.json({
              transactions: transactionJSON  
            })
          }
        })
      })
  })

  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.history, function(req, res, next) {
      
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var limit = req.query.limit || 100
        stripe.balance.listTransactions({ limit: limit }, function(err, transactions) {
          if(err) {
            logger.error(err)
          }

          if(transactions != null) {
            var oneYearInWeeks = 51;
            var oneYearInMonths = 11;
            var totalWeek = [];
            var weekBegin = utils.getWeekBegin(oneYearInWeeks);
            var weekEnd = utils.getWeekEnd(oneYearInWeeks);
            for (var i = oneYearInWeeks; i >= 0; i--) {
              totalWeek[i] = 0;
            }
            
            for(var i=0;i<transactions.data.length;i++) {
              var dateW = transactions.data[i].created;
              for (var j= 0; j <= oneYearInWeeks; j++) {
                if((dateW > weekBegin[j]/1000) && (dateW < weekEnd[j]/1000)) {
                    totalWeek[j] = totalWeek[j] + transactions.data[i].amount;
                }
              }
            }
            
            //
            totalMonth = [];
            for (var i = oneYearInMonths; i >= 0; i--) {
              totalMonth[i] = 0;
            }
            var monthBegin = utils.getMonthBegin(oneYearInMonths);
            var monthEnd = utils.getMonthEnd(oneYearInMonths);
            
            for(var i=0;i<transactions.data.length;i++) {
              var dateM = transactions.data[i].created;
              for (var j= 0; j <= oneYearInMonths; j++) {
                if((dateM > monthBegin[j]/1000) && (dateM < monthEnd[j]/1000)) {
                  totalMonth[j] = totalMonth[j] + transactions.data[i].amount;
                }
              }
            }
            
            var transactionArray = [];
            var transactionJSON = {
              
            };
            for (var i=0;i<transactions.data.length;i++) {
              var transactionDate = transactions.data[i].created;
              var dateString = moment.unix(transactionDate).format("MM/DD/YYYY");
              var transactionAmount = transactions.data[i].amount;
              transactionJSON[dateString] = transactionAmount;
            }
            
            res.json({
              history: {
                "1W":[totalWeek[0]],
                "2W":[totalWeek[1],totalWeek[2]],
                "1M":[totalMonth[0]],
                "3M":[totalMonth[0],totalMonth[1],totalMonth[2]],
                "6M":[totalMonth[0],totalMonth[1],totalMonth[2],totalMonth[3],totalMonth[4],totalMonth[5]],
                "1Y":[totalMonth[0],totalMonth[1],totalMonth[2],totalMonth[3],totalMonth[4],totalMonth[5],totalMonth[6],totalMonth[7],totalMonth[8],totalMonth[9],totalMonth[10],totalMonth[11]],
              }
            })            
          }
        });
      })   
  })


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
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge, function(req, res, next) {
      // TODO
      // Create a request to charge
      // If the charge is approved proceed with the charge request

      // Flow
      // Create a charge with the credit card token
      // Find the user in the database
      // Make a delegated request on behalf of the user
      var user_id = req.params.uid;
      userController.getDelegatedUserByUsername(req.body.delegatedUser).then(function (delegateUser) {
          var stripe = require('stripe')(delegateUser.stripe.secretKey);
          var params = {
            amount: req.body.amount,
            currency: "usd",
            source: req.body.token,
            description: "New charge"
          }
          // Charge a card based on customer ID, the customer must have a linked credit card
          stripe.charges.create(params).then(function(charge, err) {
              // logger.info(res)
              res.json({msg: "success", charge: charge}).end();
          }, function(err) {
              logger.error(err)
              res.json({msg: "error", err: err}).end();
          });
      }) 
  });
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.charge, function(req, res, next) {
      var user_id = req.params.uid;
      var params = { limit: 10 }
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);      
        stripe.charges.list(params, function(err, charges) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ charges: charges })          
        });    
      });     
  });
  app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/:charge_id", function(req, res, next) {
      var user_id = req.params.uid;
      var charge_id = req.params.charge_id;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);      
        stripe.charges.retrieve(charge_id, function(err, charge) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ charge: charge })          
        });        
      });
  });
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/:charge_id", function(req, res, next) {
      var params = {"foo": "bar"};
      var user_id = req.params.uid;
      var charge_id = req.params.charge_id;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);      
        stripe.charges.capture(charge_id, function(err, charge) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ charge: charge })          
        });        
      });      
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/:charge_id", function(req, res, next) {
      var params = { 
        description: "foobar"
      };
      var user_id = req.params.uid;
      var charge_id = req.params.charge_id;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);      
        stripe.charges.update(charge_id, params, function(err, charge) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ charge: charge })          
        });        
      });        
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/close/dispute", function(req, res, next) {
      stripe.charges.closeDispute(chargeId, params)
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/set/metadata", function(req, res, next) {
      stripe.charges.setMetadata(chargeId, metadataObject)
  });
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/get/metadata", function(req, res, next) {
      stripe.charges.getMetadata(chargeId)
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/mark/safe", function(req, res, next) {
      stripe.charges.markAsSafe(chargeId)
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/mark/fraud", function(req, res, next) {
      stripe.charges.markAsFraudulent(chargeId)
  });

  // COUPONS
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.coupons, function(req, res, next) {
      stripe.coupons.create(params)
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.coupons, function(req, res, next) {
      stripe.coupons.list([params])
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.coupons, function(req, res, next) {
      stripe.coupons.retrieve(chargeId)
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.coupons, function(req, res, next) {
      stripe.coupons.del(chargeId)
  });


  // CUSTOMERS

  /* 
      Make delegated request to create customer (become customer) and attach
      a token using either credit card or Apple Pay
  */
  // Create customer
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.customers, function(req, res, next) {
      var user_id = req.params.uid;
      var params = {
        email: req.body.email,
        description: req.body.description,
        source: req.body.token
      };
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.customers.create(params, function(err, customer) {
            // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ customer: customer })
          }
        );
      });
  });  
  // List customers /v1/stripe/:uid/customers/
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.customers, function(req, res, next) {
      logger.trace('getting user customers');
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {};
        stripe.customers.list({ limit: req.query.limit }, function(err, customers) {
            // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ customers: customers })
          }
        );
      });
  });   

  // Update customer 
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", function(req, res, next) {
      var user_id = req.params.uid;
      var customer_id = req.params.cust_id
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.customers.update(customer_id, {
          description: "Customer for test@example.com"
        }, function(err, customer) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ customer: customer })          
        });        
      });    
  });  
  // Retrieve single customer
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", function(req, res, next) {
      var user_id = req.params.uid;
      var customer_id = req.params.cust_id;      
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var customer_id = req.body.customerId;
        stripe.customers.retrieve(customer_id, function(err, customer) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ customer: customer })          
        });        
      });       
  });   
  // Delete customer
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", function(req, res, next) {
      var user_id = req.params.uid;
      var customer_id = req.params.cust_id;      
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.customers.del(customer_id, function(err, confirmation) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ confirmation: confirmation })          
        });        
      });     
  });    
  // Set customer metadata      
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", function(req, res, next) {
      var metadata_obj = req.body.metadataObject;
      var user_id = req.params.uid;
      var customer_id = req.params.cust_id;      
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var customer_id = req.body.customerId;
        stripe.customers.setMetadata(customer_id, metadata_obj, function(err, customer) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ customer: customer })          
        });        
      }); 
  });    
  // Get customer metadata     
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", function(req, res, next) {
      var user_id = req.params.uid;
      var customer_id = req.params.cust_id;      
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var customer_id = req.body.customerId;
        stripe.customers.getMetadata(customer_id, function(err, customer) {
          // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ customer: customer })          
        });        
      }); 
  });        

  // STATUS: IN PROGRESS
  // SUBSCRIPTIONS
  // Delegated subscription creation
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions + "/:delegate_username", function(req, res, next) {
    // Flow
    // Create a subscription with the credit card token
    // Find the user in the database
    // Make a delegated request on behalf of the user
    logger.debug("delegated subscription creation called")
    //logger.debug(req.body);
    //logger.debug(req.params);
    var user_id = req.params.uid;
    var params = {
      plan: req.body.plan_id
    }
    logger.debug(params);
    userController.getDelegatedUserByUsername(req.params.delegate_username).then(function (delegateUser) {
      // get delegate user
      var delegateUser = delegateUser;
      logger.info(delegateUser.username);
      var stripe = require('stripe')(delegateUser.stripe.secretKey);
      userController.getUser(user_id).then(function (user) {
        // get requesting user
        var requestingUser = user
        logger.info(requestingUser.username);
        // TODO: CHANGE LIMIT TO INFINITE!
        stripe.customers.list({ limit: 100 }, function(err, customers) {
            logger.trace('inside customer list')
            // asynchronously called
            if(err) {
              logger.error(err)
            }

            // list customers before adding plan
            // check for existing customer by email
            // so for example, list all customers and do
            // a quick check to see if email matches any in
            // customer list, if not create customer, if yes
            // add new plan to existing customer

            // First check if the delgated user has any customers, if not add the first one. Then loop
            // through the current customers and do a match on whether customer already exists or not.  Then
            // if no matches are found perform the secondary option of creating the customer and subscription.
            // The second part of the execution can only occur once the full loop has been performed

            //logger.debug(customers.data.length)
            if( customers.data.length == 0 ) {
                // if customer does not exist, create one and add a plan
                logger.info("No customers exist for this user, adding the first one!")   
                var customer_params = {
                    email: requestingUser.email,
                    source: req.body.token
                }                 
                stripe.customers.create(customer_params, function(err, customer) {
                    // asynchronously called
                    if(err) {
                      logger.error(err)
                    }
                    // Create a customer, then create a plan for that customer
                    stripe.subscriptions.create({ customer: customer.id, plan: params.plan }).then(function(subscription, err) {
                        res.json({ subscription: subscription }).end();
                    }, function(err) {
                        logger.error(err)
                        res.json({msg: "error", err: err}).end();
                    })
                  }
                );  
            } else {
              logger.info("Customers exist for this user, checking if requesting user is one of them")   
              for (var i = 0; i < customers.data.length; i++) {
                if(customers.data[i].email == requestingUser.email) {
                  logger.info("Customer email already exists in database! Adding plan to existing customer")
                  stripe.subscriptions.create({ customer: customers.data[i].id, plan: params.plan }).then(function(subscription, err) {
                      res.json({ subscription: subscription }).end();
                  }, function(err) {
                      logger.error(err)
                      res.json({msg: "error", err: err}).end();
                  });
                  break;
                }
                // At the end of the data array if we still haven't found an existing customer add a new one with subscription
                if(i == customers.data.length - 1 && customers.data[i].email != requestingUser.email) {
                  // if customer does not exist, create one and add a plan
                  logger.info("Customer email does not currently exist. Adding new customer with subscription")   
                  var customer_params = {
                      email: requestingUser.email,
                      source: req.body.token
                  }                 
                  stripe.customers.create(customer_params, function(err, customer) {
                      // asynchronously called
                      if(err) {
                        logger.error(err)
                      }
                      //logger.info(customer);
                      // Create a customer, then create a plan for that customer
                      stripe.subscriptions.create({ customer: customer.id, plan: params.plan }).then(function(subscription, err) {
                          res.json({ subscription: subscription }).end();
                      }, function(err) {
                          logger.error(err)
                          res.json({msg: "error", err: err}).end();
                      })
                    }
                  )    
                }
              } 
            }           
          }
        )        
      })
    }) 
  })

  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, function(req, res, next) {
      stripe.subscriptions.createSubscription(customerId, params)
  });   
  app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, function(req, res, next) {
      stripe.subscriptions.updateSubscription(customerId, subscriptionId, params)
  });   
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, function(req, res, next) {
      stripe.subscriptions.cancelSubscription(customerId, subscriptionId, params)
  });   
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions + "/:sub_id", function(req, res, next) {
      var subscription_id = req.params.sub_id;
      var user_id = req.params.uid;    
      logger.debug("deleting subscription ", subscription_id)
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.subscriptions.del(subscription_id, function(err, confirmation) {
            if(err) {
              logger.error(err)
            }          
            res.json({ confirmation: confirmation })
            // asynchronously called
        });
      });
  });   
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, function(req, res, next) {
      logger.debug('getting user subscriptions')
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        // var params = { limit: req.query.limit };
        stripe.subscriptions.list({ limit: 100 },
          function(err, subscriptions) {
            // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ subscriptions: subscriptions })
          }
        );
      });      
  });   
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, function(req, res, next) {
      stripe.subscriptions.retrieveSubscription(customerId, subscriptionId)
  });   

  // CARDS
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, function(req, res, next) {
      stripe.cards.createSource(customerId, params)
  });   
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, function(req, res, next) {
      stripe.cards.listCards(customerId)
  });   
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, function(req, res, next) {
      stripe.cards.retrieveCard(customerId, cardId)
  });   
  app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, function(req, res, next) {
      stripe.cards.updateCard(customerId, cardId, params)
  });   
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, function(req, res, next) {
      stripe.cards.deleteCard(customerId, cardId)
  });   
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, function(req, res, next) {
      stripe.cards.deleteDiscount(customerId)
  });     

  // // EVENTS (types of events)
  /*
      Get user events and display in notifications list
  */
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.events, userController.authorize, function(req, res, next) {
      logger.trace('getting user events history');
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var limit = req.query.limit
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

  // Implement retrieve single event for detail event view 
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

  // PLANS
  /* 
      RESTful calls to interface with Stripe's Plans (Subscriptions) API.

      STATUS: 
        MARK: COMPLETE
        TEST: INCOMPLETE

      ENDPOINTS:
        SINGLE: /v1/stripe/plans/:id
        GENERIC: /v1/stripe/plans/
  */
  // Used to POST (create) a new plan
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.plans, function(req, res, next) {
      logger.info("creating new plan");
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {
          id: req.body.id,          
          amount: req.body.amount,
          interval: req.body.interval,
          interval_count: req.body.interval_count,
          name: req.body.name,
          currency: req.body.currency,
          trial_period_days: req.body.trial_period_days,
          statement_descriptor: req.body.statement_descriptor
        };
        logger.debug(params);
        stripe.plans.create(params, function(err, plan) {
            if(err) {
              // logger.error(err)
              res.status(400).json({ error: err })
            } else {
              res.json({ plan: plan })
            }
            // asynchronously called
        });
      });
  });  

  /* Used to GET a list of plans of a user
     
     EXAMPLE:
        ENDPOINT: /v1/stripe/h8d0f9h8d09f8hd9fg08a0hs0j795df46s/plans?limit=10
        ENDPOINT_SINGLE: /v1/stripe/h8d0f9h8d09f8hd9fg08a0hs0j795df46s/plans/gold

     NOTES: 
        - Use req.params to retrieve the inner value of a url such as /:uid/plans
        - /:uid sets the url parameter variable name to uid, and is retrieved through
          req.params.uid
        - Use req.url to retrieve the query variables such as ?limit=10
  */
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.plans, function(req, res, next) {
      logger.debug('getting user plans')
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {};
        stripe.plans.list({ limit: req.query.limit },
          function(err, plans) {
            // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ plans: plans })
          }
        );
      });
  });  

  app.get(endpoint.version + endpoint.base + endpoint.plans + "/:delegate_username", function(req, res, next) {
      // delegated user plan retrieval
      logger.debug('getting delegated user plans') // get user by username delegated // 2
      var username = req.params.delegate_username
      userController.getDelegatedUserByUsername(username).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {};
        stripe.plans.list({ limit: req.query.limit },
          function(err, plans) {
            // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ plans: plans })
          }
        );
      });
  });  


  // Used to POST (update) a plan
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.plans + "/:plan_id", function(req, res, next) {
      var plan_id = req.params.plan_id;
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {
          amount: req.body.amount,
          interval: req.body.interval,
          name: req.body.name,
          currency: req.body.currency
        };
        stripe.plans.update(plan_id, params, function(err, plan) {
            if(err) {
              logger.error(err)
            }          
            res.json({ plan: plan })
            // asynchronously called
        });
      });
  }); 

  // Used to GET (retrieve) a single plan
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.plans + "/:plan_id", function(req, res, next) {
      var plan_id = req.params.plan_id;
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.plans.retrieve(plan_id, function(err, plan) {
            if(err) {
              logger.error(err)
            }          
            res.json({ plan: plan })
            // asynchronously called
        });
      });
  }); 

  // Used to DELETE a single plan
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.plans + "/:plan_id", function(req, res, next) {
      var plan_id = req.params.plan_id;
      var user_id = req.params.uid;    
      logger.debug("deleting plan ", plan_id)
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.plans.del(plan_id, function(err, confirmation) {
            if(err) {
              logger.error(err)
            }          
            res.json({ confirmation: confirmation })
            // asynchronously called
        });
      });
  }); 

  // // PRODUCTS
  // stripe.products.create(params)
    app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.products, function(req, res, next) {
      var user_id = req.params.uid
      logger.info(req.body.attributes);
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {
          id: req.body.id,
          name: req.body.name,          
          description: req.body.description,
          metadata: req.body.metadata,
          attributes: req.body.attributes
        };
        stripe.products.create(params, function(err, product) {
            if(err) {
              logger.error(err)
            }          
            res.json({ product: product })
            // asynchronously called
        });
      });
  }); 
  // stripe.products.list([params])
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.products, function(req, res, next) {
      logger.debug('getting products')
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {};
        stripe.products.list({ limit: req.query.limit },
          function(err, products) {
            // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ products: products })
          }
        );
      });
  });  
  // stripe.products.update(productId[, params])
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.products + "/:product_id", function(req, res, next) {
      var product_id = req.params.product_id;
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {
          active:req.body.active,
          description: req.body.description,
          name: req.body.name,
          metadata: req.body.metadata,
          attributes: req.body.attributes
        };
        stripe.products.update(product_id, params, function(err, product) {
            if(err) {
              logger.error(err)
            }          
            res.json({ product: product })
            // asynchronously called
        });
      });
  }); 

  // Used to GET (retrieve) a single product
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.products + "/:product_id", function(req, res, next) {
      var product_id = req.params.product_id;
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        stripe.products.retrieve(product_id, function(err, product) {
            if(err) {
              logger.error(err)
            }          
            res.json({ product: product })
            // asynchronously called
        });
      });
  });


  // Used to delete a single product
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.products + "/:product_id", function(req, res, next) {
      //logger.info("deleting")
      var product_id = req.params.product_id;
      var user_id = req.params.uid;    
      userController.getUser(user_id).then(function (user) {
        //logger.trace('found user' + user.username)
        var stripe = require('stripe')(user.stripe.secretKey);
        //logger.debug(product_id)
        stripe.products.del(product_id, function(err, confirmation) {
            //logger.info('inside product del')
            if(err) {
              logger.error(err)
            }      
            logger.info(confirmation)    
            res.json({ confirmation: confirmation })
            // asynchronously called
        });
      });
  }); 

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
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.transfers, function(req, res, next) {
      //logger.debug('creating transfer...');
      var user_id = req.params.uid
      //logger.debug('in transfer create')
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {
          amount: req.body.amount,
          currency: req.body.currency,          
          destination: req.body.destination,
          description: req.body.description
        };
        stripe.transfers.create(params, function(err, transfer) {
            if(err) {
              logger.error(err)
            }          
            res.json({ transfer: transfer })
            // asynchronously called
        });
      });
  }); 
  // stripe.transfers.list([params])
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.transfers, function(req, res, next) {
      logger.debug('getting transfers')
      var user_id = req.params.uid
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {};
        stripe.transfers.list({ limit: req.query.limit },
          function(err, transfers) {
            // asynchronously called
            if(err) {
              logger.error(err)
            }
            res.json({ transfers: transfers })
          }
        );
      });
  });  

  // stripe.transfers.retrieve(transferI_id)
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.transfers + "/:transfer_id", function(req, res, next) {
      var transfer_id = req.params.transfer_id;
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        //logger.debug(transfer_id);
        stripe.transfers.retrieve(transfer_id, function(err, transfer) {
            if(err) {
              logger.error(err)
            }          
            res.json({ transfer: transfer })
            // asynchronously called
        });
      });
  });
  
  // stripe.transfers.update(transferId[, params])
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.transfers + "/:transfer_id", function(req, res, next) {
      var transfer_id = req.params.transfer_id;
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {
          description: req.body.description,
          metadata: req.body.metadata
        };
        stripe.transfers.update(transfer_id, params, function(err, transfer) {
            if(err) {
              logger.error(err)
            }          
            res.json({ transfer: transfer })
            // asynchronously called
        });
      });
  }); 
  // stripe.transfers.reverse(transferId[, params])
  // stripe.transfers.cancel(transferId) (Deprecated -- use reverse)
  // stripe.transfers.listTransactions(transferId[, params])
  // stripe.transfers.setMetadata(transferId, metadataObject) (metadata info)
  // stripe.transfers.setMetadata(transferId, key, value)
  // stripe.transfers.getMetadata(transferId)

  // // BITCOIN (resource bitcoinReceivers)
  // stripe.bitcoinReceivers.create(params)
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.bitcoin, function(req, res, next) {
      var user_id = req.params.uid;
      userController.getUser(user_id).then(function (user) {
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {
          amount: req.body.amount,
          currency: "usd",
          description: "Bitcoin reciever for user " + user.username,
          email: user.email        
        };
        logger.debug(params);
        stripe.bitcoinReceivers.create(params, function(err, receiver) {
            if(err) {
              logger.error(err)
            }          
            res.json({ receiver: receiver })
            // asynchronously called
        });
      });
  });  
  // stripe.bitcoinReceivers.retrieve(receiverId)
  // stripe.bitcoinReceivers.list([params])
  // stripe.bitcoinReceivers.getMetadata(receiverId)
}