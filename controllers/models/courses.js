const { kStringMaxLength } = require('buffer');
const { boolean } = require('joi');
const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const courseSchema = new Schema({
  sectors: [{
    type: ObjectId, ref: "CourseSectors"
  }],
  center: [{
    type: ObjectId, ref: "Center"
  }],
  courseLevel: String,
  name: { type: String, lowercase: true, trim: true },
  courseFeeType: {
    type: String, // Specifies which type of user created the post
    enum: ['Paid', 'Free'], // Allowed user types
    required: true,
  },
  typeOfProject: {
    type: String, // Specifies which type of user created the post
    enum: ['P&T', 'T&P', "General"], // Allowed user types

  },
  projectName: String,
  duration: String,
  courseType: String,
  youtubeURL: String,
  brochure: String,
  thumbnail: String,
  certifyingAgency: String,
  certifyingAgencyWebsite: String,
  qualification: String,
  age: String,
  experience: String,
  trainingMode: String,
  onlineTrainingTiming: String,
  offlineTrainingTiming: String,
  address: String,
  city: String,
  state: String,
  appLink: String,
  ojt: String,
  registrationCharges: String,
  courseFee: String,
  cutPrice: String,
  examFee: String,
  otherFee: String,
  emiOptionAvailable: String,
  maxEMITenure: String,
  stipendDuringTraining: String,
  lastDateForApply: String,
  requiredDocuments: String,
  docsRequired: [
    {
      Name: { type: String },
      status: { type: Boolean, default: true }
    }
  ],

  testimonialvideos: [{
    type: String
  }],
  photos: [String],
  audios: [String],
  videos: [String],
  courseFeatures: {
    type: String,
    default: ""
  },
  importantTerms: {
    type: String,
    default: ""
  },

  questionAnswers: [{ Question: String, Answer: String }],
  courseRemark: {
    type: String
  },
  courseUrl: {
    type: String,
    default: ""
  },
  status: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  counslername: {
    type: String,
    default: ""
  },
  counslerphonenumber: {
    type: Number,
    default: ""
  },
  counslerwhatsappnumber: {
    type: Number,
    default: ""
  },
  counsleremail: {
    type: String,
    default: ""
  },
  isRecommended: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: {
      type: String,
      enum: ['admin', 'college'],
      default: 'admin'
    },
    id: { type: ObjectId, ref:'User' }
  },
  college: {
    type: ObjectId,
    ref: 'College',
    default: null
  },
}, { timestamps: true });

module.exports = model('courses', courseSchema);