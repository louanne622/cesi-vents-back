const mongoose = require('mongoose');

const goodieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    points_cost: {
        type: Number,
        required: true,
        min: 0
    },
    image_url: {
        type: String,
        required: false
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    available: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Goodie', goodieSchema);
