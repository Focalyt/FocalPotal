const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const contactSchema = new Schema({
  status: {
    type: Boolean,
    default: true,
  },
  isDeleted:{
    type: Boolean,
    default: false,
  },
  name:String,
  whatsapp:Number,
  mobile:Number
}, { timestamps: true });

module.exports = model('contact', contactSchema);