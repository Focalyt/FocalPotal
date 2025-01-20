const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const skillTestSchema = new Schema({
  _concernPerson: { type: ObjectId, ref: "User" },
  _skill: [{ type: ObjectId, ref: 'Skill' }],
  _industry: { type: ObjectId, ref: 'Industry' },
  _subIndustry: [{ type: ObjectId, ref: 'SubIndustry' }],
  _qualification: { type: ObjectId, ref: 'Qualification' },
  _subQualification: [{ type: ObjectId, ref: 'SubQualification' }],
  name: {
    type: String, lowercase: true, trim: true,
  },
  _college: { type: ObjectId, ref: "College" },
  _category: { type: String },
  level: { type: Number, default: 0 }, // 0-Easy, 1-Medium, 2-Hard
  webCam: { type: Number, default: 0 }, // 0-On, 1-Off
  time: String,
  credits: String,
  image: String,
  passPercentage: String,
  startDate: Date,
  endDate: Date,
  description: String,
  instruction: String,
  status: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = model('SkillTest', skillTestSchema);
