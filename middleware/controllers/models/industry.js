const { Schema, model } = require('mongoose');

const industrySchema = new Schema({
  name: { type: String, unique: true },
  image: String,
  status: {
    type: Boolean,
    default: true,
  },
  deleteStatus:{
    type:Boolean,
    default:false 
  }
}, { timestamps: true });

module.exports = model('Industry', industrySchema);
