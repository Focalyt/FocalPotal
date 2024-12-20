const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const hiringStatusSchema = new Schema(
	{
		company: { type: ObjectId, ref: "Company" },
		candidate: { type: ObjectId, ref: "Candidate" },
		status: { type: String },
		comment: { type: String },
		job: { type: ObjectId, ref: "Vacancy" },
		isRejected: {type: Boolean},
		eventDate: {type: Date},
		concernedPerson: {type: String},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		flag: {type: Boolean}
	},
	{ timestamps: true }
);

module.exports = model("HiringStatus", hiringStatusSchema);
