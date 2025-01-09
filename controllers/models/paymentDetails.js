const { Schema, model } = require("mongoose");
const { Decimal128 } = Schema.Types;
const { ObjectId } = Schema.Types;

const paymentDetailsSchema = new Schema(
  {
    paymentId: { type: String },
    orderId: { type: String },
    amount: { type: Number },
    coins: { type: Number },
    _candidate: { type: ObjectId, ref: "Candidate", required: true },
    _company: { type: ObjectId, ref: "Company" },
    _offer: { type: ObjectId, ref: "coinsOffers" },
    _course: { type: ObjectId, ref: "Courses" },
    paymentStatus: { type: String },
    isDeleted: { type: Boolean, default: false },
    comments:String
  },
  { timestamps: true }
);

module.exports = model("PaymentDetails", paymentDetailsSchema);