var nodemailer = require('nodemailer');
var nconf      = require('nconf');
var config;

if (nconf.get('mailerSettings')) {
  config = nconf.get('mailerSettings');
}

exports.sendMessage = function(user, link, callback) {
  if (!config && process.env.ENV !== 'testing') {
    callback('Transporter not configured');
    return;
  }
  if (process.env.ENV === 'testing') {
    callback(null, user, null);
  }
  else {
    var transporter = nodemailer.createTransport(config.transporter);
    var mailOptions = {
      from: config.mailerFrom,
      to: user.email,
      subject: config.passwordResetTitle,
      html: config.resetPasswordText + link
    };
    transporter.sendMail(mailOptions, function (error,info) {
      callback(error, info);
    });
  }
};

exports.verifyEmail = function(user, link, callback) {
  if (!config && process.env.ENV !== 'testing') {
    callback('Transporter not configured');
    return;
  }
  if (process.env.ENV === 'testing') {
    callback(null, user, null);
  }
  else {
    var transporter = nodemailer.createTransport(config.transporter);
    var mailOptions = {
      from: config.mailerFrom,
      to: user.email,
      subject: config.verifyEmailTitle,
      html: config.verifyEmailLinkText + link
    };
    transporter.sendMail(mailOptions, function (error,info) {
      callback(error, info);
    });
  }
};

exports.contactSupport = function(user, subject, message, callback) {
  if (!config && process.env.ENV !== 'testing') {
    callback('Transporter not configured');
    return;
  }
  if (process.env.ENV === 'testing') {
    callback(null, user, null);
  }
  else {
    var hat = require('hat');
    var rack = hat.rack(); 
    var transporter = nodemailer.createTransport(config.transporter);
    var mailOptions = {
      from: user.email,
      to: config.supportEmails,
      subject: subject + " id_"+rack(),
      html: "sender: " + user.email + " \n\n" + message
    };
    transporter.sendMail(mailOptions, function (error,info) {
      callback(error, info);
    });
  }
};

exports.messageUser = function(user, message, callback) {
  if (!config && process.env.ENV !== 'testing') {
    callback('Transporter not configured');
    return;
  }
  if (process.env.ENV === 'testing') {
    callback(null, user, null);
  }
  else {
    var hat = require('hat');
    var rack = hat.rack(); 
    var transporter = nodemailer.createTransport(config.transporter);
    var mailOptions = {
      from: user.email,
      to: user.email,
      subject: "Message from Argent User " + user.first_name + " id_"+rack(),
      html: "sender: " + user.email + " \n\n" + message
    };
    transporter.sendMail(mailOptions, function (error,info) {
      callback(error, info);
    });
  }
};
