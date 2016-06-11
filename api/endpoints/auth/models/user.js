var crypto   = require('crypto');
var bcrypt   = require('bcryptjs');
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var stripeCustomer = require('./plugins/stripe-customer');
var secrets = require('../config/secrets');
var stripeOptions = secrets.stripeOptions;
var Schema   = mongoose.Schema;

var pictureDef = { 
  id: { type: String },
  url: { type: String },
  secure_url: { type: String }
};

var plaidDef = {
  access_token: { type: String }
}

var iosDef = {
  device_token: { type: String },
  push_state: { type: Boolean }
}

var androidDef = {
  device_token: { type: String },
  push_state: { type: Boolean }
}

var tosDef = {
  date: { type: String },
  ip: { type: String }
}

var dobDef = {
  day: { type: Number },
  month: { type: Number },
  year: { type: Number }
}

var addressDef = {
  city: { type: String },
  country: { type: String },
  line1: { type: String },
  line2: { type: String },
  postal_code: { type: Number },
  state: { type: String }
}

var legalEntityDef = {
  first_name: { type: String },
  last_name: { type: String },
  business_name: { type: String },
  dob: dobDef,
  type: { type: String },
  additional_owners: { type: Array },
  address: addressDef
}

var verifyDef = {
  token: { type: String },
  status: { type: Boolean }
}

var resetDef = {
  token: { type: String }
}

var organizationDef = {
  id: { type: String }
}

var desktopDef = {
  notifications: { type: Boolean }
}

var businessDef = {
  name: { type: String }
}

var credentialsDef = {
  token_client_id: { type: String },
  token_client_secret: { type: String },
  token_access: { type: String },
  token_type: { type: String },
  token_scope: { type: String },
  token_livemode: { type: Boolean },
  token_expires: { type: Date }
}

var UserSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name: { type: String },
  username: { type: String, lowercase: true, trim: true, unique : true, required : true },
  full_name: { type: String, trim: true },
  phone_number: { type: String, trim: true },
  country: { type: String },
  tos_acceptance: tosDef,
  legal_entity: legalEntityDef,
  role: { type: Array },
  organization: organizationDef,
  business: businessDef,
  picture: pictureDef,
  email: { type: String, lowercase: true, trim: true, unique : true, required : true},
  display_name: { type: String },
  desktop: desktopDef,
  ios: iosDef,
  android: androidDef,
  password: { type: String },
  theme: { type: String },
  plaid: plaidDef,
  env: { type: String },
  redirect_uri: { type: String },
  credentials: credentialsDef,
  verify: verifyDef,
  reset_token: { type: String }
});

UserSchema.plugin(timestamps);
UserSchema.plugin(stripeCustomer, stripeOptions);

UserSchema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.index({ email: 'text', username: 'text' });

module.exports = mongoose.model('User', UserSchema);