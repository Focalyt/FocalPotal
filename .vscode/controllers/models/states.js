const beautifyUnique = require('mongoose-beautiful-unique-validation');
const { Schema, model } = require('mongoose');

const stateSchema = new Schema({
  stateId: {
    type: String,
  },
  countryId: {
    type: String,
    default: '101'
  },
  status: {
    type: Boolean,
    default: true,
  },
  name: {
    type: String, required: true, trim: true, unique: 'State name already exists!',
  },
}, { timestamps: true });

stateSchema.plugin(beautifyUnique, {
  defaultMessage: 'Duplicate key error, ({VALUE})!',
});

module.exports = model('State', stateSchema);
