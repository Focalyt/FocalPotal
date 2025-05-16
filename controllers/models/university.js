const { Schema, model } = require('mongoose');

const universitySchema = new Schema({
  name: {
    type: String,
    unique: true,
    trim: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  universityType: {
    type: String, // e.g., State University, Central University, etc.
    
  },
  type: {
    type: String,
    default: "University"
  },
}, { timestamps: true });

module.exports = model('University', universitySchema);
