module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/receipts',	     
		user: '/user'	     
	};

  	var userController = require('../auth/controllers/user-controller');
  	var mailer = require('../auth/lib/mailer');
	var sg = require('sendgrid').SendGrid(process.env.SENDGRID_API_KEY)  	
	var log4js = require('log4js');
	var logger = log4js.getLogger();
	var cors = require('cors');
	var bodyParser = require('body-parser');
	var expressValidator = require('express-validator');
	var hat = require('hat');
	var nconf = require('nconf');
	var config;
	app.use(cors());
	app.use(bodyParser.json());
	app.use(expressValidator()); 

	if (nconf.get('mailerSettings')) {
	  config = nconf.get('mailerSettings');
	}

	// curl -X GET -i -H "Content-Type: application/json" -d '{"message": "foobar"}' http://192.168.1.232:5001/v1/receipts/6a4sh02hicnxmf28/customer?=john@doe.com
	app.post(endpoint.version + endpoint.base + "/:uid" + "/customer", function(req, res, next) {
		logger.trace('req receipt received');
		var user_id = req.params.uid;
		var cust_email = req.query.email;
		var message = req.body.message;
		var rack = hat.rack(); 		
		userController.getUser(user_id).then(function (user, err) { 
			if(err) {
				return res.status(409).send({ err: err })
			}
			var helper = require('sendgrid').mail
			var msg = "Merchant's Argent username @" + user.username + " \n\n" + message
			from_email = new helper.Email(config.mailerFrom)
			to_email = new helper.Email(cust_email)
			subject = "Your Receipt from Argent #" + rack() 
			content = new helper.Content("text/plain", msg)
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
	});

	return;
};