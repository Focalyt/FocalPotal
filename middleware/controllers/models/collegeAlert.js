const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const appBannerSchema = new Schema({
  _qualification: [{ type: ObjectId, ref: 'Qualification' }],
  banner: String,
  stateId: String,
  countryId: String,
  applicableFor: { type: Number }, // 0-collegeCandidate, 1-otherCandidate, 2-both
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = model('AppBanner', appBannerSchema);
