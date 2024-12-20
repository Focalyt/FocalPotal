const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const candidateProjectSchema = new Schema({
  _candidate: { type: ObjectId, ref: 'Candidate' },
  name: { type: String },
  url: String,
  startDate: String,
  endDate: String,
  currentlyUndergoing: { type: Boolean, default: false },
  description: String,
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('CandidateProject', candidateProjectSchema);
