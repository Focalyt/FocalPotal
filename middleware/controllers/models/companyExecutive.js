const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const companyExecutiveSchema = new Schema(
	{
		_company: { type: ObjectId, ref: "Company" },
		name: { type: String, lowercase: true, trim: true },
		image: String,
		designation: String,
		linkedinUrl: String,
		status: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

module.exports = model("CompanyExecutive", companyExecutiveSchema);
