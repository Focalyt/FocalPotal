const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentRegistrationSchema = new mongoose.Schema({
  school: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  dob: {
    type: String, // Or Date if you're collecting a full date
    required: true
  },
  parentContact: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/ // basic Indian mobile number validation
  },
  interestedTech: {
    type: String,
    enum: ['ai', 'robotics', 'drone', 'iot', 'vr', 'all'],
    required: true
  },
  wantsToExploreLab: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  exploreReasonOrInterest: {
    type: String,
    trim: true
  },
  wouldRecommend: {
    type: String,
    enum: ['yes', 'no', 'maybe'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudentRegistration', studentRegistrationSchema);
