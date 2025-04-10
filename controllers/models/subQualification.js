const { Schema, model , mongoose} = require('mongoose');

const { ObjectId } = Schema.Types;

const subQualificationSchema = new Schema({
  name: {
    type: String, lowercase: false, trim: true,required:true
  },
  _qualification: { type: ObjectId, ref: 'Qualification',required:true },
  _course: { type: ObjectId, ref: 'QualificationCourse', required:true },
  subStream : {type : String , trim: true},
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('SubQualification', subQualificationSchema);
