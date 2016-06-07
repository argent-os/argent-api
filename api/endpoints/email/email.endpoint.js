module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/email'	     
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

 //     TWILIO CONFIGURATION FOR FUTURE REFERENCE // If we choose to support text messaging in addition to email
 // 	var phoneNumber;
 // 	process.env.ENVIRONMENT == "DEV" ? phoneNumber = process.env.TWILIO_TEST_NUMBER : "";
 //  	process.env.ENVIRONMENT == "PROD" ? phoneNumber = process.env.TWILIO_NUMBER : "";
	
 //  	var accountSid;
 //  	process.env.ENVIRONMENT == "DEV" ? accountSid = process.env.TWILIO_TEST_SID : "";
 //  	process.env.ENVIRONMENT == "PROD" ? accountSid = process.env.TWILIO_SID : "";

 //  	var authToken;
 //  	process.env.ENVIRONMENT == "DEV" ? authToken = process.env.TWILIO_TEST_KEY : "";
 //  	process.env.ENVIRONMENT == "PROD" ? authToken = process.env.TWILIO_KEY : "";

  	// var client = require('twilio')(accountSid, authToken);
	// curl -X GET -i -H "Content-Type: application/json" -d '{"message": "foobar"}' http://192.168.1.232:5001/v1/message/6a4sh02hicnxmf28
	app.post(endpoint.version + endpoint.base, function(req, res, next) {
		//logger.info("got request")
		var email = req.body.email;
		var subject = "Argent App Link";
		var message = 'Welcome to Argent! You can download the app here: https://itunes.apple.com/us/app/argent/id1110084542?mt=8';
		mailer.sendAppLink(email, subject, message, function (err, info) {
			if (err) {
			  res.status(401).json({msg: 'error_sending_message', error: err}).end();
			  return;
			}
			else {
			  var msg = 'message_sent';
			  res.json({status: msg, info: info});
			}
		});
	});

	return;
};