const mongoose = require('mongoose');

const educationBoardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Regular', 'Open'], required: true },
  status:{type: Boolean, default: true}
}, { timestamps: true });

module.exports = mongoose.model('EducationBoard', educationBoardSchema);
