module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/plaid',
		ping: '/ping',
		exchange: '/exchange',     
		auth: '/auth',      		     
		connect: '/connect',    		        		     
		income: '/income',    		        		     
		info: '/info',    		        		     
		risk: '/risk',    		     
		balance: '/balance',    		     
		upgrade: '/upgrade',    		     
		longtail: '/longtail'  		     
	};

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
	var PLAID_ENV = plaid.environments.tartan; // plaid.environments.production

	// Initialize client
	var plaidClient = new plaid.Client(PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV);

	// TODO: Secure Plaid endpoints with JWT Authentication middleware

	// PING
	// curl -X POST -i -H "Content-Type: application/json" http://192.168.1.232:5001/v1/plaid/ping
	app.post(endpoint.version + endpoint.base + endpoint.ping, function(req, res, next) {
		logger.trace('req received');
		res.json({msg:"ok"})
	});

	// Example MFA Auth (unsecured) local

	// ** Be sure the quotes are straight, not curly

	// curl -X POST -i -H "Content-Type: application/json" -d '{"institution_type": "bofa", "credentials":{"username":"plaid_test", "password": "plaid_good"}}' http://192.168.1.232:5001/v1/plaid/auth
	   
	// Example MFA Auth AWS

	// curl -X POST -i -H "Content-Type: application/json" -d '{"institution_type": "bofa", "credentials":{"username":"plaid_test", "password": "plaid_good"}}' http://http://proton-api-dev.us-east-1.elasticbeanstalk.com/v1/plaid/auth	   

	// AUTH
	app.post(endpoint.version + endpoint.base + endpoint.auth, function(req, res, next) {
		logger.trace('req received');
		// addAuthUser(String, Object, Object?, Function)
		var institution_type = req.body.institution_type;
		var credentials = req.body.credentials;
		var options = req.body.options;
		plaidClient.addAuthUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}
		});
	});
	app.post(endpoint.version + endpoint.base + endpoint.auth, function(req, res, next) {
		logger.trace('req received');
		// stepAuthUser(String, String, Object?, Function)
		var access_token = req.body.access_token;
		var mfaResponse = req.body.mfaResponse;
		var options = req.body.options;
		plaidClient.stepAuthUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}
		})
	});
	app.get(endpoint.version + endpoint.base + endpoint.auth, function(req, res, next) {
		// getAuthUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;		
		plaidClient.getAuthUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}
		})
	});
	app.patch(endpoint.version + endpoint.base + endpoint.auth, function(req, res, next) {
		// patchAuthUser(String, Object, Object? Function)
		var access_token = req.body.access_token;
		var credentials = req.body.credentials;
		var options = req.body.options;		
		plaidClient.patchAuthUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.delete(endpoint.version + endpoint.base + endpoint.auth, function(req, res, next) {
		// deleteAuthUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;		
		plaidClient.deleteAuthUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);		

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})

		})
	});

	// CONNECT
	app.post(endpoint.version + endpoint.base + endpoint.connect, function(req, res, next) {
		// addConnectUser(String, Object, Object?, Function)
		var institution_type = req.body.institution_type;
		var credentials = req.body.credentials;
		var options = req.body.options;		
		plaidClient.addConnectUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.post(endpoint.version + endpoint.base + endpoint.connect, function(req, res, next) {
		// stepConnectUser(String, String, Object?, Function)
		var institution_type = req.body.institution_type;
		var mfaResponse = req.body.mfaResponse;
		var options = req.body.options;		
		plaidClient.stepConnectUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);		

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}  
		})
	});
	app.get(endpoint.version + endpoint.base + endpoint.connect, function(req, res, next) {
		// getConnectUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;		
		plaidClient.getConnectUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})	  
		})
	});
	app.patch(endpoint.version + endpoint.base + endpoint.connect, function(req, res, next) {
		// patchConnectUser(String, Object, Object?, Function)
		var access_token = req.body.access_token;
		var credentials = req.body.credentials;
		var options = req.body.options;		
		plaidClient.patchConnectUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.delete(endpoint.version + endpoint.base + endpoint.connect, function(req, res, next) {
		// deleteConnectUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;		
		plaidClient.deleteConnectUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})		  
		})
	});

	// INCOME
	app.post(endpoint.version + endpoint.base + endpoint.income, function(req, res, next) {
		// addIncomeUser(String, Object, Object?, Function)
		var institution_type = req.body.institution_type;
		var credentials = req.body.credentials;
		var options = req.body.options;		
		plaidClient.addIncomeUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.post(endpoint.version + endpoint.base + endpoint.income, function(req, res, next) {
		// stepIncomeUser(String, String, Object, Function)
		var access_token = req.body.access_token;
		var mfaResponse = req.body.mfaResponse;
		var options = req.body.options;		
		plaidClient.stepIncomeUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.get(endpoint.version + endpoint.base + endpoint.income, function(req, res, next) {
		// getIncomeUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;		
		plaidClient.getIncomeUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})		  
		})
	});
	app.patch(endpoint.version + endpoint.base + endpoint.income, function(req, res, next) {
		// patchIncomeUser(String, Object, Object?, Function)
		var access_token = req.body.access_token;
		var credentials = req.body.credentials;
		var options = req.body.options;		
		plaidClient.patchIncomeUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);		

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}  
		})
	});
	app.delete(endpoint.version + endpoint.base + endpoint.income, function(req, res, next) {
		// deleteIncomeUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;		
		plaidClient.deleteIncomeUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);		

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})	  
		})
	});

	// INFO
	app.post(endpoint.version + endpoint.base + endpoint.info, function(req, res, next) {
		// addInfoUser(String, Object, Object?, Function)
		var institution_type = req.body.institution_type;
		var credentials = req.body.credentials;
		var options = req.body.options;		
		plaidClient.addInfoUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.post(endpoint.version + endpoint.base + endpoint.info, function(req, res, next) {
		// stepInfoUser(String, String, Object, Function)
		var access_token = req.body.access_token;
		var mfaResponse = req.body.mfaResponse;
		var options = req.body.options;		
		plaidClient.stepInfoUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.get(endpoint.version + endpoint.base + endpoint.info, function(req, res, next) {
		// getInfoUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;		
		plaidClient.getInfoUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})		  
		})
	});
	app.patch(endpoint.version + endpoint.base + endpoint.info, function(req, res, next) {
		// patchInfoUser(String, Object, Object?, Function)
		var access_token = req.body.access_token;
		var credentials = req.body.credentials;
		var options = req.body.options;		
		plaidClient.patchInfoUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.delete(endpoint.version + endpoint.base + endpoint.info, function(req, res, next) {
		// deleteInfoUser(String, Object?, Function)
		var access_token = req.body.institution_type;
		var options = req.body.options;		
		plaidClient.deleteInfoUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})		  
		})
	});

	// RISK
	app.post(endpoint.version + endpoint.base + endpoint.risk, function(req, res, next) {
		// addRiskUser(String, Object, Object?, Function)
		var institution_type = req.body.institution_type;
		var credentials = req.body.credentials;
		var options = req.body.options;		
		plaidClient.addRiskUser(institution_type, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.post(endpoint.version + endpoint.base + endpoint.risk, function(req, res, next) {
		// stepRiskUser(String, String, Object, Function)
		var access_token = req.body.access_token;
		var mfaResponse = req.body.mfaResponse;
		var options = req.body.options;		
		plaidClient.stepRiskUser(access_token, mfaResponse, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.get(endpoint.version + endpoint.base + endpoint.risk, function(req, res, next) {
		// getRiskUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;		
		plaidClient.getRiskUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})		  
		})
	});
	app.patch(endpoint.version + endpoint.base + endpoint.risk, function(req, res, next) {
		// patchRiskUser(String, Object, Object?, Function)
		var access_token = req.body.access_token;
		var credentials = req.body.credentials;
		var options = req.body.options;
		plaidClient.patchRiskUser(access_token, credentials, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}	  
		})
	});
	app.delete(endpoint.version + endpoint.base + endpoint.risk, function(req, res, next) {
		// deleteRiskUser(String, Object?, Function)
		var access_token = req.body.access_token;
		var options = req.body.options;
		plaidClient.deleteIncomeUser(access_token, options, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})		  
		})
	});

	// UTILITY
	app.get(endpoint.version + endpoint.base + endpoint.balance, function(req, res, next) {
		// getBalance(String, Function)
		var access_token = req.body.access_token;
		plaidClient.getBalance(access_token, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})		  
		})
	});
	app.post(endpoint.version + endpoint.base + endpoint.upgrade, function(req, res, next) {
		// upgradeUser(String, String, Object?, Function)
		var access_token = req.body.access_token;
		var upgrade_to = req.body.upgrade_to;
		var options = req.body.options;
		plaidClient.upgradeUser(access_token, upgrade_to, options, function callback(err, mfaResponse, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
		  // mfaResponse can be any type of Plaid MFA flow
			logger.error(err);
			logger.info(mfaResponse);
			logger.info(response);		

			if(err) {
				res.json({err: err})
			}

			if(mfaResponse) {
				res.json({mfa: mfaResponse, response: response})
			} else {
				res.json({response: response})
			}  
		})
	});
	app.get(endpoint.version + endpoint.base + endpoint.exchange, function(req, res, next) {
		// Used for Plaid Link
		// exchangeToken(String, Function)
		// plaidClient.exchangeToken(public_token, callback);
		var public_token = req.query.public_token;
		var account_id = req.query.account_id;
		plaidClient.exchangeToken(public_token, function(err, tokenResponse) {
		  if (err != null) {
		    res.json({error: 'Unable to exchange public_token'});
		  } else {
		    var access_token = tokenResponse.access_token;
		  }
		});
	})
	app.get(endpoint.version + endpoint.base + endpoint.longtail, function(req, res, next) {
		// getLongtailInstitutions(Object, Function)
		var optionsObject = req.body.optionsObject;
		plaidClient.getLongtailInstitutions(optionsObject, function callback(err, response) {
		  // err can be a network error or a Plaid API error (i.e. invalid credentials)
			logger.error(err);
			logger.info(response);	

			if(err) {
				res.json({err: err})
			}

			res.json({response: response})		  
		})
	});

	return;
};