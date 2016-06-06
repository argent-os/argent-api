module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/receipts',	     
		user: '/user'	     
	};

  	var userController = require('../auth/controllers/user-controller');
  	var mailer      = require('../auth/lib/mailer');
	var log4js = require('log4js');
	var logger = log4js.getLogger();
	var cors = require('cors');
	var bodyParser = require('body-parser');
	var expressValidator = require('express-validator');
	app.use(cors());
	app.use(bodyParser.json());
	app.use(expressValidator());

	// curl -X GET -i -H "Content-Type: application/json" -d '{"message": "foobar"}' http://192.168.1.232:5001/v1/receipts/6a4sh02hicnxmf28/customer?=john@doe.com
	app.post(endpoint.version + endpoint.base + "/:uid" + "/customer", function(req, res, next) {
		logger.trace('req receipt received');
		var user_id = req.params.uid;
		var cust_email = req.query.email;
		var message = req.body.message;
		userController.getUser(user_id).then(function (user, err) { 
			if(err) {
				res.json({err: err})
			}
			logger.trace("about to send receipt")
			mailer.sendReceipt(user, "Your Receipt from Argent", message, cust_email, function (err, info) {
				if (err) {
				  res.status(401).json({msg: 'error_sending_message', error: err});
				  logger.error(err);
				}
				else {
				  var msg = 'message_sent';
				  res.json({status: msg, info: info});
				}
			});
		});
	});

	return;
};