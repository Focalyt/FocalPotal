// const { Schema, model } = require("mongoose");

// const { ObjectId } = Schema.Types;

// const appliedCoursesSchema = new Schema({
//         _candidate: { type: ObjectId, ref: 'Candidate' },
//         _course: { type: ObjectId, ref: 'courses' },
//         courseStatus: {
//                 type: Number,
//                 enum: [0, 1], /* 0 for due and 1 for assigned */
//                 default: 0
//         },
//         registrationFee: {
//                 type: String,
//                 enum:['Paid', 'Unpaid'],
//                 default: 'Unpaid'
//         },
//         url: {
//                 type: String,
//                 default: ""
//         },
//         remarks: {
//                 type: String,
//                 default: ""
//         },
//         assignDate : {
//                 type : Date
//         }
// }, { timestamps: true });


// module.exports = model("AppliedCourses", appliedCoursesSchema);





const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const appliedCoursesSchema = new Schema(
  {
    _candidate: {
      type: ObjectId,
      ref: "Candidate",
      description: "Reference to the Candidate who applied for the course",
    },
    _course: {
      type: ObjectId,
      ref: "courses",
      description: "Reference to the specific course applied for",
    },
    courseStatus: {
      type: Number,
      enum: [0, 1], // 0: due, 1: assigned
      default: 0,
      description: "The status of the course application: 0 (due) or 1 (assigned)",
    },
    registrationFee: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
      description: "Indicates whether the registration fee is Paid or Unpaid",
    },
    url: {
      type: String,
      default: "",
      description: "URL associated with the applied course, if applicable",
    },
    remarks: {
      type: String,
      default: "",
      description: "Additional comments or remarks about the applied course",
    },
    assignDate: {
      type: Date,
      description: "Date when the course was assigned to the candidate",
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// Attach descriptions for `timestamps`
appliedCoursesSchema.paths.createdAt.options.description = "Timestamp when the document was created";
appliedCoursesSchema.paths.updatedAt.options.description = "Timestamp when the document was last updated";

// Export the model
module.exports = model("AppliedCourses", appliedCoursesSchema);

