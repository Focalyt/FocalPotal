const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const candidateCareerSchema = new Schema({
  _candidate: { type: ObjectId, ref: 'Candidate' },
  companyName: { type: String },
  designation: String,
  cityId: String,
  stateId: String,
  countryId: String,
  description: String,
  startDate: String,
  endDate: String,
  currentlyEmployed: { type: Boolean, default: false },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('CandidateCareer', candidateCareerSchema);
