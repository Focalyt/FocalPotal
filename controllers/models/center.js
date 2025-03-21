const { Schema, model } = require('mongoose');

const centerSchema = new Schema({
  name: { type: String, unique: true },
  status: {
    type: Boolean,
    default: true,
  },
 
}, { timestamps: true });

module.exports = model('Center', centerSchema);
