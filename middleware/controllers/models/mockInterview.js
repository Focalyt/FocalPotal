const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const mockInterviewSchema = new Schema({
  _concernPerson: { type: ObjectId, ref: "User" },
  _college: { type: ObjectId, ref: "College" },
  _category: { type: String },
  _industry: [{ type: ObjectId, ref: 'Industry' }],
  _skill: [{ type: ObjectId, ref: 'Skill' }],
  _streams: [{ type: ObjectId, ref: 'Qualification' }],
  name: {
    type: String, lowercase: true, trim: true,
  },
  timeLimit: Number,
  marks: Number,
  status: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = model('MockInterview', mockInterviewSchema);
