var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var path = require('path');
var bodyParser = require('body-parser');

app.use(bodyParser.json());

process.env.ENV = 'testing';
var settings = {
  mongoconnection: 'mongodb://localhost:27017/express-api-auth-test',
  tokenSecret: 'secret token tests',
  urlStrings: {
    login: '/v1/login-modif',
    editprofile: '/v1/editprofile-modif',
    signup: '/v1/register-modif'
  }
  // removeCallback: function (userId) {
  //   console.log('removed user id: ' + userId)
  // }
};
var auth = require('../lib/express-jwt-auth')(app, settings);

server.listen(5000);
