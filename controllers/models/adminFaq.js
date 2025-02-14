const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const faqSchema = new Schema({
   
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    
    
},{ timestamps: true });

// Auto-update `updatedAt` before saving
faqSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = model('Faq', faqSchema);

