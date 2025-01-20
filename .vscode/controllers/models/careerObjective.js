const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const careerObjectiveSchema = new Schema({
  _qual: [],
  _skill: [{ type: ObjectId, ref: 'Skill' }],
  name: { type: String, lowercase: true, trim: true },
  _concernPerson: { type: ObjectId, ref: "User" },
  _college: { type: ObjectId, ref: "College" },
  objectives: String,
  expStart: String,
  expEnd: String,
  status: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = model('CareerObjective', careerObjectiveSchema);
