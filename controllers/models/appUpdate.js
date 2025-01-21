// const { Schema, model } = require('mongoose');

// const { ObjectId } = Schema.Types;

// const appUpdateSchema = new Schema({
//   _qualification: [{ type: ObjectId, ref: 'Qualification' }],
//   title: { type: String, lowercase: true, trim: true },
//   date: String,
//   image: String,
//   stateId: String,
//   countryId: String,
//   deeplinking: { type: Number }, // 0-no, 1-company, 2-jobs, 3-skill test, 4-mock intertview
//   message: String,
//   expStart: String,
//   expEnd: String,
//   status: {
//     type: Boolean,
//     default: true,
//   },
// }, { timestamps: true });

// module.exports = model('AppUpdate', appUpdateSchema);



const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const appUpdateSchema = new Schema(
  {
    _qualification: [
      {
        type: ObjectId,
        ref: 'Qualification',
        description: 'References the Qualification collection to associate updates with qualifications',
      },
    ],
    title: {
      type: String,
      lowercase: true,
      trim: true,
      description: 'Title of the app update, stored in lowercase with no extra spaces',
    },
    date: {
      type: String,
      description: 'Date of the update (e.g., when the update was published)',
    },
    image: {
      type: String,
      description: 'URL or path to the image associated with the update',
    },
    stateId: {
      type: String,
      description: 'Identifier for the state where the update is relevant',
    },
    countryId: {
      type: String,
      description: 'Identifier for the country where the update is relevant',
    },
    deeplinking: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
      description: 'Indicates the type of deep linking for the app update. Values: 0 (no), 1 (company), 2 (jobs), 3 (skill test), 4 (mock interview)', // 0-no, 1-company, 2-jobs, 3-skill test, 4-mock intertview
    },
    message: {
      type: String,
      description: 'Message or description related to the app update',
    },
    expStart: {
      type: String,
      description: 'The start date for the update or event (e.g., promotion period)',
    },
    expEnd: {
      type: String,
      description: 'The end date for the update or event (e.g., promotion expiration)',
    },
    status: {
      type: Boolean,
      default: true,
      description: 'Indicates if the update is active (true) or inactive (false)',
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// Attach descriptions for `timestamps`
appUpdateSchema.paths.createdAt.options.description = 'Timestamp when the update document was created';
appUpdateSchema.paths.updatedAt.options.description = 'Timestamp when the update document was last updated';

// Export the model
module.exports = model('AppUpdate', appUpdateSchema);
