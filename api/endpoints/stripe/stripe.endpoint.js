// Set your secret key: remember to change this to your live secret key in production
// See your keys here https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe")("sk_test_jqQvmd0K1WbTSgP25zIgIWyp");

module.exports = function (app, options) {
  app.all('/v1/create-charge', function(req, res) {
    // (Assuming you're using express - expressjs.com)
    // Get the credit card details submitted by the form
    var stripeToken = req.body.stripeToken;
    var charge = stripe.charges.create({
      amount: 1000, // amount in cents, again
      currency: "usd",
      source: stripeToken,
      description: "Example charge"
    }, function(err, charge) {
      if (err && err.type === 'StripeCardError') {
        // The card has been declined
        res.json({msg: err});
      } else {
        res.json({msg: 'customer charged'});
      }
    });
  });

  // EXAMPLE
  // curl -X POST \
  //   -H "Content-Type: application/json" \
  //   -u sk_test_jqQvmd0K1WbTSgP25zIgIWyp: \
  //   -d '{"customer":"cus_80JM7yd0HXslf6"}' \
  //      http://localhost:5001/v1/charge-existing-customer 
  app.all('/v1/charge-existing-customer', function(req,res) {
    var stripeToken = req.body.stripeToken;
    console.log(req.body);
    console.log(req.is('json'))
    stripe.charges.create({
        amount: 6543, // amount in cents, again
        currency: "usd",
        customer: req.body.customer
      }).then(function(charge) {
        console.log(charge);
        res.json({msg: "success"})
    }, function(err) {
        res.json({msg: err})
    });
  })

  // app.all('/v1/charge-new-customer', function(req,res) {
  //   var stripeToken = req.body.stripeToken;
  //   stripe.customers.create({
  //     source: stripeToken,
  //     description: 'payinguser@example.com'
  //   }).then(function(customer) {
  //     return stripe.charges.create({
  //       amount: 1000, // amount in cents, again
  //       currency: "usd",
  //       customer: customer.id
  //     });
  //   }).then(function(charge) {
  //     console.log(charge);
  //     // YOUR CODE: Save the customer ID and other info in a database for later!
  //   });
  // })
}