const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;
const { kycStatus } = require('../db/constant')

const kycDocumentSchema = new Schema({
  _candidate: { type: ObjectId, ref: 'Candidate' },
  aadharCard: { type: String},
  aadharCardImage: { type: String},
  panCard: { type: String},
  panCardImage: { type: String},
  kycCompleted: { type: Boolean, default: false},
  status: { type: String, enum: Object.values(kycStatus)},
  comment: { type: String }
}, { timestamps: true });

module.exports = model('KycDocument', kycDocumentSchema);
