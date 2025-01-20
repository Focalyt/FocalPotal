const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const collegeTodoSchema = new Schema({
  _college: { type: ObjectId, ref: 'College' },
  title: { type: String },
  description: String,
  labels: [String],
  isImportant: {
    type: Boolean,
    default: false,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('CollegeTodo', collegeTodoSchema);
