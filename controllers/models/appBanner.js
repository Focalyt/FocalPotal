// const { Schema, model } = require('mongoose');

// const { ObjectId } = Schema.Types;

// const appBannerSchema = new Schema({
//   _qualification: [{ type: ObjectId, ref: 'Qualification' }],
//   _college: { type: ObjectId, ref: 'College' },
//   banner: String,
//   stateId: String,
//   countryId: String,
//   applicableFor: { type: Number }, // 0-collegeCandidate, 1-otherCandidate, 2-both
//   status: {
//     type: Boolean,
//     default: true, 
//   },
// }, { timestamps: true });

// module.exports = model('AppBanner', appBannerSchema);




const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { ObjectId } = Schema.Types;
// Define the schema
const appBannerSchema = new Schema(
  {
    _qualification: [
      {
        type: ObjectId,
        ref: 'Qualification',
        description: 'References the Qualification collection',
      },
    ],
    _college: {
      type: ObjectId,
      ref: 'College',
      description: 'References the College collection',
    },
    banner: {
      type: String,
      required: true,
      description: 'URL or path to the banner image',
    },
    stateId: {
      type: String,
      required: true,
      description: 'Identifier for the state associated with this banner',
    },
    countryId: {
      type: String,
      required: true,
      description: 'Identifier for the country associated with this banner',
    },
    applicableFor: {
      type: Number,
      enum: [0, 1, 2],
      required: true,
      description: '0 - College Candidate, 1 - Other Candidate, 2 - Both',
    },
    status: {
      type: Boolean,
      default: true,
      description: 'Indicates whether the banner is active (true) or inactive (false)',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Attach descriptions for `timestamps`  
appBannerSchema.paths.createdAt.options.description = 'Timestamp when the document was created';
appBannerSchema.paths.updatedAt.options.description = 'Timestamp when the document was last updated';

// Export the model
module.exports = model('AppBanner', appBannerSchema);
