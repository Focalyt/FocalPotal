const mongoose = require("mongoose");
const { Schema } = mongoose;

const qualificationSchema = new Schema({
  name: { type: String, unique: true },
  status: { type: Boolean, default: true },
  basic: { type: Boolean },
 
  courses: [{
    name: { type: String },
    status: { type: Boolean, default: true },
    
    streams: [{
      name: { type: String },
      status: { type: Boolean, default: true }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model("Qualification", qualificationSchema);
