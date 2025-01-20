const { Schema, model} = require("mongoose")
const { ObjectId } = Schema.Types

const loanEnquirySchema = new Schema({
    _candidate : {
        type: ObjectId,
        ref:"Candidate",
        required: true
    },
    amount : {
        type : Number
    },
    remarks:{
        type:String
    },
    purpose : {
        type:String
    },
    status: String,
    comment:String,
    salary:{
        type:Number
    }

},{timestamps : true})

module.exports = model("LoanEnquiry", loanEnquirySchema)