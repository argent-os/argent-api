// Init
var express        = require('express');
var path           = require('path');
var favicon        = require('serve-favicon');
var log4js         = require('log4js');
var logger         = log4js.getLogger();
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var expressSession = require('express-session');
var port           = process.env.PORT || 5001;

// Mongo
var uriUtil        = require('mongodb-uri');
var mongoose       = require('mongoose');
var mongodbUri     = process.env.MONGOLAB_URI;
var mongooseUri    = uriUtil.formatMongoose(mongodbUri) + '/praxicorp';
var localMongo     = 'mongodb://localhost:27017/praxicorp';    
// *****************************************************************************
// ***  HOWTO: Create local mongo instance to play with API locally  *****
// ***  sudo mkdir -p data/db  *****
// ***  sudo chmod -R 0777 data/db  *****
// ***  sudo mongod --dbpath data/db  *****
// ***  mongo-express -u user -p password -d database ******
// ***  to kill mongo db process use: ps -ef | grep mongod ***
// ***  then: sudo kill -9 <pid> // for example sudo kill -9 12912 ****
// *****************************************************************************

//Compression
var h5bp           = require('h5bp');
var compress       = require('compression');    

// *****************************************************************************
// ***  Server startup in api/endpoints/auth/lib/express-jwt-auth  *****
// *****************************************************************************

var app = express();

// Key Stripe and Firebase Handlers for DEV vs PROD
process.env.ENVIRONMENT == 'DEV' ? mongooseUri = process.env.MONGOLAB_URI_DEV : '';
process.env.ENVIRONMENT == 'PROD' ? mongooseUri =process.env.MONGOLAB_URI : '';


console.log('Running in ' + process.env.ENVIRONMENT + ' mode');

process.env.ENVIRONMENT == 'DEV' || process.env.ENVIRONMENT == undefined ? stripeApiKey = process.env.STRIPE_TEST_KEY : '';
process.env.ENVIRONMENT == 'DEV' || process.env.ENVIRONMENT == undefined ? stripePublishableKey = process.env.STRIPE_TEST_PUB_KEY : '';
process.env.ENVIRONMENT == 'PROD' ? stripeApiKey = process.env.STRIPE_KEY : '';
process.env.ENVIRONMENT == 'PROD' ? stripePublishableKey = process.env.STRIPE_PUB_KEY : '';

console.log('Utilizing Stripe Key in ' + process.env.ENVIRONMENT + ' mode');

var options = {
  //mongoconnection: localMongo || mongooseUri,
  mongoconnection: mongooseUri,
  logFile: path.join(__dirname, 'authlogger.log'),
  corsDomains: ['*', 'http://localhost:5000'],
  // Nodemailer settings, used for resetting password
  mailer: {
    mailerFrom    : process.env.SUPPORT_EMAIL,
    passwordResetTitle   : 'Password Reset',
    supportTitle: 'Support Request',
    supportEmails: ['support@argent-tech.com', 'sinan@argent-tech.com', 'selin@argent-tech.com', 'semih@argent-tech.com'],
    verifyEmailTitle   : 'Verify Account for Argent',
    verifyEmailLinkText   : 'Welcome to Argent!  Please verify your email using the following link: ',
    quoteEmailTitle: 'Quote created',  
    quoteEmailTextLink: 'Please use the following link to accept or reject proposal ',
    mailerInfo    : 'Hello! ',
    resetPasswordText    : 'Hello from Argent! Please use the following link to reset your password: ',
    transporter   : {
      service: 'Gmail',
      auth: {
        user: process.env.APP_GMAIL,
        pass: process.env.APP_GMAIL_PW
      }
    }
  }
};

// *****************************************************************************
// ************************** SERVER STARTUP ***********************************
// *****************************************************************************

mongoose.connect(options.mongoconnection);
// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {  
  console.log('Mongoose default connection open');
}); 

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log('Mongoose default connection error: ' + err);
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose default connection disconnected'); 
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Mongoose default connection disconnected through app termination'); 
    process.exit(0); 
  }); 
}); 

// Setup API routes
// Send the current and and options into the endpoints
// Be sure name in package.json matches lib -> endpoint file name
var home         = require('./api/routes/home');
var prot_auth    = require('./api/endpoints/auth')(app, options);
var prot_post    = require('./api/endpoints/post')(app, options);
var prot_org     = require('./api/endpoints/organization')(app, options);
var prot_company = require('./api/endpoints/company')(app, options);
var notification = require('./api/endpoints/notification')(app, options);
var stripe       = require('./api/endpoints/stripe/stripe.endpoint')(app, options);
var plaid        = require('./api/endpoints/plaid/plaid.endpoint')(app, options);
var twilio       = require('./api/endpoints/twilio/twilio.endpoint')(app, options);
var cloudinary   = require('./api/endpoints/cloudinary/cloudinary.endpoint')(app, options);
var messages     = require('./api/endpoints/messages/messages.endpoint')(app, options);
var messages     = require('./api/endpoints/receipts/receipts.endpoint')(app, options);
var quote        = require('./api/endpoints/quote')(app, options);

// app.use(express.static(path.join(__dirname, 'api/web')));
// app.use(express.static('src'));
// app.use('/bower_components',  express.static('bower_components'));
// app.use('/', home);

// file cleaner, deletes image file periodically
var FileCleaner = require('cron-file-cleaner').FileCleaner;
 
var fileWatcher = new FileCleaner(__dirname + '/images', 600000,  '* */01 * * * *', {
  start: true
});

app.use(h5bp({ root: __dirname + '/src' }));
app.use(compress());

// view engine setup
app.set('views', path.join(__dirname, 'api/web/views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.all('*', function(req, res, next) {  
    // Send the index.html for other files to support HTML5Mode
    // res.sendFile('src/index.html', { root: __dirname });
    // req.session.timestamp = Date.now();    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization', req.headers['access-control-request-headers']);
    if ('OPTIONS' == req.method) return res.send(204);
    next();    
});

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     var err = new Error('Not swag');
//     err.status = 404;
//     next(err);
// });

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// https handler
// app.use(function(req, res, next) {
//     if((!req.secure) && (req.get('X-Forwarded-Proto') !== 'https')) {
//         res.redirect('https://' + req.get('Host') + req.url);
//     }
//     else
//         next();
// });

// error handlers, development error handler, will print stacktrace
if (process.env.ENVIRONMENT === 'DEV' || process.env.ENVIRONMENT == undefined) {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler, no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.statusCode=500;
    // res.render('error', {
    //     message: err.message,
    //     error: {}
    // });
});

app.get('/', function(req, res, next) {
  res.json({message: "Welcome to the Argent API!", info: "To download our app please visit www.protonpayments.com"})
})

app.get('/ping', function(req, res) {
   res.status(200).send({msg: "pong"});
});

// Sessions
var expressSession = require('express-session')
  , cookieParser = require('cookie-parser')
  , http = require('http');

//
// Create an HTTP server.
//
if(process.env.HOST_ENV === 'LOCAL') {
  require('dns').lookup(require('os').hostname(), function (err, address, fam) {
    var server = http.createServer(app).listen(port, address);
    logger.info("Running app on " + address + ":" + port)
    server.on("close", function() {
      process.exit();
    });
  })
} else if(process.env.HOST_ENV === 'PRODUCTION') {
    var server = http.createServer(app).listen(port);
    logger.info("Running app on port " + port)
    server.on("close", function() {
      process.exit();
    });
}


module.exports = app;


