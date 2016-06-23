module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/email'	     
	};

  	var userController = require('../auth/controllers/user-controller');
	var sg = require('sendgrid').SendGrid(process.env.SENDGRID_API_KEY)
  	var mailer = require('../auth/lib/mailer');
	var log4js = require('log4js');
	var logger = log4js.getLogger();
	var cors = require('cors');
	var bodyParser = require('body-parser');
	var expressValidator = require('express-validator');
	var nconf = require('nconf');
	var config;
	app.use(cors());
	app.use(bodyParser.json());
	app.use(expressValidator()); 

	if (nconf.get('mailerSettings')) {
	  config = nconf.get('mailerSettings');
	}

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

		var email = req.body.email;
		var helper = require('sendgrid').mail
		message = 'Welcome to Argent! You can download the app here: https://itunes.apple.com/us/app/argent/id1110084542?mt=8'
		from_email = new helper.Email(process.env.SUPPORT_EMAIL)
		to_email = new helper.Email(email)
		subject = "Argent App Link"
		content = new helper.Content("text/plain", message)
		mail = new helper.Mail(from_email, subject, to_email, content)

		var requestBody = mail.toJSON()
		var request = sg.emptyRequest()
		request.method = 'POST'
		request.path = '/v3/mail/send'
		request.body = requestBody
		sg.API(request, function (response) {
			logger.info(response.statusCode)
			logger.info(response.body)
			logger.info(response.headers)
			res.json({status: response.statusCode, info: response, msg: 'message_sent'});
		})
	});

	return;
};