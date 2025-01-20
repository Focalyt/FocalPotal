const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const templateSchema = new Schema({
  status: {
    type: Boolean,
    default: true,
  },
  templateId:{
    type:Number,
    unique:true,
    trim:true,
    required:true,
    maxlength:20
  },
  message:{
    type:String,
    trim:true
  },
  transactions:{
    type:Number
  },
  activationDate:{
    type: Date ,
    required:true
  },
  name:{
    type:String,
    required:true,
    trim:true
  },
  categories:{
    type:String,
    required:true
  },
  
}, { timestamps: true });

module.exports = model('template', templateSchema);
