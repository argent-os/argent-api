module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/plaid',
		exchange_token: '/exchange_token',     
		auth: '/auth',  
		upgrade: '/upgrade'    		     		     
	};

	// var endpoint = {
	// 	version: '/v1',
	// 	base: '/plaid',
	// 	ping: '/ping',
	// 	exchange: '/exchange',     
	// 	auth: '/auth',      		     
	// 	connect: '/connect',    		        		     
	// 	income: '/income',    		        		     
	// 	info: '/info',    		        		     
	// 	risk: '/risk',    		     
	// 	balance: '/balance',    		     
	// 	upgrade: '/upgrade',    		     
	// 	longtail: '/longtail'  		     
	// };

  	var userController = require('../auth/controllers/user-controller');
	var log4js = require('log4js');
	var logger = log4js.getLogger();
	var cors = require('cors');
	var bodyParser = require('body-parser');
	var expressValidator = require('express-validator');
	app.use(cors());
	app.use(bodyParser.json());
	app.use(expressValidator());

	var plaid = require('plaid');
	var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
	var PLAID_SECRET = process.env.PLAID_SECRET;
	var PLAID_ACCOUNT_ID = process.env.PLAID_ACCOUNT_ID; // switch to env var

	var PLAID_ENV;
  	process.env.ENVIRONMENT == 'DEV' ? PLAID_ENV = plaid.environments.tartan : '';
  	process.env.ENVIRONMENT == 'PROD' ? PLAID_ENV = plaid.environments.production : '';

	// Initialize client
	var plaidClient = new plaid.Client(PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV);

	// TODO: Secure Plaid endpoints with JWT Authentication middleware

	// PING
	// curl -X POST -i -H "Content-Type: application/json" http://192.168.1.232:5001/v1/plaid/ping
	app.post(endpoint.version + endpoint.base + endpoint.ping, userController.authorize, function(req, res, next) {
		logger.trace('req received');
		res.json({msg:"ok"})
	});

	// Example MFA Auth (unsecured) local

	// ** Be sure the quotes are straight, not curly

	// curl -X POST -i -H "Content-Type: application/json" -d '{"institution_type": "bofa", "credentials":{"username":"plaid_test", "password": "plaid_good"}}' http://192.168.1.232:5001/v1/plaid/auth
	   
	// Example MFA Auth AWS

	// curl -X POST -i -H "Content-Type: application/json" -d '{"institution_type": "bofa", "credentials":{"username":"plaid_test", "password": "plaid_good"}}' http://proton-api-dev.us-east-1.elasticbeanstalk.com/v1/plaid/auth	   

	// // AUTH
	// app.post(endpoint.version + endpoint.base + endpoint.auth, function(req, res, next) {
	// 	logger.trace('req addAuthUser received');
	// 	// addAuthUser(String, Object, Object?, Function)
	// 	var institution_type = req.body.institution_type;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;
	// 	plaidClient.addAuthUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	});
	// });
	// app.post(endpoint.version + endpoint.base + endpoint.auth, userController.authorize, function(req, res, next) {
	// 	logger.trace('req stepAuthUser received');
	// 	// stepAuthUser(String, String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var mfaResponse = req.body.mfaResponse;
	// 	var options = req.body.options;
	// 	plaidClient.stepAuthUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });

	// // curl -X GET -i -H "Content-Type: application/json" -d '{"access_token": "test_bofa"}' http://192.168.1.232:5001/v1/plaid/auth
	// app.get(endpoint.version + endpoint.base + "/:uid" + endpoint.auth, userController.authorize, function(req, res, next) {
		
	// 	if(req.user._id !== req.params.uid) {
 //        	logger.info("unauthorized uid");
 //        	return res.json({ status: 401, msg: "Unauthorized" });
 //      	}

	// 	logger.trace('req getAuthUser received');
	// 	// getAuthUser(String, Object?, Function)
	// 	var user_id = req.params.uid;
	// 	var options = req.body.access_token || req.query.access_token || req.params.access_token;		
	// 	userController.getUser(user_id).then(function (user, err) { 
	// 		var access_token = user.plaid.access_token			
	// 		plaidClient.getAuthUser(access_token, options, function callback(err, response) {
	// 		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 			logger.error(err);
	// 			logger.info(response);

	// 			if(err) {
	// 				res.json({err: err})
	// 			}
	// 			res.json({response: response})
	// 		})
	// 	});
	// });
	// app.patch(endpoint.version + endpoint.base + endpoint.auth, userController.authorize, function(req, res, next) {
	// 	logger.trace('req patchAuthUser received');
	// 	// patchAuthUser(String, Object, Object? Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;		
	// 	plaidClient.patchAuthUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}    
	// 	})
	// });
	// app.delete(endpoint.version + endpoint.base + endpoint.auth, userController.authorize, function(req, res, next) {
	// 	logger.trace('req deleteAuthUser received');
	// 	// deleteAuthUser(String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var options = req.body.options;		
	// 	plaidClient.deleteAuthUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);		

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})
	// 	})
	// });

	// // CONNECT
	// app.post(endpoint.version + endpoint.base + endpoint.connect, userController.authorize, function(req, res, next) {
	// 	logger.trace('req addConnectUser received');
	// 	// addConnectUser(String, Object, Object?, Function)
	// 	var institution_type = req.body.institution_type;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;		
	// 	plaidClient.addConnectUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.post(endpoint.version + endpoint.base + endpoint.connect, userController.authorize, function(req, res, next) {
	// 	logger.trace('req stepConnectUser received');
	// 	// stepConnectUser(String, String, Object?, Function)
	// 	var institution_type = req.body.institution_type;
	// 	var mfaResponse = req.body.mfaResponse;
	// 	var options = req.body.options;		
	// 	plaidClient.stepConnectUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);		

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.get(endpoint.version + endpoint.base + endpoint.connect, userController.authorize, function(req, res, next) {
	// 	logger.trace('req getConnectUser received');
	// 	// getConnectUser(String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var options = req.body.options;		
	// 	plaidClient.getConnectUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})
	// 	})
	// });
	// app.patch(endpoint.version + endpoint.base + endpoint.connect, userController.authorize, function(req, res, next) {
	// 	logger.trace('req patchConnectUsert received');
	// 	// patchConnectUser(String, Object, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;		
	// 	plaidClient.patchConnectUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.delete(endpoint.version + endpoint.base + endpoint.connect, userController.authorize, function(req, res, next) {
	// 	logger.trace('req deleteConnectUser received');
	// 	// deleteConnectUser(String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var options = req.body.options;		
	// 	plaidClient.deleteConnectUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})	  
	// 	})
	// });

	// // INCOME
	// app.post(endpoint.version + endpoint.base + endpoint.income, userController.authorize, function(req, res, next) {
	// 	logger.trace('req addIncomeUser received');
	// 	// addIncomeUser(String, Object, Object?, Function)
	// 	var institution_type = req.body.institution_type;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;		
	// 	plaidClient.addIncomeUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.post(endpoint.version + endpoint.base + endpoint.income, userController.authorize, function(req, res, next) {
	// 	logger.trace('req stepIncomeUser received');
	// 	// stepIncomeUser(String, String, Object, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var mfaResponse = req.body.mfaResponse;
	// 	var options = req.body.options;		
	// 	plaidClient.stepIncomeUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.get(endpoint.version + endpoint.base + endpoint.income, userController.authorize, function(req, res, next) {
	// 	logger.trace('req getIncomeUser received');
	// 	// getIncomeUser(String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var options = req.body.options;		
	// 	plaidClient.getIncomeUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})	  
	// 	})
	// });
	// app.patch(endpoint.version + endpoint.base + endpoint.income, userController.authorize, function(req, res, next) {
	// 	logger.trace('req patchIncomeUser received');
	// 	// patchIncomeUser(String, Object, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;		
	// 	plaidClient.patchIncomeUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);		

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.delete(endpoint.version + endpoint.base + endpoint.income, userController.authorize, function(req, res, next) {
	// 	logger.trace('req deleteIncomeUser received');
	// 	// deleteIncomeUser(String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var options = req.body.options;		
	// 	plaidClient.deleteIncomeUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);		

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})
	// 	})
	// });

	// // INFO
	// app.post(endpoint.version + endpoint.base + endpoint.info, userController.authorize, function(req, res, next) {
	// 	logger.trace('req addInfoUser received');
	// 	// addInfoUser(String, Object, Object?, Function)
	// 	var institution_type = req.body.institution_type;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;		
	// 	plaidClient.addInfoUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.post(endpoint.version + endpoint.base + endpoint.info, userController.authorize, function(req, res, next) {
	// 	logger.trace('req stepInfoUser received'); 
	// 	// stepInfoUser(String, String, Object, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var mfaResponse = req.body.mfaResponse;
	// 	var options = req.body.options;		
	// 	plaidClient.stepInfoUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}   
	// 	})
	// });
	// app.get(endpoint.version + endpoint.base + endpoint.info, userController.authorize, function(req, res, next) {
	// 	logger.trace('req getInfoUser received');
	// 	// getInfoUser(String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var options = req.body.options;		
	// 	plaidClient.getInfoUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})	  
	// 	})
	// });
	// app.patch(endpoint.version + endpoint.base + endpoint.info, userController.authorize, function(req, res, next) {
	// 	logger.trace('req patchInfoUser received');
	// 	// patchInfoUser(String, Object, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;		
	// 	plaidClient.patchInfoUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.delete(endpoint.version + endpoint.base + endpoint.info, userController.authorize, function(req, res, next) {
	// 	logger.trace('req deleteInfoUser received');
	// 	// deleteInfoUser(String, Object?, Function)
	// 	var access_token = req.body.institution_type;
	// 	var options = req.body.options;		
	// 	plaidClient.deleteInfoUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})	  
	// 	})
	// });

	// // RISK
	// app.post(endpoint.version + endpoint.base + endpoint.risk, userController.authorize, function(req, res, next) {
	// 	logger.trace('req addRiskUser received');
	// 	// addRiskUser(String, Object, Object?, Function)
	// 	var institution_type = req.body.institution_type;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;		
	// 	plaidClient.addRiskUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.post(endpoint.version + endpoint.base + endpoint.risk, userController.authorize, function(req, res, next) {
	// 	logger.trace('req stepRiskUser received');
	// 	// stepRiskUser(String, String, Object, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var mfaResponse = req.body.mfaResponse;
	// 	var options = req.body.options;		
	// 	plaidClient.stepRiskUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.get(endpoint.version + endpoint.base + endpoint.risk, userController.authorize, function(req, res, next) {
	// 	logger.trace('req getRiskUser received');
	// 	// getRiskUser(String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var options = req.body.options;		
	// 	plaidClient.getRiskUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})	  
	// 	})
	// });
	// app.patch(endpoint.version + endpoint.base + endpoint.risk, userController.authorize, function(req, res, next) {
	// 	logger.trace('req patchRiskUser received');
	// 	// patchRiskUser(String, Object, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var credentials = req.body.credentials;
	// 	var options = req.body.options;
	// 	plaidClient.patchRiskUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 	  // mfaResponse can be any type of Plaid MFA flow
	// 		logger.error(err);
	// 		logger.info(mfaResponse);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}

	// 		if(mfaResponse) {
	// 			res.json({mfa: mfaResponse, response: response})
	// 		} else {
	// 			res.json({response: response})	  
	// 		}  
	// 	})
	// });
	// app.delete(endpoint.version + endpoint.base + endpoint.risk, userController.authorize, function(req, res, next) {
	// 	logger.trace('req deleteIncomeUser received');
	// 	// deleteRiskUser(String, Object?, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	var options = req.body.options;
	// 	plaidClient.deleteIncomeUser(access_token, options, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})	  
	// 	})
	// });

	// UTILITY
	// app.get(endpoint.version + endpoint.base + endpoint.balance, userController.authorize, function(req, res, next) {
	// 	logger.trace('req getBalance received');
	// 	// getBalance(String, Function)
	// 	var access_token = req.body.access_token || req.query.access_token || req.params.access_token;
	// 	plaidClient.getBalance(access_token, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})	  
	// 	})
	// });
	app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.upgrade, userController.authorize, function(req, res, next) {
		logger.trace('req upgrade plaid user received');
		// upgradeUser(String, String, Object?, Function)
		var user_id = req.params.uid;
		var upgrade_to = req.body.upgrade_to;
		var options = req.body.options || {};
		userController.getUser(user_id).then(function (user, err) { 
			var access_token = user.plaid.access_token			
			plaidClient.upgradeUser(access_token, upgrade_to, options, function callback(err, mfaResponse, response) {
				// err can be a network error or a Plaid API error (i.e. invalid credentials)
				// mfaResponse can be any type of Plaid MFA flow
				// logger.info(mfaResponse);
				// logger.info(response);		

				if(err) {
					logger.error(err);					
					res.json({err: err})
				}

				if(mfaResponse) {
					res.json({mfa: mfaResponse, response: response})
				} else {
					var calcRiskArray = [];
					var totalRiskScore = 0;
					for(var i = 0; i<response.accounts.length; i++) {
						totalRiskScore += response.accounts[i].risk.score;
						calcRiskArray.push(response.accounts[i].risk.score)
					}
					var weightedAverageRiskScore = totalRiskScore/response.accounts.length;
					res.json({score: weightedAverageRiskScore})	  
				}  
			})
		})
	});

	// /v1/plaid/:uid/exchange_token/:acct_id
	app.post(endpoint.version + endpoint.base + "/:uid" + endpoint.exchange_token + "/:public_token" /*+ "/:acct_id"*/, function(req, res, next) {
		logger.trace('req plaid exchange token received');
		logger.debug(req.body);
		// Used for Plaid Link
		// The public_token is the access token returned by plaid link

		try {
			var user_id = req.params.uid;
			var public_token = req.params.public_token;
	      	userController.getUser(user_id).then(function (user, err) { 
				// Exchange a public_token and account_id for a Plaid access_token
	  			// and a Stripe bank account token
	  			// TODO: Remove account id for now
				plaidClient.exchangeToken(public_token, function(err, tokenResponse) {
				  if (err != null) {
				  	logger.error(err);
				    res.json({ error: err });
				  } else {
				  	logger.info(tokenResponse)
					// This is your Plaid access token - store somewhere persistent
					// The access_token can be used to make Plaid API calls to
					// retrieve accounts and transactions
					var access_token = tokenResponse.access_token;

					plaidClient.getAuthUser(access_token, function(err, data) {
						// logger.info(data.accounts);
						// use the account response data to create a stripe token
	        			var stripe = require('stripe')(user.stripe.secretKey);

	        			logger.info("about to create bank token")

	        			// TODO: Make dynamic
						var routing_number = data.accounts[0].numbers.routing;
						var account_number = data.accounts[0].numbers.account;

						process.env.ENVIRONMENT == 'DEV' ? bank_account = {
						  bank_account: {
							country: 'US',
							currency: 'usd',
							account_holder_name: 'Jane Austen',
							account_holder_type: 'individual',
							routing_number: '110000000',
							account_number: '000123456789'
						  }
						} : '';

						process.env.ENVIRONMENT == 'PROD' ? bank_account = {
						  bank_account: {
						    country: user.country,
						    currency: 'usd',
						    account_holder_name: (user.first_name + user.last_name) || "No Name Provided",
						    account_holder_type: user.legal_entity.type,
						    routing_number: routing_number,
						    account_number: account_number
						  }
						} : '';

						stripe.tokens.create(bank_account, function(err, token) {
							if(err) {
								logger.error(err);
								return res.json({ error: err })
							} else {
								// This is your Stripe bank account token - store somewhere
								// persistent. The token can be used to move money via						
								// For Stripe's ACH API.
								var bank_account_token = token.id;
								// asynchronously called
								logger.info("got the bank tokens")
								var resp = { 
									response: {
										stripe_bank_account_token: bank_account_token,
										access_token: access_token
									} 
								}
								logger.info(resp);
								res.json(resp);
							}
						});
					});
				  }
				});
	      	})
	    } catch(err) {
	        logger.error(err);
	        return res.json({ err: err })        
	    }      	
	})
	// app.get(endpoint.version + endpoint.base + endpoint.longtail, userController.authorize, function(req, res, next) {
	// 	logger.trace('req getLongtailInstitutions received');
	// 	// getLongtailInstitutions(Object, Function)
	// 	var optionsObject = req.body.optionsObject;
	// 	plaidClient.getLongtailInstitutions(optionsObject, function callback(err, response) {
	// 	  // err can be a network error or a Plaid API error (i.e. invalid credentials)
	// 		logger.error(err);
	// 		logger.info(response);	

	// 		if(err) {
	// 			res.json({err: err})
	// 		}
	// 		res.json({response: response})	  
	// 	})
	// });

	return;
};