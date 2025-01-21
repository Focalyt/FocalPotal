const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const coverLetterSchema = new Schema({
  _concernPerson: { type: ObjectId, ref: "User" },
  _college: { type: ObjectId, ref: "College" },
  _qualification: [{ type:   ObjectId, ref: 'Qualification' }],
  _subQualification: [{ type: ObjectId, ref: 'SubQualification' }],
  _industry: [{ type: ObjectId, ref: 'Industry' }],
  _subIndustry: [{ type: ObjectId, ref: 'SubIndustry' }],
  name: { type: String, lowercase: true, trim: true },
  experienceFrom: String,
  experienceTo: String,
  active: {
    type: Number,
    default: 0,
  },
  subjectLine: String,
  letterContent: String,
  isAllInd: {
    type: Boolean,
    default: false,
  },
  isAllQual: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = model('CoverLetter', coverLetterSchema);
