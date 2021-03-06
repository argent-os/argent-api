'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger();
var Stripe = require('stripe'),
stripe;

module.exports = exports = function stripeCustomer (schema, options) {
  stripe = Stripe(options.apiKey);

  schema.add({
    stripe: {
      accountId: String,
      secretKey: String,
      publishableKey: String, 
      customerId: String,
      subscriptionId: String,
      last4: String,
      plan: {
        type: String,
        default: options.defaultPlan
      }
    }
  });

  schema.pre('save', function (next) {
    var user = this;
    if(!user.isNew || user.stripe.customerId) return next();
    // creating a stripe account creates the customer, removes double entry
    user.createStripeAccount(function(err) {
      if (err) {
        logger.error(err);
        return next(err);
      }
      logger.trace('created user stripe account');          
      next();
    })
  });

  schema.post('save', function (next) {
    logger.info('user info saved');
  });

  schema.statics.getPlans = function () {
    return options.planData;
  };

  schema.methods.createStripeAccount = function(cb) {
    var user = this;
    // logger.debug(user.email);
    // logger.debug(user.country);
    logger.trace('inside create stripe account');
    // logger.info(user.legal_entity);
    var business_name;
    stripe.accounts.create({
        managed: true,
        legal_entity: {
          first_name: user.legal_entity.first_name || "",
          last_name: user.legal_entity.last_name || "",
          business_name: user.legal_entity.business_name || "",
          type: user.legal_entity.type,
          dob: {
            day: user.legal_entity.dob.day,
            month: user.legal_entity.dob.month,
            year: user.legal_entity.dob.year
          }
        },        
        tos_acceptance: {
          "date": user.tos_acceptance.date,
          "ip": user.tos_acceptance.ip
        },
        country: user.country,        
        email: user.email
      }, function(err, account){
        if (err) return cb(err);
        logger.info('stripe account creation success');
        // Need to save account info
        user.stripe.accountId = account.id
        user.stripe.secretKey = account.keys.secret
        user.stripe.publishableKey = account.keys.publishable
        user.save(function(err){
          if (err) return cb(err);
          logger.info('saving stripe data to database');          
          // logger.debug(user.stripe);
          return cb(null);
        });
        return cb();
    });      

    stripe.customers.create({
      email: user.email
    }, function(err, customer){
      if (err) return cb(err);
      user.stripe.customerId = customer.id;
      return cb(null);
    });
  };

  schema.methods.setCard = function(stripe_token, cb) {
    var user = this;

    var cardHandler = function(err, customer) {
      if (err) return cb(err);

      if(!user.stripe.customerId){
        user.stripe.customerId = customer.id;
      }

      var card = customer.cards ? customers.cards.data[0] : customer.sources.data[0];
      user.stripe.last4 = card.last4;
      user.save(function(err){
        if (err) return cb(err);
        return cb(null);
      });
    };

    if(user.stripe.customerId){
      stripe.customers.update(user.stripe.customerId, {card: stripe_token}, cardHandler);
    } else {
      stripe.customers.create({
        email: user.email,
        card: stripe_token
      }, cardHandler);
    }
  };

  schema.methods.setPlan = function(plan, cb) {
    var user = this;
    var _plan = plan;

    var subscriptionHandler = function(err, subscription) {
      // if(err) return cb(err);
      if(err)  {
        logger.debug(err);
      }
      if(subscription) {
        user.stripe.plan = _plan;
        user.stripe.subscriptionId = subscription.id;
        user.save(function(err, res){
          // logger.debug('saving');
          if(err) {
            logger.debug(err);
            return cb(err);
          } else {
            // logger.debug(res);
            return cb(null, res);
          }
          // if (err) return cb(err);
          // return cb(null);
        });
      }
    };

    var createSubscription = function(){
      stripe.customers.createSubscription(user.stripe.customerId, 
        {plan: _plan}, function (err, subscription) {
          subscriptionHandler(err, subscription)
        }
      );
    };

    if (user.stripe.subscriptionId){
      // update subscription
      stripe.customers.updateSubscription(
        user.stripe.customerId,
        user.stripe.subscriptionId,
        {plan: _plan}, function (err, subscription) {
          subscriptionHandler(err, subscription)
        }
      );
    } else {
      createSubscription();
    }

  };

  schema.methods.updateStripeEmail = function(cb){
    var user = this;

    if(!user.stripe.customerId) return cb();

    stripe.customers.update(user.stripe.customerId, {email: user.email}, function(err, customer) {
      cb(err);
    });
  };

  schema.methods.cancelStripe = function(cb){
    var user = this;

    if(user.stripe.customerId){
      stripe.customers.del(
        user.stripe.customerId
      ).then(function(confirmation) {
        cb();
      }, function(err) {
        return cb(err);
      });
    } else {
      cb();
    }
  };
};
