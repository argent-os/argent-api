module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/twilio'	     
	};

  	var userController = require('../auth/controllers/user-controller');
  	var mailer = require('../auth/lib/mailer');
	var log4js = require('log4js');
	var logger = log4js.getLogger();
	var cors = require('cors');
	var bodyParser = require('body-parser');
	var expressValidator = require('express-validator');
	app.use(cors());
	app.use(bodyParser.json());
	app.use(expressValidator()); 

	var phoneNumber;
	process.env.ENVIRONMENT == "DEV" ? phoneNumber = process.env.TWILIO_TEST_NUMBER : "";
  	process.env.ENVIRONMENT == "PROD" ? phoneNumber = process.env.TWILIO_NUMBER : "";
	
  	var accountSid;
  	process.env.ENVIRONMENT == "DEV" ? accountSid = process.env.TWILIO_TEST_SID : "";
  	process.env.ENVIRONMENT == "PROD" ? accountSid = process.env.TWILIO_SID : "";

  	var authToken;
  	process.env.ENVIRONMENT == "DEV" ? authToken = process.env.TWILIO_TEST_KEY : "";
  	process.env.ENVIRONMENT == "PROD" ? authToken = process.env.TWILIO_KEY : "";

  	var client = require('twilio')(accountSid, authToken);

	app.post(endpoint.version + endpoint.base, function(req, res, next) {
		logger.info("twilio req received")
		logger.info(req.body);
		var phone_number = req.body.phone;
		client.messages.create({
		    body: 'Welcome to Argent, download the app here: https://itunes.apple.com/us/app/argent/id1110084542?mt=8',
		    to: phone_number,  // Text this number
		    from: phoneNumber // From a valid Twilio number
		}, function(err, message) {
			if(err) {
        		// logger.error(err.message);
        		res.json({error: err})
        		return;
    		} else {
				// logger.trace(message.sid);
    		}
    		res.json({status: "message_sent"})
		});		
	})

	return;
};