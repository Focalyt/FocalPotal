const { kStringMaxLength } = require('buffer');
const { required } = require('joi');
const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const FAQ = new Schema({
    
    Question: {type: String,
        required: true,},
    Answer: {type: String,
        required: true,},   
    status: {
        type: Boolean,
        default: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    
}, { timestamps: true });

module.exports = model('FAQ', FAQ);