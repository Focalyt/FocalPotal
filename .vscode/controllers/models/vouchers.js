const { Schema, model } = require("mongoose");
const vouchersSchema=new Schema({
    forCandidates:{type:Boolean},
        displayVoucher: { type: String },
    code:{ type: String,upperCase:true},
    value: { type: Number },
    activationDate: { type: Date },
    activeTill: { type: Date },
    description: { type: String },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    availedCount: { type: Number,default:0},
    voucherType:{type:String} 
},
{ timestamps: true })

module.exports=model("vouchers",vouchersSchema);