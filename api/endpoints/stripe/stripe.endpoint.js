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
    ach: '/ach',                        
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
    external: '/external',                 
    upload: '/upload',                
    verify: '/verify'                  
  };

  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here https://dashboard.stripe.com/account/apikeys
  /* 
      Here we configure the setup of the endpoint, the most part important being
      userController which allows us to utilize our User object functions such as getUser
      as well as things like cors and bodyParser which makes handling JSON requests easier
  */
  var userController = require('../auth/controllers/user-controller');
  var Scribe = require('../scribe/models/scribe.model');
  var utils = require('./lib/utils');
  var format = require('./lib/format');
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
  var multer  = require('multer');
  var upload = multer({ dest: 'images/' });
  var fs = require('fs');
  var jwt = require('jwt-simple');
  var tokenSecret = process.env.JWT_SECRET;
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
    
    if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
    }

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

  // API STATUS: IN PROGRESS

  // ACCOUNT
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.account, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.trace("request received | get account")
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey); 
          stripe.account.retrieve(user.stripe.accountId, function(err, account) {
              // asynchronously called
              if(err) {
                logger.error(err);
                return res.json({ error: err })            
              } else {
                return res.json({account: account})              
              }
            }
          );   
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });
  app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.account, userController.authorize, function(req, res, next) {
        
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }  

      try {
        logger.trace("request received | update stripe account")
        var user_id = req.params.uid;
        var parameters = req.body;
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey); 
          stripe.account.update(user.stripe.accountId, parameters, function(err, account) {
              // asynchronously called
              if(err) {
                logger.error(err);
                return res.status(404).json({ error: err })                          
              } else {
                logger.info("updated stripe account")
                return res.json({ account: account })              
              }
            }
          );   
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });
  
  // EXTERNAL ACCOUNTS
  // Endpoint /v1/stripe/a7sd89f7a98df/external_account?type=card
  // Endpoint /v1/stripe/a7sd89f7a98df/external_account?type=bank
  // Add credit card external account
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.external_account, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.trace("request received | add account external account")
        var card_obj;
        if(req.query.type == "card") {
          card_obj = {
            card: {
              "number": req.body.number,
              "exp_month": req.body.exp_month,
              "exp_year": req.body.exp_year,
              "cvc": req.body.cvc,
              "currency": "usd"
            }
          }
        }
        logger.trace("request received | add external account")
        var user_id = req.params.uid
        var token = req.body.external_account;
        logger.info(token)
        userController.getUser(user_id).then(function (user) {
          // First create a tokenized card based on the request
          var stripe = require('stripe')(user.stripe.secretKey); 
          if(req.query.type == "card") {
            stripe.tokens.create(card_obj, function(err, token) {
                logger.debug(token);
                // asynchronously called
                if(err) {
                  logger.error(err);
                  res.json({ error: err })            
                }
                // Then add the source to Stripe using the token
                stripe.accounts.createExternalAccount(user.stripe.accountId, { external_account: token.id }, function(err, card) {
                    // asynchronously called
                    if(err) {
                      logger.error(err);
                      res.json({ error: err })            
                    } else {
                      res.json({ msg:"card added!", card: card })                    
                    }
                  }
                );          
            });          
          } else {
            logger.info("adding external account bank")
            logger.info("token is ", token)
            stripe.accounts.createExternalAccount(user.stripe.accountId, { external_account: token }, function(err, externalAccount) {
                // asynchronously called
                if(err) {
                  logger.error("error occurred", err);
                  res.json({ error: err })                           
                } else {
                  logger.trace('done')
                  res.json({ msg: "external account added!", external_account: externalAccount })
                }
              }
            );   
          }
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });   

  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.external_account, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.trace("request received | list external accounts.");
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          // First create a tokenized card based on the request
          var stripe = require('stripe')(user.stripe.secretKey);  
          var acct_id = user.stripe.accountId;
          stripe.accounts.listExternalAccounts(acct_id, function(err, externalAccounts) {
            //logger.trace("accounts: " + externalAccounts);
            if(err) {
              logger.error(err);
              res.json({ error: err })            
            } else {
              res.json({external_accounts:externalAccounts})
            }
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });   


  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.external_account + "/:bank_acct_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
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
              res.json({ error: err })            
            } else {
              res.json({ confirmation: confirmation })            
            }
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });   

  // BALANCE
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.balance, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.trace("getting user balance")      
        var user_id = req.params.uid;
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          stripe.balance.retrieve(function(err, balance) {
              if(err) {
                  logger.error(err);
                  res.json({ error: err })            
              } else {
                  res.json({balance:balance})              
              }
          })
        })  
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }       
  });  

  // HISTORY
  // Get user transactions history
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.transactions, userController.authorize, function(req, res, next) {

      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        // logger.info(req.user);
        // logger.info(req.params.uid);
        logger.trace("getting user transaction history")
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }       
          stripe.balance.listTransactions({ limit: limit, starting_after: starting_after }, function(err, transactions) {
            if(err) {
              logger.error(err)
              res.json({ error: err })                        
            } else {
              res.json({ transactions:transactions })            
            }
            // logger.info(transactions)
            // asynchronously called

          });
        })   
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }          
  });     
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.transactions, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      stripe.balance.retrieveTransaction(transactionId)
  });

  // Transaction History
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.history + "/:interval", function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var user_id = req.params.uid;
        var interval = req.params.interval;
        // /v1/stripe/09s8df0a9s8d/history?interval=year&currency=usd&number=10
        var currency = req.query.currency;
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var number = req.query.number;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }        
          stripe.balance.listTransactions({ limit: limit, starting_after: starting_after }, function(err, transactions) {
            if(err) {
              logger.error(err)
              res.json({ error: err })                        
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
                        var transactionAmountFormatted = format.getCommaSeparatedFormat(currencySymbol, transactionAmount);
                        break;
                      case "cad":
                        var transactionAmountFormatted = format.getCommaSeparatedFormat(currencySymbol, transactionAmount);
                        break;
                      case "aud":
                        var transactionAmountFormatted = format.getCommaSeparatedFormat(currencySymbol, transactionAmount);
                        break;  
                      case "eur":
                        var transactionAmountFormatted = format.getDotSeparatedFormat(currencySymbol, transactionAmount);
                        break;
                      case "gbp":
                        var transactionAmountFormatted = format.getCommaSeparatedFormat(currencySymbol, transactionAmount);
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
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }
  })

  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.history, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }        
          stripe.balance.listTransactions({ limit: limit, starting_after: starting_after }, function(err, transactions) {
            if(err) {
              logger.error(err)
              res.json({ error: err })                        
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
                  "1M":[totalWeek[0],totalWeek[1],totalWeek[2],totalWeek[3]],
                  "3M":[totalMonth[0],totalMonth[1],totalMonth[2]],
                  "6M":[totalMonth[0],totalMonth[1],totalMonth[2],totalMonth[3],totalMonth[4],totalMonth[5]],
                  "1Y":[totalMonth[0],totalMonth[1],totalMonth[2],totalMonth[3],totalMonth[4],totalMonth[5],totalMonth[6],totalMonth[7],totalMonth[8],totalMonth[9],totalMonth[10],totalMonth[11]],
                }
              })            
            }
          });
        })   
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }
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
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge, userController.authorize, function(req, res, next) {
      // POS Charge, aka pay yourself through a terminal
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'Unauthorized' });
      }

      if (req.body.amount > 150000) {
        return res.status(407).send({ message: 'Amount cannot be greater than $1,500' });
      }

      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }      

      try {
        // TODO: Implement check of auth token
        logger.info("POS charge")
        var user_id = req.params.uid;
        userController.getUser(user_id).then(function (user) {
            var stripe = require('stripe')(user.stripe.secretKey);
            var amountInCents = req.body.amount;
            var application_fee = Math.round((amountInCents*0.006));
            var description = "POS charge in the amount of " + format.getCommaSeparatedFormat("USD", amountInCents);
            logger.info(amountInCents);
            logger.info(application_fee);
            logger.info(description);
            var params = {
              amount: amountInCents,
              application_fee: application_fee,
              currency: "usd",
              source: req.body.token,
              description: description
            }
            // Charge a card based on customer ID, the customer must have a linked credit card
            stripe.charges.create(params).then(function(charge, err) {
                // logger.info(res)
                res.json({msg: "success", charge: charge})
            }, function(err) {
                logger.error(err)
                res.json({ error: err })                          
            });
        }) 
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }        
  });

  // Delegated one time charge, pay another delegated user
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/:delegate_username", userController.authorize, function(req, res, next) {
    // Delegated charge, aka someone pays you
    
    logger.info("delegated charge request")

    if (!req.headers.authorization) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    if (req.body.amount > 150000) {
      return res.status(407).send({ message: 'Amount cannot be greater than $1,500' });
    }

    if(req.user._id !== req.params.uid) {
      logger.info("unauthorized uid");
      return res.json({ status: 401, msg: "Unauthorized" });
    }    

    try {
      var user_id = req.params.uid;
      var delegate_user = req.params.delegate_username;
      userController.getDelegatedUserByUsername(delegate_user).then(function (delegateUser) {
          var stripe = require('stripe')(delegateUser.stripe.secretKey);
          var amountInCents = req.body.amount;
          var application_fee = Math.round((amountInCents*0.006));
          var description = "New charge in the amount of " + format.getCommaSeparatedFormat("USD", amountInCents/100);
          // logger.info(amountInCents);
          // logger.info(application_fee);
          // logger.info(description);
          var params = {
            amount: amountInCents,
            application_fee: application_fee,
            currency: "usd", // currency ?? "usd" // currency = req.body.currency
            source: req.body.token,
            description: description
          }

          // e.g. request is /v1/stripe/5a6s6g87as888s/charge/johndoe?type=bank
          if(req.query.type == "bank") {
            userController.getUser(user_id).then(function (user) {
              logger.info("bank charge: one time");
              // get requesting user
              var requestingUser = user
              logger.info(requestingUser.username);
              // Charge a card based on customer ID, the customer must have a linked bank
              var limit = req.query.limit || 100;
              var starting_after;
              if(req.query.starting_after != undefined) {
                starting_after = req.query.starting_after;
              }
              stripe.customers.list({ limit: limit, starting_after: starting_after }, function(err, customers) {
                  logger.trace('inside customer list')
                  // asynchronously called
                  if(err) {
                    logger.error(err)
                    res.json({ error: err })                                        
                  }

                  // list customers before creating charge
                  // check for existing customer by email
                  // so for example, list all customers and do
                  // a quick check to see if email matches any in
                  // customer list, if not create customer, if yes
                  // add new plan to existing customer

                  // First check if the delgated user has any customers, if not add the first one. Then loop
                  // through the current customers and do a match on whether customer already exists or not.  Then
                  // if no matches are found perform the secondary option of creating the customer and charge.
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
                            res.json({ error: err })                                                
                          }
                          // Create a customer, then create a plan for that customer
                          // Charge a card based on customer ID, the customer must have a linked bank
                          stripe.charges.create({
                            currency: "usd",
                            customer: customer.id, 
                            amount: amountInCents,
                            application_fee: Math.round((amountInCents*0.002))                     
                          }).then(function(charge) {
                              // logger.info(res)
                              res.json({status: 200, charge: charge})
                          }, function(err) {
                              logger.error(err)
                              res.json({ error: err })                          
                          });                      
                        }
                      );  
                  } else {
                    logger.info("Customers exist for this user, checking if requesting user is one of them")   
                    for (var i = 0; i < customers.data.length; i++) {
                      if(customers.data[i].email == requestingUser.email) {
                        logger.info("Customer email already exists in database! Creating charge to existing customer");

                        // Perform a check for the source (i.e. a card or bank) existance
                        // if it does not exist then make sure to create a new
                        // source and add it to the customer

                        stripe.charges.create({
                          currency: "usd",
                          customer: customers.data[i].id, 
                          amount: amountInCents,
                          application_fee: Math.round((amountInCents*0.002))                     
                        }).then(function(charge) {
                            // logger.info(res)
                            return res.json({status: 200, charge: charge})
                        }, function(err) {
                            logger.error(err)
                            return res.json({ error: err })                          
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
                              return res.json({ error: err })                                                  
                            }
                            //logger.info(customer);
                            // Create a customer, then create a plan for that customer
                            stripe.charges.create({
                              currency: "usd",
                              customer: customer.id, 
                              amount: amountInCents,
                              application_fee: Math.round((amountInCents*0.002))                     
                            }).then(function(charge) {
                                // logger.info(res)
                                return res.json({status: 200, charge: charge})
                            }, function(err) {
                                logger.error(err)
                                return res.json({ error: err })                          
                            });   
                          }
                        )    
                      }
                    } 
                  }           
                }
              )       
            })      
          } else {
            // Charge a card based on customer ID, the customer must have a linked credit card
            // This avoids creating a bank charge
            stripe.charges.create(params).then(function(charge) {
                // logger.info(res)
                res.json({status: 200, charge: charge})
            }, function(err) {
                logger.error(err)
                res.json({ error: err })                          
            });
          }
      }) 
    } catch(err) {
        logger.error(err);
        return res.send({ 
        	status: 407,
        	error: { 
        	  message: err
        	} 
        });        
    }
  })
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.charge, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var user_id = req.params.uid;
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey); 
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }            
          stripe.charges.list({ limit: limit, starting_after: starting_after }, userController.authorize, function(err, charges) {
            // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ charges: charges })                        
              }
          });    
        });     
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }        
  });
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/:charge_id", userController.authorize, function(req, res, next) {
      var user_id = req.params.uid;
      var charge_id = req.params.charge_id;
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);      
          stripe.charges.retrieve(charge_id, function(err, charge) {
            // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ charge: charge })                        
              }
          });        
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }      
  });
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/:charge_id", userController.authorize, function(req, res, next) {
      var user_id = req.params.uid;
      var charge_id = req.params.charge_id;
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);      
          stripe.charges.capture(charge_id, function(err, charge) {
            // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ charge: charge })                          
              }
          });        
        }); 
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }           
  });
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/:charge_id", userController.authorize, function(req, res, next) {
      var user_id = req.params.uid;
      var charge_id = req.params.charge_id;
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);      
          stripe.charges.update(charge_id, {}, function(err, charge) {
            // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ charge: charge })                        
              }
          });        
        });  
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }            
  });
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/close/dispute", userController.authorize, function(req, res, next) {
  //     //stripe.charges.closeDispute(chargeId, params)
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/set/metadata", userController.authorize, function(req, res, next) {
  //     //stripe.charges.setMetadata(chargeId, metadataObject)
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });
  // app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/get/metadata", userController.authorize, function(req, res, next) {
  //     //stripe.charges.getMetadata(chargeId)
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/mark/safe", userController.authorize, function(req, res, next) {
  //     //stripe.charges.markAsSafe(chargeId)
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.charge + "/mark/fraud", userController.authorize, function(req, res, next) {
  //     //stripe.charges.markAsFraudulent(chargeId)
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });

  // COUPONS
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.coupons, userController.authorize, function(req, res, next) {
  //     //stripe.coupons.create(params)
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.coupons, userController.authorize, function(req, res, next) {
  //     //stripe.coupons.list([params])
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.coupons, userController.authorize, function(req, res, next) {
  //     //stripe.coupons.retrieve(chargeId)
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.coupons, userController.authorize, function(req, res, next) {
  //     //stripe.coupons.del(chargeId)
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  // });


  // CUSTOMERS

  /* 
      Make delegated request to create customer (become customer) and attach
      a token using either credit card or Apple Pay
  */
  // Create customer
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.customers, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
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
                res.json({ error: err })                                        
              } else {
                res.json({ customer: customer })              
              }
            }
          );
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }      
  });  
  // List customers /v1/stripe/:uid/customers/
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.customers, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.trace('getting user customers');
        var user_id = req.params.uid;
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }
          stripe.customers.list({ limit: limit, starting_after: starting_after }, function(err, customers) {
              // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ customers: customers })              
              }
            }
          );
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }      
  });   

  // Update customer 
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
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
                res.json({ error: err })                                        
              } else {
                res.json({ customer: customer })                        
              }
          });        
        });    
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }      
  });  
  // Retrieve single customer
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var user_id = req.params.uid;
        var customer_id = req.params.cust_id;      
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          stripe.customers.retrieve(customer_id, function(err, customer) {
            // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ customer: customer })                          
              }
          });        
        }); 
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }            
  });   
  // Delete customer
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var user_id = req.params.uid;
        var customer_id = req.params.cust_id;      
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          stripe.customers.del(customer_id, function(err, confirmation) {
            // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ confirmation: confirmation })                        
              }
          });        
        });   
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }        
  });    
  // Set customer metadata      
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
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
                res.json({ error: err })                                        
              } else {
                res.json({ customer: customer })                        
              }
          });         
        }); 
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }      
  });    
  // Get customer metadata     
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.customers + "/:cust_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var user_id = req.params.uid;
        var customer_id = req.params.cust_id;      
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var customer_id = req.body.customerId;
          stripe.customers.getMetadata(customer_id, function(err, customer) {
            // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ customer: customer })                        
              }
          });        
        }); 
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }      
  });        

  // SUBSCRIPTIONS
  // Delegated subscription creation
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions + "/:delegate_username", userController.authorize, function(req, res, next) {

    if (!req.headers.authorization) {
      return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
    }
      
    if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
    }

    if (!req.headers.authorization) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    try {
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
        logger.info("delegate", delegateUser.username);
        var stripe = require('stripe')(delegateUser.stripe.secretKey);
        userController.getUser(user_id).then(function (user) {
          // get requesting user
          var requestingUser = user
          logger.info("is creating charge for", requestingUser.username);
          // TODO: CHANGE LIMIT TO INFINITE! or paginate it
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }        
          stripe.customers.list({ limit: limit, starting_after: starting_after }, function(err, customers) {
              logger.trace('inside customer list')
              // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
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
                        res.json({ error: err })                                                
                      }
                      // Create a customer, then create a plan for that customer
                      stripe.subscriptions.create({ 
                        customer: customer.id, 
                        plan: params.plan,
                        application_fee_percent: 1 
                      }).then(function(subscription, err) {
                          // use the var subscription to create a new scribe plan, and pass in the tenant id as well using plan.tenant_id = user.tenant_id                        
                          var scribe = new Scribe(subscription);
                          scribe.tenant_id = requestingUser.tenant_id;
                          scribe.delegate_username = delegateUser.username;
                          //logger.info(scribe);
                          scribe.save().then(function (scribe, err) {
                            logger.info("saved scribe");
                            //logger.info(scribe);
                          })                      
                          res.json({ subscription: subscription })
                      }, function(err) {
                          logger.error(err)
                          res.json({ error: err })                                                  
                      })
                    }
                  );  
              } else {
                logger.info("Customers exist for this user, checking if requesting user is one of them")   
                for (var i = 0; i < customers.data.length; i++) {
                  if(customers.data[i].email == requestingUser.email) {
                    logger.info("Customer email already exists in database! Adding plan to existing customer")
                    stripe.subscriptions.create({ 
                      customer: customers.data[i].id, 
                      plan: params.plan,
                      application_fee_percent: 1
                    }).then(function(subscription, err) {
                        // use the var subscription to create a new scribe plan, and pass in the tenant id as well using plan.tenant_id = user.tenant_id                        
                        var scribe = new Scribe(subscription);
                        scribe.tenant_id = requestingUser.tenant_id;
                        scribe.delegate_username = delegateUser.username;
                        //logger.info(scribe);
                        scribe.save().then(function (scribe, err) {
                          logger.info("saved scribe");
                          //logger.info(scribe);
                        })                    
                        res.json({ subscription: subscription })
                    }, function(err) {
                        logger.error(err)
                        res.json({ error: err })                          
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
                          res.json({ error: err })                                                  
                        }
                        //logger.info(customer);
                        // Create a customer, then create a plan for that customer
                        stripe.subscriptions.create({ 
                          customer: customer.id, 
                          plan: params.plan,
                          application_fee_percent: 1
                        }).then(function(subscription, err) {
                            // use the var subscription to create a new scribe plan, and pass in the tenant id as well using plan.tenant_id = user.tenant_id                        
                            var scribe = new Scribe(subscription);
                            scribe.tenant_id = requestingUser.tenant_id;
                            scribe.delegate_username = delegateUser.username;
                            //logger.info(scribe);
                            scribe.save().then(function (scribe, err) {
                              logger.info("saved scribe");
                              //logger.info(scribe);
                            })
                            res.json({ subscription: subscription })
                        }, function(err) {
                            logger.error(err)
                            res.json({ error: err })                          
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
    } catch(err) {
        logger.error(err);
        return res.send({ 
        	status: 407,
        	error: { 
        	  message: err
        	} 
        });        
    }
  })

  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, userController.authorize, function(req, res, next) {
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  //     stripe.subscriptions.createSubscription(customerId, params)
  // });   
  // app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, userController.authorize, function(req, res, next) {
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  //     stripe.subscriptions.updateSubscription(customerId, subscriptionId, params)
  // });   

  // DELETE Delegated request to cancel subscription
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions + "/:sub_id", userController.authorize, function(req, res, next) {
      
      logger.trace("cancel subscription req received")

      // Based on a retrieved Scribe data object
      // Perform a delegated cancellation of the subscription

      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }      

      try {
        var subscription_id = req.params.sub_id;
        logger.info("got sub id")
        /* Process | Delegated Subscription Cancellation
           1. Retrieve the delegated user's subscription list
           2. Retrieve a specific subscription based on the sub_id 
           3. Cancel the subscription using cust_id and sub_id
        */

        // Find's the specific Scribe object in the database
        Scribe.findOne({id: subscription_id}, function(err, scribe) {

          if(scribe.status == "canceled" && req.query.type == "delete") {
              Scribe.findById(scribe._id).remove().exec()          
              return res.status(200).json({status: 200})                
          }

          logger.info(scribe);
            var legacy_scribe_delegate_username = scribe.delegate_username;
            var legacy_scribe_tenant_id = scribe.tenant_id;
            var legacy_scribe_id = scribe._id;

            logger.info("passed legacy")
            if(err) {
              logger.error(err);
              return res.send({ 
              	status: 407,
              	error: { 
              	  message: err
              	} 
              });
            } 

            try {
              // Get the delegated user by the Scribe object delegate_username
              userController.getDelegatedUserByUsername(scribe.delegate_username).then(function (user) {
                  var stripe = require('stripe')(user.stripe.secretKey);

                  // Cancel the user's subscription
                  stripe.subscriptions.del(scribe.id, function(err, confirmation) {
                      if(err) {
                        logger.error(err)
                        return res.json({ error: err })                                        
                      } else {
                        if(req.query.type=="delete") {
                          logger.info("got type")
                          Scribe.find({id: subscription_id}).remove().exec()                          
                        } else {
                          // Delete old scribe and save the confirmation object as a new scribe object
                          // Use old scribe definitions for tenant_id and delegate_username                          
                          var updated_scribe = new Scribe(confirmation);
                          updated_scribe.tenant_id = legacy_scribe_tenant_id;
                          updated_scribe.delegate_username = legacy_scribe_delegate_username;
                          updated_scribe.save().then(function (updated_scribe, err) {
                            // Delete the old scribe
                            Scribe.findById(legacy_scribe_id).remove().exec()                          
                          })                            
                        }

                        logger.info("subscription deletion confirmation")
                        return res.json({ confirmation: confirmation });                                                        
                      } 
                  });
              })
            } catch(err) {
              logger.error(err)
              return res.send({ 
              	status: 407,
              	error: { 
              	  message: err
              	} 
              });
            }
        })
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }      
  });   

  // app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions + "/:sub_id", userController.authorize, function(req, res, next) {
      
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }

  //     var subscription_id = req.params.sub_id;
  //     var user_id = req.params.uid;    
  //     logger.debug("deleting subscription ", subscription_id)
  //     userController.getUser(user_id).then(function (user) {
  //       var stripe = require('stripe')(user.stripe.secretKey);
  //       stripe.subscriptions.del(subscription_id, function(err, confirmation) {
  //           if(err) {
  //             logger.error(err)
  //             res.json({ error: err })                                        
  //           } else {
  //             res.json({ confirmation: confirmation })              
  //           } 
  //           // asynchronously called
  //       });
  //     });
  // });   
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
          logger.info("unauthorized uid");
          return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.debug('getting user subscriptions')
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }
          stripe.subscriptions.list({ limit: limit, starting_after: starting_after },
            function(err, subscriptions) {
              // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ subscriptions: subscriptions })              
              }
            }
          );
        });     
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }       
  });   
  // app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.subscriptions, userController.authorize, function(req, res, next) {
      
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }

  //     stripe.subscriptions.retrieveSubscription(customerId, subscriptionId)
  // });   

  // CARDS
  // app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, userController.authorize, function(req, res, next) {
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  //     stripe.cards.createSource(customerId, params)
  // });   
  // app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, userController.authorize, function(req, res, next) {
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  //     stripe.cards.listCards(customerId)
  // });   
  // app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, userController.authorize, function(req, res, next) {
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  //     stripe.cards.retrieveCard(customerId, cardId)
  // });   
  // app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, userController.authorize, function(req, res, next) {
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  //     stripe.cards.updateCard(customerId, cardId, params)
  // });   
  // app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, userController.authorize, function(req, res, next) {
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  //     stripe.cards.deleteCard(customerId, cardId)
  // });   
  // app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.cards, userController.authorize, function(req, res, next) {
  //     if(req.user._id !== req.params.uid) {
  //         logger.info("unauthorized uid");
  //         return res.json({ status: 401, msg: "Unauthorized" });
  //     }      
  //     stripe.cards.deleteDiscount(customerId)
  // });     

  // // EVENTS (types of events)
  /*
      Get user events and display in notifications list
  */
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.events, userController.authorize, function(req, res, next) {
      
      logger.trace('getting user events history');
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }
          stripe.events.list({ limit: limit, starting_after: starting_after }, function(err, events) {
              if(err) {
                logger.error(err)
                res.json({ error: err })                                     
              } else {
                logger.info("events sent");
                res.json({events:events})
              }
          });
        })  
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }           
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
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.plans, userController.authorize, function(req, res, next) {
      logger.info("creating new plan");
      var user_id = req.params.uid

      if (req.body.amount > 500000) {
        return res.send({ 
          status: 407,
          error: { 
            message: 'Amount cannot be greater than $5,000' 
          } 
        });
      }

      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var statement_desc = req.body.statement_descriptor || ""
          var params = {
            id: req.body.id,          
            amount: req.body.amount,
            interval: req.body.interval,
            interval_count: req.body.interval_count,
            name: req.body.name,
            currency: req.body.currency,
            trial_period_days: req.body.trial_period_days || 0,
            statement_descriptor: req.body.statement_descriptor || ""
          };
          logger.debug(params);
          stripe.plans.create(params, function(err, plan) {
              if(err) {
                logger.error(err)
                return res.json(400, { error: err })                                    
              } else {
                logger.debug("plan creation success");
                res.json({ plan: plan })
              }
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });          
      }      
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
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.plans, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.debug('getting user plans')
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }        
          stripe.plans.list({ limit: limit, starting_after: starting_after },
            function(err, plans) {
              // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ plans: plans })              
              }
            }
          );
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });  

  // delegated user plan retrieval
  app.get(endpoint.version + endpoint.base + endpoint.plans + "/:delegate_username", userController.authorize, function(req, res, next) {
      logger.debug('getting delegated user plans') // get user by username delegated // 2
      
      try {
        var username = req.params.delegate_username
        userController.getDelegatedUserByUsername(username).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }        
          stripe.plans.list({ limit: limit, starting_after: starting_after },
            function(err, plans) {
              // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ plans: plans })              
              }
            }
          );
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });  


  // Used to POST (update) a plan
  app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.plans + "/:plan_id", userController.authorize, function(req, res, next) {
      
      logger.info("update plan request");

      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      if (req.body.amount > 150000) {
        return res.status(407).send({ message: 'Amount cannot be greater than $1,500' });
      }

      try {
        var plan_id = req.params.plan_id;
        var user_id = req.params.uid;

        logger.info(req.body);

        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var statement_desc = req.body.statement_descriptor || ""
          var params = {
            name: req.body.name,
            statement_descriptor: req.body.statement_descriptor || ""
          };
          stripe.plans.update(plan_id, params, function(err, plan) {
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ plan: plan })              
              }     
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  }); 

  // Used to GET (retrieve) a single plan
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.plans + "/:plan_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var plan_id = req.params.plan_id;
        var user_id = req.params.uid;
        logger.info("getting individual plan info");
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          stripe.plans.retrieve(plan_id, function(err, plan) {
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                logger.info(plan);
                res.json({ plan: plan })              
              }
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  }); 

  // Used to DELETE a single plan
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.plans + "/:plan_id", userController.authorize, function(req, res, next) {
      logger.debug("deleting plan ", plan_id)

      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var plan_id = req.params.plan_id;
        var user_id = req.params.uid;    
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          stripe.plans.del(plan_id, function(err, confirmation) {
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ confirmation: confirmation })              
              }   
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  }); 

  // PRODUCTS
  // stripe.products.create(params)
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.products, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
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
                res.json({ error: err })                                        
              } else {
                res.json({ product: product })              
              }  
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  }); 
  // stripe.products.list([params])
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.products, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.debug('getting products')
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }        
          stripe.products.list({ limit: limit, starting_after: starting_after },
            function(err, products) {
              // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ products: products })              
              }
            }
          );
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });  
  // stripe.products.update(productId[, params])
  app.put(endpoint.version + endpoint.base + "/:uid" + endpoint.products + "/:product_id", userController.authorize, function(req, res, next) {
      
      logger.info("update products request");

      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
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
                res.json({ error: err })                                        
              } else {
                res.json({ product: product })              
              }
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  }); 

  // Used to GET (retrieve) a single product
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.products + "/:product_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var product_id = req.params.product_id;
        var user_id = req.params.uid;
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          stripe.products.retrieve(product_id, function(err, product) {
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ product: product })              
              }    
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });


  // Used to delete a single product
  app.delete(endpoint.version + endpoint.base + "/:uid" + endpoint.products + "/:product_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
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
                res.json({ error: err })                                        
              } else {
                logger.info(confirmation)    
                res.json({ confirmation: confirmation })              
              }     
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
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
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.transfers, userController.authorize, function(req, res, next) {
      //logger.debug('creating transfer...');
      var user_id = req.params.uid
      //logger.debug('in transfer create')

      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      if (req.body.amount > 150000) {
        return res.status(407).send({ message: 'Amount cannot be greater than $1,500' });
      }

      try {
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
                res.json({ error: err })                                        
              } else {
                res.json({ transfer: transfer })              
              }
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  }); 
  // stripe.transfers.list([params])
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.transfers, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.debug('getting transfers')
        var user_id = req.params.uid
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var limit = req.query.limit || 100;
          var starting_after;
          if(req.query.starting_after != undefined) {
            starting_after = req.query.starting_after;
          }        
          stripe.transfers.list({ limit: limit, starting_after: starting_after },
            function(err, transfers) {
              // asynchronously called
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ transfers: transfers })              
              }
            }
          );
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });  

  // stripe.transfers.retrieve(transferI_id)
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.transfers + "/:transfer_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var transfer_id = req.params.transfer_id;
        var user_id = req.params.uid;
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          //logger.debug(transfer_id);
          stripe.transfers.retrieve(transfer_id, function(err, transfer) {
              if(err) {
                logger.error(err)
                res.json({ error: err })                                        
              } else {
                res.json({ transfer: transfer })              
              }     
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });
  
  // stripe.transfers.update(transferId[, params])
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.transfers + "/:transfer_id", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
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
                res.json({ error: err })                                        
              } else {
                res.json({ transfer: transfer })              
              }
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  }); 
  // stripe.transfers.reverse(transferId[, params])
  // stripe.transfers.cancel(transferId) (Deprecated -- use reverse)
  // stripe.transfers.listTransactions(transferId[, params])
  // stripe.transfers.setMetadata(transferId, metadataObject) (metadata info)
  // stripe.transfers.setMetadata(transferId, key, value)
  // stripe.transfers.getMetadata(transferId)


  // BITCOIN (resource bitcoinReceivers)
  // stripe.bitcoinReceivers.create(params)
  // Use own stripe keys to create bitcoin receivers for now, then do a delegated charge
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.bitcoin, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      if (req.body.amount > 150000) {
          return res.status(407).send({ message: 'Amount cannot be greater than $1,500' });
      }

      try {
        // use our own stripe account for now as a workaround
        var user_id = req.params.uid;        
        var stripe = require("stripe")(options.apiKey);
        userController.getUser(user_id).then(function (user) {
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
                res.json({ error: err })                                        
              } else {
                res.json({ receiver: receiver })              
              }
              // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });  
  // stripe.bitcoinReceivers.retrieve(receiverId)
  app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.bitcoin + "/:btc", userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.trace("requesting bitcoin receiver")
        var user_id = req.params.uid;
        var bitcoin_receiver_id = req.params.btc;
        // use our own stripe account for now as a workaround
        var stripe = require("stripe")(options.apiKey);
        userController.getUser(user_id).then(function (user) {
          stripe.bitcoinReceivers.retrieve(bitcoin_receiver_id, function(err, receiver) {
              if(err) {
                logger.error(err)
                return res.json({ error: err })                                        
              }          
              logger.trace("is bitcoin receiver filled? ", receiver.filled)
              // asynchronously called
              if (receiver.filled) {
                // create a bitcoin transfer on receiver filled
                var amountInCents = receiver.amount;
                var application_fee = Math.round((amountInCents*0.002));
                var description = "New transfer in the amount of " + format.getCommaSeparatedFormat("USD", amountInCents/100);
                logger.info("receiver amount in cents", receiver.amount);
                logger.info("application fee", application_fee);
                logger.info("description", description);
                logger.info("source", receiver.id);
                var params = {
                  amount: receiver.amount,
                  application_fee: application_fee,
                  currency: receiver.currency,
                  source: receiver.id,
                  description: description,
                  destination: user.stripe.accountId
                }
                // use our own stripe account for now, transfer amount to destination acct
                stripe.charges.create(params, function(err, charge) {
                    if(err) {
                      logger.error(err)
                      return res.json({ error: err })                    
                    } else {
                      res.json({ receiver: receiver }).end();
                    }                         
                });
              } else {
                  res.json({ receiver: receiver })
              }
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });    
  // stripe.bitcoinReceivers.list([params])
  // stripe.bitcoinReceivers.getMetadata(receiverId)

  // ACH With Destination Paramters
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.ach  + "/:delegate_username", userController.authorize, function(req, res, next) {
      
      logger.info("hit ach endpoint");

      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.trace("requesting ach")
        var user_id = req.params.uid;
        var delegate_user = req.params.delegate_username;
        // use our own stripe account, transfer to destination as a charge
        var stripe = require("stripe")(options.apiKey);
        userController.getUser(user_id).then(function (user) {
            // create a ach transfer on charge
            var amountInCents = req.body.amount;
            var customer_id = req.body.customer_id;
            var application_fee = Math.round((amountInCents*0.002));
            var description = "New transfer in the amount of " + format.getCommaSeparatedFormat("USD", amountInCents/100);
            logger.info("amount in cents", amountInCents);
            logger.info("application fee", application_fee);
            logger.info("description", description);
            logger.info("customer", customer_id);
            var params = {
              amount: amountInCents,
              application_fee: application_fee,
              currency: "usd",
              // customer: customer_id,
              source: req.body.token,
              description: description,
              destination: user.stripe.accountId
            }
            // use our own stripe account for now, transfer amount to destination acct
            stripe.charges.create(params, function(err, charge) {
                if(err) {
                  logger.error(err)
                  return res.send({ 
                    status: 407,
                    error: { 
                      message: err
                    } 
                  });
                } else {
                  res.json({ charge: charge }).end();
                }                         
            });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
            status: 407,
            error: { 
              message: err
            } 
          });        
      }      
  });    

  // stripe.fileUploads // upload and multer imported above
  // /v1/stripe/5asdg98a09sdf/upload/
  // note the file multipart name must be 'document' aka post with multi-part form data { document: "/path/to/file", purpose: identity_document }
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.upload, upload.single('document'), userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        logger.info("uploading document")
        var user_id = req.params.uid;
        userController.getUser(user_id).then(function (user) {
          var stripe = require('stripe')(user.stripe.secretKey);
          var path = req.file.path;
          var fp = fs.readFileSync(path);
          var hat = require('hat');
          var rack = hat.rack(); 
          var file_name = req.file.filename + "_" + rack() + ".jpg";
          stripe.fileUploads.create({
            purpose: req.body.purpose,
            file: {
              data: fp,
              name: file_name,
              type: 'application/octet-stream'
            }
          }, function(err, fileUpload) {
            if(err) {
              logger.error(err);
              res.json({ error: err });            
            }
            logger.info("document upload success");
            var params = {
              legal_entity: {
                verification: {
                  document: fileUpload.id
                }
              }
            }
            stripe.accounts.update(user.stripe.accountId, params, function(err, account) {
                res.json({ account: account });
            });
            // asynchronously called
          });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });

  // @TODO
  // VERIFICATION
  app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.verify, userController.authorize, function(req, res, next) {
      
      if(req.user._id !== req.params.uid) {
        logger.info("unauthorized uid");
        return res.json({ status: 401, msg: "Unauthorized" });
      }

      try {
        var user_id = req.params.uid;
        userController.getUser(user_id).then(function (user) {
          // Set your secret key: remember to change this to your live secret key in production
          // See your keys here https://dashboard.stripe.com/account/apikeys
          // 32, 45 amounts for testing
          var stripe = require('stripe')(user.stripe.secretKey);

          var data = { amounts: [req.body.amount1, req.body.amount2] }
          stripe.customers.verifySource(
            req.body.customer_id,
            req.body.bank_token,
            data,
            function(err, bankAccount) {
              if(err) {
                logger.error(err);
                return
              } else {
                res.json({bank: bankAccount});
              }
            });
        });
      } catch(err) {
          logger.error(err);
          return res.send({ 
          	status: 407,
          	error: { 
          	  message: err
          	} 
          });        
      }      
  });  

}