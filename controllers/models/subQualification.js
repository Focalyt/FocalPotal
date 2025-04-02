const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const subQualificationSchema = new Schema({
  name: {
    type: String, lowercase: false, trim: true,
  },
  _qualification: { type: ObjectId, ref: 'Qualification' },
  subStream : {type : String , trim: true},
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('SubQualification', subQualificationSchema);
