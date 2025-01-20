const { Schema, model, Types } = require("mongoose");

const { ObjectId } = Schema.Types;
const { candidateCashbackEventName, cashbackEventType } = require('../db/constant')
const candidateCashBackSchema = new Schema(
  {
    candidateId: {
      ref: "Candidate",
      type: ObjectId,
      require: true,
    },
    eventType: { type: String, lowercase: true, enum: Object.values(cashbackEventType) },
    eventName: {
      type: String,
      lowercase: true,
      enum: Object.values(candidateCashbackEventName),
    },
    amount: {
      type: Number,
    },
    isPending: {
      type: Boolean,
      default: true,
    },
    comment: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);
module.exports = model("CandidateCashBack", candidateCashBackSchema);
