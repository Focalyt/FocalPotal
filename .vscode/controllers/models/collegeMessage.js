const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const collegeMessageSchema = new Schema({
  _qualification: { type: ObjectId, ref: 'Qualification' },
  _template: { type: ObjectId, ref: 'CollegeSms' },
  _subQualification: { type: ObjectId, ref: 'SubQualification' },
  passingYear: String,
  type: { type: Number }, // 0-All, 1-Shortlisted, 2-Hired, 3-Rejected, 4-OnHold
  message: String,
  isDeleted: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('CollegeMessage', collegeMessageSchema);
