const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const subIndustrySchema = new Schema({
  name: {
    type: String, trim: true, unique: true,
  },
  _industry: { type: ObjectId, ref: 'Industry' },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('SubIndustry', subIndustrySchema);
