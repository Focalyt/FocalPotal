const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const consumptionSchema = new Schema({
  status: {
    type: Boolean,
    default: true,
  },
  template:{ type: ObjectId, ref: "template" },
  _company:{ type:ObjectId,ref:'Company'},
  messages:{
    type:Number
  }
}, { timestamps: true });

module.exports = model('Consumption', consumptionSchema);