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





// const { Schema, model } = require("mongoose");
// const { sign } = require("jsonwebtoken");
// const { ObjectId } = Schema.Types;
// const { jwtSecret } = require("../../config");

// const candidateSchema = new Schema(
//   {
//     // Hiring status details for a candidate; stores the company's hiring progress
//     hiringStatus: [
//       {
//         type: new Schema(
//           {
//             company: { 
//               type: ObjectId, 
//               ref: "Company", 
//               description: "References the company involved in the hiring" 
//             },
//             status: { 
//               type: String, 
//               description: "The hiring status (e.g., applied, interviewed, accepted, etc.)" 
//             },
//             job: { 
//               type: ObjectId, 
//               ref: "Vacancy", 
//               description: "References the job applied by the candidate" 
//             },
//             isRejected: { 
//               type: Boolean, 
//               description: "Indicates whether the candidate was rejected for the job" 
//             },
//             eventDate: { 
//               type: String, 
//               description: "The date when the hiring event occurred (e.g., interview date)" 
//             },
//             concernedPerson: { 
//               type: String, 
//               description: "Name of the person handling the hiring process" 
//             },
//             comment: { 
//               type: String, 
//               description: "Additional comments about the application process" 
//             },
//           },
//           { timestamps: true }
//         ),
//       },
//     ],

//     // Applied job vacancies by the candidate, reference to the Vacancy model
//     appliedJobs: [{ 
//       type: ObjectId, 
//       ref: "Vacancy",
//       description: "References the job vacancies the candidate has applied for"
//     }],

//     // Applied courses by the candidate, reference to the courses model
//     appliedCourses: [{ 
//       type: ObjectId, 
//       ref: "courses", 
//       description: "References the courses the candidate has applied for"
//     }],

//     // Registration fee paid by the candidate, default is 0
//     regFee: {
//       type: Number,
//       default: 0,
//       description: "The registration fee paid by the candidate, default is 0"
//     },

//     // Concerned person responsible for the candidate's hiring process
//     _concernPerson: { 
//       type: ObjectId, 
//       ref: "User", 
//       description: "References the user responsible for managing the candidate's hiring process" 
//     },

//     // Candidate's educational qualifications
//     qualifications: [
//       {
//         subQualification: { 
//           type: ObjectId, 
//           ref: "SubQualification", 
//           description: "References the sub-qualification attained by the candidate" 
//         },
//         Qualification: { 
//           type: ObjectId, 
//           ref: "Qualification", 
//           description: "References the main qualification attained by the candidate" 
//         },
//         College: { 
//           type: String, 
//           description: "Name of the college attended by the candidate" 
//         },
//         collegePlace: { 
//           type: String, 
//           description: "Location of the college" 
//         },
//         location: {
//           type: {
//             type: String,
//             enum: ["Point"],
//             description: "Defines the type of location (GeoJSON Point)"
//           },
//           coordinates: {
//             type: [Number],
//             description: "Coordinates (longitude, latitude) representing the candidate's location"
//           },
//         },
//         University: { 
//           type: ObjectId, 
//           ref: "University", 
//           description: "References the university the candidate attended"
//         },
//         AssessmentType: { 
//           type: String, 
//           description: "The type of assessment (e.g., exam, interview) taken by the candidate"
//         },
//         PassingYear: { 
//           type: String, 
//           description: "Year in which the candidate passed the qualification"
//         },
//         Result: { 
//           type: String, 
//           description: "Result of the qualification (e.g., passed, failed)"
//         },
//       },
//     ],

//     // Work experience details for the candidate
//     experiences: [
//       {
//         Industry_Name: { 
//           type: ObjectId, 
//           ref: "Industry", 
//           description: "References the industry in which the candidate worked"
//         },
//         SubIndustry_Name: { 
//           type: ObjectId, 
//           ref: "SubIndustry", 
//           description: "References the sub-industry of the candidate’s work experience"
//         },
//         Company_Name: { 
//           type: String, 
//           description: "Name of the company where the candidate worked"
//         },
//         Company_Email: { 
//           type: String, 
//           description: "Email address of the company"
//         },
//         Company_State: { 
//           type: ObjectId, 
//           ref: "State", 
//           description: "References the state where the company is located"
//         },
//         Company_City: { 
//           type: ObjectId, 
//           ref: "City", 
//           description: "References the city where the company is located"
//         },
//         Comments: { 
//           type: String, 
//           description: "Additional comments regarding the candidate’s work experience"
//         },
//         FromDate: { 
//           type: String, 
//           description: "Start date of the candidate’s employment"
//         },
//         ToDate: { 
//           type: String, 
//           description: "End date of the candidate’s employment (if applicable)"
//         },
//       },
//     ],

//     // Technical skills of the candidate
//     techSkills: [{ 
//       id: { 
//         type: ObjectId, 
//         ref: "Skill", 
//         description: "References the technical skills the candidate possesses"
//       },
//       URL: { 
//         type: String, 
//         description: "URL link to further information or certification for the technical skill"
//       }
//     }],

//     // Non-technical skills of the candidate
//     nonTechSkills: [{ 
//       id: { 
//         type: ObjectId, 
//         ref: "Skill", 
//         description: "References the non-technical skills the candidate possesses"
//       },
//       URL: { 
//         type: String, 
//         description: "URL link to further information or certification for the non-technical skill"
//       }
//     }],

//     // Basic personal information fields for the candidate
//     name: { 
//       type: String, 
//       trim: true, 
//       description: "Full name of the candidate"
//     },
//     mobile: {
//       type: Number,
//       lowercase: true,
//       trim: true,
//       unique: true,
//       description: "Unique mobile number of the candidate"
//     },
//     email: {
//       type: String,
//       lowercase: true,
//       trim: true,
//       description: "Email address of the candidate"
//     },
//     place: { 
//       type: String, 
//       description: "Current place of residence of the candidate"
//     },

//     latitude: {
//       type: String, 
//       description: "Latitude for geolocation"
//     },

//     longitude: {
//       type: String, 
//       description: "Longitude for geolocation"
//     },

//     // Location preferences for job roles
//     locationPreferences: [
//       {
//         state: { 
//           type: ObjectId, 
//           ref: "State", 
//           description: "Preferred state for job location" 
//         },
//         city: { 
//           type: ObjectId, 
//           ref: "City", 
//           description: "Preferred city for job location"
//         },
//       },
//     ],

//     // Profile media information (image, video, etc.)
//     image: { 
//       type: String, 
//       description: "URL to the profile image of the candidate"
//     },
//     profilevideo: { 
//       type: String, 
//       description: "URL to the profile video of the candidate"
//     },

//     // Additional information related to resume and profile
//     resume: { 
//       type: String, 
//       description: "Link to the resume of the candidate"
//     },

//     // Social media links for professional networking
//     linkedInUrl: { 
//       type: String, 
//       description: "LinkedIn profile URL of the candidate"
//     },
//     facebookUrl: { 
//       type: String, 
//       description: "Facebook profile URL of the candidate"
//     },
//     twitterUrl: { 
//       type: String, 
//       description: "Twitter profile URL of the candidate"
//     },

//     // Available credit for the candidate
//     availableCredit: {
//       type: Number,
//       description: "Available credit that the candidate can use for job-related activities"
//     },

//     // Additional URLs associated with the candidate
//     otherUrls: [{}],

//     // Career-related fields
//     highestQualification: { 
//       type: String, 
//       description: "The highest qualification attained by the candidate"
//     },
//     yearOfPassing: { 
//       type: String, 
//       description: "The year in which the candidate completed their highest qualification"
//     },

//     // Profile completeness
//     isProfileCompleted: {
//       type: Boolean,
//       default: false,
//       description: "Indicates whether the candidate’s profile is complete"
//     },

//     // Flag for special conditions (e.g., admin flags)
//     flag: {
//       type: Boolean,
//       description: "A flag that may be used to track special conditions or exceptions"
//     },

//     // Employment experience flag
//     isExperienced: {
//       type: Boolean,
//       description: "Indicates whether the candidate has previous work experience"
//     },

//     // Candidate's CGPA or grade
//     cgpa: { 
//       type: String, 
//       description: "Cumulative Grade Point Average (CGPA) or grade of the candidate"
//     },

//     // Total experience in years
//     totalExperience: { 
//       type: Number, 
//       description: "Total work experience of the candidate in years"
//     },

//     // Career objective for the candidate
//     careerObjective: { 
//       type: String, 
//       description: "The career goal or objective of the candidate"
//     },

//     // PDF link for enrollment form
//     enrollmentFormPdfLink: { 
//       type: String, 
//       description: "Link to the candidate’s enrollment form PDF"
//     },

//     // Profile visibility status
//     visibility: {
//       type: Boolean,
//       default: true,
//       description: "Indicates whether the candidate’s profile is visible to others"
//     },
//     // Profile visibility status
//     status: {
//       type: Boolean,
//       default: true,
//       description: "Indicates whether the candidate’s profile is visible to others"
//     },

//     // Location data in GeoJSON format
//     location: {
//       type: {
//         type: String,
//         enum: ["Point"],
//         description: "Defines the type of location (GeoJSON Point)"
//       },
//       coordinates: {
//         type: [Number],
//         description: "Coordinates (longitude, latitude) representing the candidate's location"
//       },
//     },

//     // UPI (Unified Payments Interface) ID for the candidate
//     upi: { 
//       type: String, 
//       description: "UPI ID of the candidate for payment purposes"
//     },

//     // Refers to another candidate who referred this candidate
//     referredBy: {
//       type: ObjectId,
//       ref: "Candidate",
//       description: "References the candidate who referred this candidate"
//     },

//     // Verification status of the candidate
//     verified: {
//       type: Boolean,
//       default: false,
//       description: "Indicates whether the candidate’s profile has been verified"
//     },
//   },
//   { timestamps: true }
// );

// candidateSchema.methods = {
//   // Method to generate authentication token for the candidate
//   async generateAuthToken() {
//     const data = { id: this._id.toHexString() };
//     const token = sign(data, jwtSecret).toString();

//     if (!this.accessToken || !Array.isArray(this.accessToken)) {
//       this.accessToken = [];
//     }

//     this.accessToken.push(token);
//     await this.save();
//     return token;
//   },
// };

// module.exports = model("Candidate", candidateSchema);

