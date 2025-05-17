const mongoose = require("mongoose");

const eventTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  basic: {
    type: Boolean,
    default: false  // optional: if you're categorizing basic types
  }
});

module.exports = mongoose.model("EventType", eventTypeSchema);
