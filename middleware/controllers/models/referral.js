const { Schema, model,Types } = require('mongoose');
const { referalStatus } = require('../db/constant')

const { ObjectId } = Schema.Types;
const referralSchema = new Schema({
    referredBy:{
        type: ObjectId, ref: "Candidate",
        required:true
    },
    referredTo:{
        type: ObjectId, ref: "Candidate",
        required:true
    },
    status:{
        type:String,
        enum:Object.values(referalStatus)
    },
    earning:Number
},{timestamps:true})

module.exports = model("Referral",referralSchema)