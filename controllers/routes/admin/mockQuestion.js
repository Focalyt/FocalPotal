const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const mockQuestionSchema = new Schema({
  _mockInterview: { type: ObjectId, ref: 'MockInterview' },
  question: {
    type: String, lowercase: true, trim: true,
  },
  description: String,
  comments: String,
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('MockQuestion', mockQuestionSchema);
