const { Schema, model } = require('mongoose');
const skillSchema = new Schema({
  name: {
    type: String, trim: true, unique: true,
  },
  type: String,
  status: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true });

module.exports = model('Skill', skillSchema);
