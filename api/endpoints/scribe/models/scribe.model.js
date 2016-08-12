var crypto   = require('crypto');
var bcrypt   = require('bcryptjs');
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var Schema   = mongoose.Schema;

var ScribeSchema = new mongoose.Schema({
  "id": { type: String },
  "tenant_id": { type: String },
  "delegate_username": { type: String },
  "object": { type: String },
  "application_fee_percent": { type: Number },
  "cancel_at_period_end": { type: Boolean },
  "canceled_at": { type: Date },
  "created": { type: Date },
  "current_period_end": { type: Date },
  "current_period_start": { type: Date },
  "customer": { type: String },
  "discount": { type: Number },
  "ended_at": { type: Date },
  "livemode": { type: Boolean },
  "metadata": {
  },
  "plan": {
    "id": { type: String },
    "object": { type: String },
    "amount": { type: Number },
    "created": { type: Date },
    "currency": { type: String },
    "interval": { type: String },
    "interval_count": { type: Number },
    "livemode": { type: Boolean },
    "metadata": {
    },
    "name": { type: String },
    "statement_descriptor": { type: String },
    "trial_period_days": { type: Number },
  },
  "quantity": { type: Number },
  "start": { type: Date },
  "status": { type: String },
  "tax_percent": { type: Number },
  "trial_end": { type: Date },
  "trial_start": { type: Date }
});

ScribeSchema.plugin(timestamps);

module.exports = mongoose.model('Scribe', ScribeSchema);