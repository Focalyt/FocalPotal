const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const appliedCoursesSchema = new Schema({
        _candidate: { type: ObjectId, ref: 'Candidate' },
        _course: { type: ObjectId, ref: 'courses' },
        courseStatus: {
                type: Number,
                enum: [0, 1], /* 0 for due and 1 for assigned */
                default: 0
        },
        registrationFee: {
                type: String,
                enum:['Paid', 'Unpaid'],
                default: 'Unpaid'
        },
        url: {
                type: String,
                default: ""
        },
        remarks: {
                type: String,
                default: ""
        },
        assignDate : {
                type : Date
        }
}, { timestamps: true });


module.exports = model("AppliedCourses", appliedCoursesSchema);
