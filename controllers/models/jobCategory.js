const { Schema, model } = require('mongoose');

const jobCategorySchema = new Schema({
  name: {
    type: String, lowercase: true, trim: true, unique: true,
  },
  image: String,
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('JobCategory', jobCategorySchema);
