const { Schema, model } = require("mongoose");
const ObjectId=Schema.Types.ObjectId
const voucherUsesSchema=new Schema({
    _candidate:{type:ObjectId,ref:"Candidate"},
    _company:{type:ObjectId,ref:"Company"},
    _voucher:{type:ObjectId,ref:"voucher"},
    status:{type:Boolean,default:true},
    isDeleted:{type:Boolean,default:false}
},
{ timestamps: true })
module.exports=model("VoucherUses",voucherUsesSchema);