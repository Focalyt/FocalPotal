const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const companySchema = new Schema(
	{
		candidateStatus: [
			{
				type: new Schema(
					{
						candidate: { type: ObjectId, ref: "Candidate" },
						status: { type: String },
						comment: { type: String },
						job: { type: ObjectId, ref: "Vacancy" },
						isRejected: {type: Boolean},
						eventDate: {type: String},
						concernedPerson: {type: String}
					},
					{ timestamps: true }
				  )
			  
			},
		  ],
		//   Courses: [{ type: ObjectId, ref: "courses"}],
		  _concernPerson: { type: ObjectId, ref: "User" },
		_industry: { type: ObjectId, ref: "Industry" },
		_subIndustry: { type: ObjectId, ref: "SubIndustry" },
		unmasked: [{type: ObjectId, ref: "User"}],
		name: { type: String, lowercase: false, trim: true },
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		logo: String,//
		mediaGallery: [String],
		mediaGalaryVideo: String,
		cityId: String,
		stateId: String,
		countryId: String,
		linkedin: String,
		twitter: String,
		facebook: String,
		headOAddress: String,
		description: String,
		zipcode: String,
		companyExecutives:[{name:String,designation:String,image:String,linkedin:String}],
		whatsappNumber:String,
		place:String,
		latitude:String,
		longitude:String,
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
			default: false
		},
		availableCredit: {
			type: Number
		},
		flag: {
			type: Boolean
		},
		creditLeft: {
			type: Number
		},
		location: {
			type: {
			  type: String, 
			  enum: ['Point']
			},
			coordinates: {
			  type: [Number]
			}
		  }
	},
	{ timestamps: true }
);

module.exports = model("Company", companySchema);
