const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const jobSubCategorySchema = new Schema({
  _jobCategory: { type: ObjectId, ref: 'JobCategory' },
  name: {
    type: String, lowercase: true, trim: true, unique: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('JobSubCategory', jobSubCategorySchema);
