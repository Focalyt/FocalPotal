const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const skillTestQuestionSchema = new Schema({
  _concernPerson: { type: ObjectId, ref: "User" },
  _skillTest: { type: ObjectId, ref: 'SkillTest' },
  _skill: [{ type: ObjectId, ref: 'Skill' }],
  _college: { type: ObjectId, ref: "College" },
  options: [
    {
      option: {
        type: String,
        trim: true,
      },
      correct: {
        type: Boolean,
        default: false,
      },
      weightage: {
        type: Number,
        default: 0,
      },
    },
  ],
  question: String,
  questionNo: String,
  time: String, // In Seconds
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('SkillTestQuestion', skillTestQuestionSchema);
