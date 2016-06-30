module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/message',	     
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

	app.post(endpoint.version + endpoint.base + "/:uid", userController.authorize, function(req, res, next) {
		logger.trace('support req message received');
		var user_id = req.params.uid;
		var subject = req.body.subject;
		var message = req.body.message;
		userController.getUser(user_id).then(function (user, err) { 
			if(err) {
				return res.status(409).send({err: err})
			}

			var helper = require('sendgrid').mail
			var rack = hat.rack();
			var msg = "Argent user @" + user.username + " | " + user.email + " sent a message.  Message: \n\n" + message
			from_email = new helper.Email(user.email)
			to_email = new helper.Email(process.env.SUPPORT_EMAIL)
			subject = subject + " id_"+rack()
			content = new helper.Content("text/plain", msg)
			mail = new helper.Mail(from_email, subject, to_email, content)

			var requestBody = mail.toJSON()
			var request = sg.emptyRequest()
			request.method = 'POST'
			request.path = '/v3/mail/send'
			request.body = requestBody
			sg.API(request, function (response) {
				// logger.info(response.statusCode)
				// logger.info(response.body)
				// logger.info(response.headers)
				res.json({status: response.statusCode, info: response, msg: 'message_sent'});
			})	
		});
	});

	app.post(endpoint.version + endpoint.base + endpoint.user + "/:username", userController.authorize, function(req, res, next) {
		logger.trace('send message received');
		var username = req.params.username;
		var message = req.body.message;
    	var rack = hat.rack(); 
		userController.getDelegatedUserByUsername(username).then(function (user, err) { 
			if(err) {
				return res.status(409).send({err: err})
			}

			var helper = require('sendgrid').mail
			var email = req.body.email;
			var message = "@" + user.username + "messaged you! Message: \n\n" + message;
			from_email = new helper.Email(process.env.SUPPORT_EMAIL)
			to_email = new helper.Email(email)
			subject = "Message from Argent User " + user.first_name + " #"+rack()
			content = new helper.Content("text/plain", message)
			mail = new helper.Mail(from_email, subject, to_email, content)

			var requestBody = mail.toJSON()
			var request = sg.emptyRequest()
			request.method = 'POST'
			request.path = '/v3/mail/send'
			request.body = requestBody
			sg.API(request, function (response) {
				// logger.info(response.statusCode)
				// logger.info(response.body)
				// logger.info(response.headers)
				res.json({status: response.statusCode, info: response, msg: 'message_sent'});
			})			
		});
	});

	return;
};