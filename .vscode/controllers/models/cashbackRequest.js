const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;
const { cashbackRequestStatus } = require('../db/constant')
const cashbackRequestSchema = new Schema(
  {
    _candidate: {
      ref: "Candidate",
      type: ObjectId,
      required: true
    },
    _cashback: {
      ref: "CandidateCashBack",
      type: ObjectId,
      required: true
    },

    amount: {
      type: Number,
    },
    isAccepted: {
        type: Boolean
    },
    status: {
        type: String,
        enum: Object.values(cashbackRequestStatus)
    },
    comment: { type: String },
    isPaid :{
      type:Boolean,
      default:false
    }

  },
  {
    timestamps: true,
  }
);
module.exports = model("CashBackRequest", cashbackRequestSchema);
