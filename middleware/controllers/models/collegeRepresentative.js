const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const collegeRepresentativeSchema = new Schema(
	{
		_college: { type: ObjectId, ref: "College" },
		name: { type: String, lowercase: true, trim: true },
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		mobile: {
			type: String,
			lowercase: true,
			required: false,
			trim: true,
			// type: String, lowercase: true, required: true, trim: true, unique: 'Mobile number already exists!',
		},
		designation: String,
		image: String,
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

module.exports = model("CollegeRepresentative", collegeRepresentativeSchema);
