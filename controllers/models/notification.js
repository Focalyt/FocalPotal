const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const notificationSchema = new Schema(
  {
    _candidate: { type: ObjectId, ref: "Candidate" },
    _company:{type:ObjectId,ref:"Company"},
    title: { type: String, trim: true },
    message: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    status: {
      type: Boolean,
      default: true,
    },
    source:String
  },
  { timestamps: true }
);
module.exports = model("Notification", notificationSchema);
