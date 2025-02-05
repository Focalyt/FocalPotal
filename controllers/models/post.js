const { Schema, model } = require("mongoose");
const { sign } = require("jsonwebtoken");

const { ObjectId } = Schema.Types;
const { jwtSecret } = require("../../config");

const PostSchema = new Schema({
  content: {
    type: String, // The main text content of the post
    required: true,
  },
  
  files: [
    {
      fileURL: {
        type: String, // Name of the uploaded file
        required: true,
      },
      fileType: {
        type: String, // Type of the file (e.g., 'image/png', 'video/mp4')
        required: true,
      },
    },
  ],
  createdBy: {
    type: ObjectId, // Links the post to the user who created it
    required: true,
  },
  userType: {
    type: String, // Specifies which type of user created the post
    enum: ['candidate','institute', 'college', 'company', 'admin'], // Allowed user types
    required: true,
  },
  likes: [
    {
      userId: { type: ObjectId }, // Reference to the user who liked
      userType: { type: String, enum: ['candidate', 'institute','college', 'company', 'admin'] },
    },
  ],
  comments: [
    {
      userId: { type: ObjectId },
      userType: { type: String, enum: ['candidate','institute', 'college', 'company', 'admin'] },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],status: {
    type: Boolean,
    default: true,
  },
  tags: [
      {
        userId: { type: ObjectId },
        name : {type:String},
        userType: { type: String, enum: ['candidate', 'institute','college' ,'company', 'admin'] }, // student <=> candidate
      },
    ],
  createdAt: {
    type: Date, // Timestamp for the post creation
    default: Date.now,
  },
});

module.exports = model('Post', PostSchema);
