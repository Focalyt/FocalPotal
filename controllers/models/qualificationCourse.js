const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const qualificationCourseSchema = new Schema({
  name: { type: String, unique: true },
  _qualification: { type: ObjectId, ref:"Qualification" },
  status: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = model('QualificationCourse', qualificationCourseSchema);
