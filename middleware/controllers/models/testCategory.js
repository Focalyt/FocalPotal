const { Schema, model } = require('mongoose');

const testCategorySchema = new Schema({
  name: {
    type: String, lowercase: true, trim: true, unique: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('TestCategory', testCategorySchema);
