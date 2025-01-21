const { Schema, model } = require('mongoose');

const qualificationSchema = new Schema({
  name: { type: String, unique: true },
  status: {
    type: Boolean,
    default: false,
  },
  basic: { type: Boolean }
}, { timestamps: true });

module.exports = model('Qualification', qualificationSchema);
