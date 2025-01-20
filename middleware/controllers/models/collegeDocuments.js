const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const CollegeDocumentsSchema = new Schema(
	{
		college: { type: ObjectId, ref: "College" },
		name: { type: String },
		path: { type: String },
		status: {
			type: Boolean,
			default: true,
		}
	},
	{ timestamps: true }
);

module.exports = model("CollegeDocuments", CollegeDocumentsSchema);
