const { Schema, model } = require('mongoose');

const citySchema = new Schema({
  stateId: {
    type: String,
  },
  cityId: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  name: {
    type: String, required: true, trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
}, { timestamps: true });

module.exports = model('City', citySchema);
