module.exports = function (app, options) {

	var endpoint = {
		version: '/v1',
		base: '/scribe',
		subscriptions: '/subscriptions',
		ping: '/ping'
	};

  	var Scribe = require('./models/scribe.model');
  	var userController = require('../auth/controllers/user-controller');
	var log4js = require('log4js');
	var logger = log4js.getLogger();
	var cors = require('cors');
	var bodyParser = require('body-parser');
	var expressValidator = require('express-validator');
	app.use(cors());
	app.use(bodyParser.json());
	app.use(expressValidator());

	// PING
	// curl -X POST -i -H "Content-Type: application/json" http://localhost:5001/v1/scribe/ping or http://YOUR_IP_ADDRESS:5001/v1/scribe/ping
	app.post(endpoint.version + endpoint.base + endpoint.ping, function(req, res, next) {
		logger.trace('req received');
		res.json({msg:"success", status: 200})
	});

	// RESTful Operations

	// GET a single subscription /v1/scribe/5758e81c2fbbb785695903d9/subscriptions/579d2468facee2f869ca04ad
	app.get(endpoint.version + endpoint.base + "/:tenant_id" + endpoint.subscriptions + "/:sub_id", function(req, res, next) {
		logger.trace('req get scribe received');

		if(req.user.tenant_id !== req.params.tenant_id) {
			logger.info("unauthorized tenant id");
			return res.json({ status: 401, msg: "Unauthorized" });
		}

		Scribe.findById(req.params.tenant_id, function(err, scribe) {
			if(err) {
				logger.error(err);
				res.json({ err: err })
			} else {
				res.status(200).json({ scribe: scribe })
			}
		})
	});	

	// GET all subscriptions /v1/scribe/5758e81c2fbbb785695903d9/subscriptions
	app.get(endpoint.version + endpoint.base + "/:tenant_id" + endpoint.subscriptions, userController.authorize, function(req, res, next) {
		logger.trace('req get all scribe received');
		//logger.info(req.user);
		
		if(req.user.tenant_id !== req.params.tenant_id) {
			logger.info("unauthorized tenant id");
			return res.json({ status: 401, msg: "Unauthorized" });
		}

		Scribe.find({ tenant_id: req.params.tenant_id }, function(err, scribe) {
			// returns an array of scribes
			if(err) {
				logger.error(err);
				return res.json({ err: err })
			} else {
				return res.status(200).json({ 
					subscriptions: {
						data: scribe
					} 
				})
			}
		})
	});	

	// POST new subscription /v1/scribe/5758e81c2fbbb785695903d9/subscriptions
	app.post(endpoint.version + endpoint.base + "/:tenant_id" + endpoint.subscriptions, function(req, res, next) {
		logger.trace('req post new scribe received');
		
		if(req.user._id !== req.params.uid) {
			logger.info("unauthorized uid");
			return res.json({ status: 401, msg: "Unauthorized" });
		}

		var scribe = new Scribe(req.body.scribe);
		logger.info(scribe);
	    scribe.save(function(err) {
            if (err) {
              logger.error(err);
              res.status(401).json({msg: 'create_error', err: err});
            }
            else {
              logger.info("saving scribe in post")
              res.json({ scribe: scribe });
            }
        });
	});
	// UPDATE subscription /v1/scribe/5758e81c2fbbb785695903d9/subscriptions/sub_579d2468facee2f869ca04ad
	app.put(endpoint.version + endpoint.base + "/:tenant_id" + endpoint.subscriptions + "/:sub_id", function(req, res, next) {
		logger.trace('req update scribe received');

		if(req.user._id !== req.params.uid) {
			logger.info("unauthorized uid");
			return res.json({ status: 401, msg: "Unauthorized" });
		}

		res.json({msg:"success", status: 200})
	});	

	// DELETE a subscription /v1/scribe/5758e81c2fbbb785695903d9/subscriptions/579d2468facee2f869ca04ad
	app.delete(endpoint.version + endpoint.base + "/:tenant_id" + endpoint.subscriptions + "/:sub_id", function(req, res, next) {
		logger.trace('req delete scribe received');

		if(req.user._id !== req.params.uid) {
			logger.info("unauthorized uid");
			return res.json({ status: 401, msg: "Unauthorized" });
		}


		userController.getDelegatedUserByUsername(scribe.delegate_username).then(function (delegateUser) {
			return res.status(200).json({ scribe: scribe })
		})

		res.json({msg:"success", status: 200})
	});	

	return;
};