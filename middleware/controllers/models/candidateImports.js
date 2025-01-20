const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;
const candImportSchema = new Schema(
	{
		name: { type: String },
		status: { type: String },
		record: { type: Number },
		message: {
			type: String,
		},
	},
	{ timestamps: true }
);

module.exports = model("CandidateImport", candImportSchema);
