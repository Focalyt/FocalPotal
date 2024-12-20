const { Schema, model } = require('mongoose');

const courseSectorsSchema = new Schema({
  name: {
    type: String, lowercase: true, trim: true, unique: true,
  },
  image: {
    type: String
  },
  status: {
    type: Boolean,
    default: true
  },
}, { timestamps: true });

module.exports = model('CourseSectors', courseSectorsSchema);
