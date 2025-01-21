const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const collegeSmsSchema = new Schema({
  _college: { type: ObjectId, ref: 'College' },
  name: { type: String },
  message: String,
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('CollegeSms', collegeSmsSchema);
