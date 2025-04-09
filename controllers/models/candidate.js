const { Schema, model } = require("mongoose");
const { sign } = require("jsonwebtoken");

const { ObjectId } = Schema.Types;
const { jwtSecret } = require("../../config");
const { boolean } = require("joi");

const candidateSchema = new Schema(
  {
    hiringStatus: [
      {
        type: new Schema(
          {
            company: { type: ObjectId, ref: "Company" },
            status: { type: String },
            job: { type: ObjectId, ref: "Vacancy" },
            isRejected: { type: Boolean },
            eventDate: { type: String },
            concernedPerson: { type: String },
            comment: { type: String },
          },
          { timestamps: true }
        ),
      },
    ],
    appliedJobs: [{ type: ObjectId, ref: "Vacancy" }],
    appliedCourses: [
      {
        type: ObjectId, ref: "courses", // Course reference

      }
    ],
    selectedCenter: [
      {
        courseId: { type: ObjectId, ref: "courses" }, // Changed from type to courseId
        centerId: { type: ObjectId, ref: "Center" }, // Changed from type to courseId        
      }
    ],
    
    docsForCourses: [
      {
        courseId: { type: ObjectId, ref: "courses" }, // Changed from type to courseId
        uploadedDocs: [
          {
            docsId: { type: ObjectId, ref: "courses.docsRequired" },
            fileUrl: String,
            status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" }, // Verification Status
            reason: { type: String }, // Rejection ka reason
            verifiedBy:{ type: ObjectId, ref: "User" },
            verifiedDate:{ type: Date },
            uploadedAt: { type: Date, default: Date.now } // Upload Timestamp
          }
        ]
      }
    ],
    regFee: {
      type: Number,
      default: 0
    },
    _concernPerson: { type: ObjectId, ref: "User" },
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
    experiences: [
      {
        Industry_Name: { type: ObjectId, ref: "Industry" },
        SubIndustry_Name: { type: ObjectId, ref: "SubIndustry" },
        Company_Name: String,
        Company_Email: String,
        Company_State: { type: ObjectId, ref: "State" },
        Company_City: { type: ObjectId, ref: "City" },
        Comments: String,
        FromDate: String,
        ToDate: String,
      },
    ],
    techSkills: [{ id: { type: ObjectId, ref: "Skill" }, URL: String }],
    nonTechSkills: [{ id: { type: ObjectId, ref: "Skill" }, URL: String }],
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
    presentAddress:{
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      latitude: { type: String, default: "" },
      longitude: { type: String, default: "" },
      fullAddress: { type: String, default: "" }
    },
    parmanentAddress:{
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      latitude: { type: String, default: "" },
      longitude: { type: String, default: "" },
      fullAddress: { type: String, default: "" }
    },
    place: String,
    latitude: String,
    longitude: String,
    locationPreferences: [
      {
        state: { type: ObjectId, ref: "State" },
        city: { type: ObjectId, ref: "City" },
      },
    ],
    image: String,
    profilevideo: String,
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
    linkedInUrl: String,
    facebookUrl: String,
    twitterUrl: String,
    availableCredit: {
      type: Number,
    },
    otherUrls: [{}],
    highestQualification: { type: ObjectId, ref: "Qualification" },
    yearOfPassing: String,
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    flag: {
      type: Boolean,
    },
    isExperienced: Boolean,
    cgpa: String,
    totalExperience: Number,
    careerObjective: String,
    enrollmentFormPdfLink: String,
    status: {
      type: Boolean,
      default: true,
    },
    interests: [String],
    accessToken: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isImported: {
      type: Boolean,
      default: false,
    },
    creditLeft: {
      type: Number,
    },
    visibility: {
      type: Boolean,
      default: true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
    },
    upi: { type: String },
    referredBy: {
      type: ObjectId, ref: "Candidate"
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

candidateSchema.methods = {
  async generateAuthToken() {
    const data = { id: this._id.toHexString() };
    const token = sign(data, jwtSecret).toString();

    if (!this.accessToken || !Array.isArray(this.accessToken))
      this.accessToken = [];

    this.accessToken.push(token);
    await this.save();
    return token;
  },
};

module.exports = model("Candidate", candidateSchema);

