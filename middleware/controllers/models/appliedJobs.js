const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const appliedJobsSchema = new Schema(
	{
        _candidate: { type: ObjectId, ref: 'Candidate' },
        _company: { type: ObjectId, ref: 'Company' },
        _job: { type: ObjectId, ref: 'Vacancy' },
        coinsDeducted: { type: Number },
        isRegisterInterview: {
                type: Boolean,
                default: false
        },
	},
	{ timestamps: true }
);


module.exports = model("AppliedJobs", appliedJobsSchema);
