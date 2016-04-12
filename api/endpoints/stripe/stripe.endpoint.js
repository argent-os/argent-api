module.exports = function (app, options) {

  var endpoint = {
    version: '/v1',
    base: '/stripe',
    ping: '/ping',
    account: '/account',     
    balance: '/balance',               
    charges: '/charges',                         
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
      var stripe = require("stripe")(options.apiKey);

  //   EXAMPLE REQUEST
  //   curl -X POST \
  //   -H "Content-Type: application/json" \
  //   -u sk_test_jqQvmd0K1WbTSgP25zIgIWyp: \
  //   -d '{"customer":"cus_80JM7yd0HXslf6", "amount": 54322, "currency": "usd"}' \
  //      http://192.168.1.232:5001/v1/stripe/charge
  app.post(endpoint.version + endpoint.base + endpoint.charges, function(req, res, next) {
    logger.trace('charge request received');
    var stripeToken = req.body.stripeToken;
    var amount = req.body.amount;
    var currency = req.body.currency;
    var customer = req.body.customer;
    var chargeObject = {
        amount: amount, // amount in cents, again
        currency: currency,
        customer: customer
    }
    stripe.charges.create(chargeObject).then(function(res) {
        logger.info("charge success");
        return res.json({msg: "success", charge: res}).end();
    }, function(err) {
        logger.error(err);
        return res.json({msg: err}).end();
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
      logger.debug(cardObject);
      logger.debug(accountId);
      logger.debug("debugging");

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
  app.put(endpoint.version + endpoint.base + endpoint.balance, function(req, res, next) {
      stripe.balance.retrieve().then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });  
  app.put(endpoint.version + endpoint.base + endpoint.balance, function(req, res, next) {
      var params = {"foo": "bar"}
      stripe.balance.listTransactions(params).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  }); 
  app.put(endpoint.version + endpoint.base + endpoint.balance, function(req, res, next) {
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
  app.post(endpoint.version + endpoint.base + endpoint.charges + "/create", function(req, res, next) {
      logger.debug(req.body);
      userController.getUser(req.body.userId).then(function (user) {
        logger.info('utilizing proper secret key');
        var stripe = require('stripe')(user.stripe.secretKey);
        var params = {
          amount: req.body.amount,
          currency: "usd",
          customer: req.body.customerId,
          description: req.body.description
        }

        // Charge a card based on customer ID, the customer must have a linked credit card

        stripe.charges.create(params).then(function(charge, err) {
            logger.info(res)
            res.json({msg: "success", charge: charge}).end();
        }, function(err) {
            logger.error(err)
            res.json({msg: "error", err: err}).end();
        })
      }) 
  });
  app.get(endpoint.version + endpoint.base + endpoint.charges, function(req, res, next) {
      var params = {"foo": "bar"}
      stripe.charges.list([params]).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.put(endpoint.version + endpoint.base + endpoint.charges, function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.charges.retrieve(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.get(endpoint.version + endpoint.base + endpoint.charges, function(req, res, next) {
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
  app.post(endpoint.version + endpoint.base + endpoint.charges + "/refund", function(req, res, next) {
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
  app.put(endpoint.version + endpoint.base + endpoint.charges, function(req, res, next) {
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
  app.post(endpoint.version + endpoint.base + endpoint.charges + "/dispute/close", function(req, res, next) {
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
  app.post(endpoint.version + endpoint.base + endpoint.charges + "/meta", function(req, res, next) {
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
  app.get(endpoint.version + endpoint.base + endpoint.charges + "/meta", function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.charges.getMetadata(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.charges + "/mark/safe", function(req, res, next) {
      var chargeId = req.body.chargeId;
      stripe.charges.markAsSafe(chargeId).then(function(res) {
          logger.info(res)
          return res.json({msg: "success", res: res}).end();
      }, function(err) {
          logger.error(err)
          return res.json({msg: "error", err: err}).end();
      })
  });
  app.post(endpoint.version + endpoint.base + endpoint.charges + "/mark/fraud", function(req, res, next) {
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

  // // EVENTS (types of events)
  // stripe.events.list([params])
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