const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const candidateQualificationSchema = new Schema({
  _candidate: { type: ObjectId, ref: 'Candidate' },
  name: { type: String },
  schoolOrCollege: String,
  boardOrUniv: { type: ObjectId, ref: 'University' },
  assesmentType: { type: Number, default: 0 }, // 0-CGPA, 1-%
  assesmentValue: String,
  details: [String],
  startYear: String,
  endYear: String,
  currentlyStudying: { type: Boolean, default: false },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('CandidateQualification', candidateQualificationSchema);
