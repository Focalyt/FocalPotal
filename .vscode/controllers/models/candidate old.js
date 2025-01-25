const { Schema, model } = require("mongoose");
const { sign } = require("jsonwebtoken");

const { ObjectId } = Schema.Types;
const { jwtSecret } = require("../../config");

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
    appliedJobs: [{ type: ObjectId, ref: "Vacancy"}],
    appliedCourses: [{ type: ObjectId, ref: "courses"}],
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
    status: {
      type: Boolean,
      default: true
    },
    statusNew: {
      type: Boolean,
      default: true
    },
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
    highestQualification: String,
    yearOfPassing: String,

    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    isProfileCompletedNew: {
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

candidateSchema.pre("save", function (next) {
  if (this.status === undefined) {
    this.status = true; // Set only if undefined
  }
  next();
});


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
