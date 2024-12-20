const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const appUpdateSchema = new Schema({
  _qualification: [{ type: ObjectId, ref: 'Qualification' }],
  title: { type: String, lowercase: true, trim: true },
  date: String,
  image: String,
  stateId: String,
  countryId: String,
  deeplinking: { type: Number }, // 0-no, 1-company, 2-jobs, 3-skill test, 4-mock intertview
  message: String,
  expStart: String,
  expEnd: String,
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('AppUpdate', appUpdateSchema);
