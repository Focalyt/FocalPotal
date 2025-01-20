const { Schema, model } = require("mongoose");
const { stringify } = require("uuid");

const { ObjectId } = Schema.Types;

const vacancySchema = new Schema(
  {
    _company: { type: ObjectId, ref: "Company" },
    _qualification: { type: ObjectId, ref: "Qualification" },
    _courses: [{
      sectors: {
        type: Schema.Types.ObjectId,
        ref: 'CourseSectors'
      },
      courseLevel: { type: Schema.Types.ObjectId, ref: 'courses' },
      name: { type: Schema.Types.ObjectId, ref: 'courses' },
      isRecommended : {type : Boolean, default : false},
      // isVerifie : {type : Boolean, default : false},
    }],
    _subQualification: [{ type: ObjectId, ref: "SubQualification" }],
    _jobCategory: { type: ObjectId, ref: "JobCategory" },
    _industry: { type: ObjectId, ref: "Industry" },
    _techSkills: [{ type: ObjectId, ref: "Skill" }],
    _nonTechSkills: [{ type: ObjectId, ref: "Skill" }],
    displayCompanyName: { type: String, trim: true },
    title: { type: String },
    sequence: {
      type: Number,
      default: 50
    },
    state: { type: ObjectId, ref: "State" },
    countryId: String,
    city: { type: ObjectId, ref: "City" },
    jobType: { type: String },
    compensation: { type: String },
    pay: { type: String },
    shift: { type: String },
    work: { type: String },
    questionsAnswers: [{ Question: String, Answer: String }],
    benifits: [String],
    remarks: String,
    place: String,
    latitude: String,
    longitude: String,
    applyReduction: Number,
    requirement: String,
    isFixed: Boolean,
    amount: Number,
    min: Number,
    max: Number,
    noOfPosition: Number,
    experience: { type: Number },
    shortlisted: Number,
    dateOfPosting: Date,
    jobDescription: String,
    payOut: String,
    jobVideo: String,
    distance: Number,
    isContact: Boolean,
    nameof: String,
    phoneNumberof: Number,
    whatsappNumberof: Number,
    emailof: String,
    ageMax: Number,
    ageMin: Number,
    shifttimings:String,
    duties: String,
    genderPreference: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number]
      }
    },
    validity: {
      type: Date
    },
    cutprice:{
      type:Number
    },
    verified: {
      type: Boolean,
      default: false
    },
    isedited: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = model("Vacancy", vacancySchema);
