const { Schema, model } = require('mongoose');

const universitySchema = new Schema({
  name: {
    type: String,
    unique: true,
    lowercase: false,
    trim: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  type: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = model('University', universitySchema);
