const { Schema, model } = require("mongoose");
const coinsAlgoSchema = new Schema(
  {
    job : {type:Number,default:1},
    SMS :{type : Number, default:1},
    shortlist : {type : Number,default:1},
    candidateCoins : {type:Number},
    companyCoins : {type:Number},
    contactcoins : {type:Number}
  },
  { timestamps: true }
);

module.exports = model("CoinsAlgo", coinsAlgoSchema);
