const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 1000 // Start from 1000 to generate WFR001001
    }
});

module.exports = mongoose.model('Counter', counterSchema);
