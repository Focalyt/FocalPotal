const { Schema, model } = require('mongoose');

const videoDataSchema=new Schema({
    title:String,
    embedURL:String,
    description:String,
    status:{
        type:Boolean,
        default:true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    sequence:{
        type:Number,
        default:50
    }
},{timestamps:true})
module.exports=model('videoData',videoDataSchema);
