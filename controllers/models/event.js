const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ["Webinar", "Contest"],
    required: true
  },
  eventTitle: {
    type: String,
    required: true
  },
  eventMode: {
    type: String,
    enum: ["Online", "Offline"],
    required: true
  },
  url: {
    type: String,
    default: ""
  },
  location: {
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    latitude: { type: String, default: "" },
    longitude: { type: String, default: "" },
    fullAddress: { type: String, default: "" }
  },
  timing: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  registrationPeriod: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  description: {
    type: String,
    maxlength: 1000
  },
  video: {
    type: String,
    default: ""
  },
  thumbnail: {
    type: String,
    default: ""
  },
  guidelines: {
    type: String,
    default: ""
  },
  status: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
