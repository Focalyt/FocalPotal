const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const smsHistorySchema = new Schema({
    count :{
        type:Number
    },
    module:{
        type:String
    },
    userId:{ type: ObjectId, ref: "User" }

}, { timestamps: true });


module.exports = model('SmsHistory', smsHistorySchema);