const { Schema, model } = require("mongoose");
const { sign } = require("jsonwebtoken");

const { ObjectId } = Schema.Types;
const { jwtSecret } = require("../../config");

const candidateRegisterSchema = new Schema(
	{  	_concernPerson: { type: ObjectId, ref: "User" },
		candidate_Qualification:[{Qualificaton:String,subQualification:String,College:String,University:String,AssessmentType:String,PassingYear:String,Result:String}],
		candidate_Experiences:[{Industry_Name:String,SubIndustry_Name:String,Company_Name:String
			,Company_Email:String,Company_State:String,Company_City:String
			,Comments:String,Experience:String}],
		techSkills:[{id:ObjectId,URL:String}],	
		nonTechSkills:[{id:ObjectId,URL:String}],
		name: { type: String, lowercase: true, trim: true },
		mobile: {
			type: String,
			lowercase: true,
			trim: true
		},
		basicQualification:String,
		yearOfPassing:String,
		workerStatus:String,
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		image: String,
		candidatePrefLocation:[{state:String,city:String}],
		gender: String,
		countryId: String,
		address: String,
		pincode: String,
		session: String,
		resume: String,
		cityId:String,
		stateId:String,
		isProfileCompleted:{
			type:Boolean,
			default:true
		},
        commentSkillSection:String,
		careerObjective: String,
		enrollmentFormPdfLink: String,
		status: {
			type: Boolean,
			default: true,
		},
		total_Exp:String,
		interests: [String],
		accessToken: [String],
		isDeleted: {
			type: Boolean,
			default: false,
		}
	},
	{ timestamps: true }
);
candidateRegisterSchema.methods = {
	async generateAuthToken() {
		const data = { id: this._id.toHexString() };
		const token = sign(data, jwtSecret).toString();

		if (!this.accessToken || !Array.isArray(this.accessToken))
			this.accessToken = [];

		this.accessToken.push(token);
		await this.save();
		return token;
	},
};
module.exports = model("CandidateRegister", candidateRegisterSchema);
