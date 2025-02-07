const { Schema, model } = require("mongoose");
const { sign } = require("jsonwebtoken");

const { ObjectId } = Schema.Types;
const { jwtSecret } = require("../../config");

const freelancerSchema = new Schema(
  {
    candidatesLeads: [
      {                 
            candidateName: { type: ObjectId, ref: "CandidatesLeads" },
            mobile: {
              type: Number,
              lowercase: true,
              trim: true,
              unique: true,
              //unique: "Mobile number already exists!",
            },
            Qualification: { type: ObjectId, ref: "Qualification" },
            appliedCourses: [{ type: ObjectId, ref: "courses"}],
            status: { type: String }, 
            timestamps: true          
            
        
      },
    ],
    qualifications: [
      {
        subQualification: { type: ObjectId, ref: "SubQualification" },
        Qualification: { type: ObjectId, ref: "Qualification" },
        College: String,
        collegePlace: String,
        location: {
          type: {
            type: String,
            enum: ["Point"],
          },
          coordinates: {
            type: [Number],
          },
        },
        University: { type: ObjectId, ref: "University" },
        AssessmentType: String,
        PassingYear: String,
        Result: String,
      },
    ],
    
    name: { type: String, trim: true },
    mobile: {
      type: Number,
      lowercase: true,
      trim: true,
      unique: true,
      //unique: "Mobile number already exists!",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    place: String,
    latitude: String,
    longitude: String,
    image: String,
    resume: String,
    city: { type: ObjectId, ref: "City" },
    gender: String,
    sex: String,
    dob: Date,
    whatsapp: Number,
    age: String,
    state: { type: ObjectId, ref: "State" },
    countryId: String,
    address: String,
    pincode: String,
    session: String,
    semester: String,
    resume: String,
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    flag: {
      type: Boolean,
    },
    
    totalExperience: Number,
    
    status: {
      type: Boolean,
      default: true,
    },
    accessToken: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isImported: {
      type: Boolean,
      default: false,
    },
    visibility:{
      type:Boolean,
      default:true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number]
      },
    },
    upi: { type: String },
    referredBy:{
      type: ObjectId, ref: "Candidate"
    },
    verified:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);



module.exports = model("Freelancer", freelancerSchema);


