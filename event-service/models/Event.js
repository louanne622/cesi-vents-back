const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['complet', 'accessible'],
        default: 'accessible'
    },
    capacity: {
        type: Number,
        required: true,
        min: [1, 'La capacité doit être au moins de 1']
    },
    location: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
