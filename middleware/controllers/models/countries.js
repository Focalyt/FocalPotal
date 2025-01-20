const beautifyUnique = require('mongoose-beautiful-unique-validation');
const { Schema, model } = require('mongoose');

const countrySchema = new Schema({
  name: String,
  countryId: String,
}, { timestamps: true });

countrySchema.plugin(beautifyUnique, {
  defaultMessage: 'Duplicate key error, ({VALUE})!',
});

module.exports = model('Country', countrySchema);
