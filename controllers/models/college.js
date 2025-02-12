const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const collegeSchema = new Schema({
  _concernPerson: { type: ObjectId, ref: 'User' },
  _qualification: [{ type: ObjectId, ref: 'Qualification' }],
  _university: { type: ObjectId, ref: 'University' },
  name: { type: String, lowercase: false, trim: true },
  password :{ type: String , required: true},
  confirmPassword :{ type: String , required: true},
  type: {type: String , enum: ['School','College', 'Computer Center', 'University']},
  website: {
    type: String, lowercase: true, trim: true,
  },
  logo: String,
  banner: String,
  mediaGallery: [String],
  cityId: { type: ObjectId, ref: 'City' },
  stateId: { type: ObjectId, ref: 'State' },
  uploadCandidates: [String],
  countryId: String,
  linkedin: String,
  twitter: String,
  facebook: String,
  address: String,
  description: String,
  zipcode: String,
  place:String,
  latitude:String,
  longitude:String,
  collegeRepresentatives:[{name:String,designation:String,email:String,mobile:String}],
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
  flag: {
    type: Boolean
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  }
}, { timestamps: true });

module.exports = model('College', collegeSchema);
