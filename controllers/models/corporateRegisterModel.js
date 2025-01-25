const { boolean } = require("joi");
const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const corporateRegisterSchema = new Schema(
	{
		_concernPerson: { type: ObjectId, ref: "User" },
		_industry: { type: ObjectId, ref: "Industry" },
		_subIndustry: [{ type: ObjectId, ref: "SubIndustry" }],
		name: { type: String, lowercase: false, trim: true },
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		designation:String,
		logo: String,
		mediaGallery: String,
		cityId: String,
		stateId: String,
		countryId: String,
		linkedin: String,
		twitter: String,
		facebook: String,
		headOAddress: String,
		description: String,
		zipcode: String,
		whatsappNumber:String,
        companyExecutives:[{name:String,Designation:String,Image:String,Linkedlin:String}],
		status: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		isProfileCompleted:{
			type: Boolean,
			default: false,
		}	},
	{ timestamps: true }
);

module.exports = model("CorporateRegister", corporateRegisterSchema);
