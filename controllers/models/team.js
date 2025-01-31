const { Schema, model } = require("mongoose");
const { sign } = require("jsonwebtoken");

const { ObjectId } = Schema.Types;
const { jwtSecret } = require("../../config");

const TeamSchema = new Schema({
  image: 
    {
      fileURL: {
        type: String, // Name of the uploaded file
        required: true,
      }
    },
  
  position: {
    type: String, // Specifies which type of user created the post
    enum: ['Senior Management', 'Management', 'Staff'], // Allowed user types
    required: true,
  },
  name:
    { type: String, required: true, },
  designation:
    { type: String, required: true, },
  description:
    { type: String },
    sequence: {
      type: Number,
      default: 50
    },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date, // Timestamp for the post creation
    default: Date.now,
  },
});

module.exports = model('Team', TeamSchema);
