const mongoose = require('mongoose');

const AccessUserSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  designation: { type: String },

  // Role Info
  role: {
    name: { type: String, required: true },
    description: { type: String },
    permissions: [{ type: String }] // Example: ['VIEW_USER', 'EDIT_USER']
  },

  // Custom Context-Specific Permissions (if any)
  contextPermissions: [
    {
      permKey: { type: String, required: true },        // like 'EDIT_COURSE'
      contextType: { type: String, enum: ['center', 'course'], required: true },
      contextId: { type: mongoose.Schema.Types.Mixed }, // can be number or string
    }
  ],

  // Metadata
  lastActive: { type: Date, default: Date.now },
  hasCustomPerms: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AccessUser', AccessUserSchema);
