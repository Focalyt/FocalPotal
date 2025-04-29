// const { Schema, model } = require("mongoose");

// const { ObjectId } = Schema.Types;

// const appliedJobsSchema = new Schema(
// 	{
//         _candidate: { type: ObjectId, ref: 'Candidate' },
//         _company: { type: ObjectId, ref: 'Company' },
//         _job: { type: ObjectId, ref: 'Vacancy' },
//         coinsDeducted: { type: Number },
//         isRegisterInterview: {
//                 type: Boolean,
//                 default: false
//         },
// 	},
// 	{ timestamps: true }
// );


// module.exports = model("AppliedJobs", appliedJobsSchema);





const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const appliedJobsSchema = new Schema(
  {
    _candidate: {
      type: ObjectId,
      ref: "CandidateProfile",
      description: "Reference to the Candidate who applied for the job",
    },
    _company: {
      type: ObjectId,
      ref: "Company",
      description: "Reference to the Company offering the job",
    },
    _job: {
      type: ObjectId,
      ref: "Vacancy",
      description: "Reference to the specific job vacancy that the candidate applied to",
    },
    coinsDeducted: {
      type: Number,
      description: "The number of coins deducted for applying to the job",
    },
    isRegisterInterview: {
      type: Boolean,
      default: false,
      description: "Indicates if the candidate has registered for an interview for the job",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Attach descriptions for `timestamps`
appliedJobsSchema.paths.createdAt.options.description = "Timestamp when the document was created";
appliedJobsSchema.paths.updatedAt.options.description = "Timestamp when the document was last updated";

// Export the model
module.exports = model("AppliedJobs", appliedJobsSchema);

