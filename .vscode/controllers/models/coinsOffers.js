const { Schema, model } = require("mongoose");
const { Decimal128 } = Schema.Types;
const coinsOffersSchema = new Schema(
  {
    forCandidate: { type: Boolean },
    displayOffer: { type: String },
    payAmount: { type: Decimal128 },
    getCoins: { type: Number },
    activationDate: { type: Date },
    activeTill: { type: Date },
    description: { type: String },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    availedCount: { type: Number}
  },
  { timestamps: true }
);

module.exports = model("coinsOffers", coinsOffersSchema);
