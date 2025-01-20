const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const candidateReferenceSchema = new Schema({
  _candidate: { type: ObjectId, ref: 'Candidate' },
  name: { type: String },
  designation: String,
  organization: String,
  mobile: String,
  email: String,
  remarks: String,
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('CandidateReference', candidateReferenceSchema);
