const { Schema, model,Types } = require('mongoose');

const { ObjectId } = Schema.Types;
const cashBackSchema=new Schema({
    profilecomplete:{
        type:Number,
        default:0
    },
    videoprofile:{
        type:Number,
        default:0
    },
    shortlisted:{
        type:Number,
        default:0
    },
    hired:{
        type:Number,
        default:0
    },
    apply:{
        type:Number,
        default:0
    },
    threshold:{
        type:Number,
        default:0
    },
    streakDuration: {
        type: Number
    },
    Referral:{
        type:Number,
        default:0
    }
})
module.exports = model('cashBackLogic', cashBackSchema);