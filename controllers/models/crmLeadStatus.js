const mongoose = require("mongoose");
const { Schema } = mongoose;

const crmLeadStatusSchema = new Schema({
  leadCategory: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  subStatus: {
    type: String,
    required: true
  }
 
}, { timestamps: true });

module.exports = mongoose.model("CRMLeadStatus", crmLeadStatusSchema);
