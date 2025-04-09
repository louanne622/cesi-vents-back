const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    promotion_code: {
        type: String,
        required: true,
        unique: true
    },
    validation_date: {
        type: Date,
        required: true
    },
    max_use: {
        type: Number,
        required: true
    },
    activate: {
        type: Boolean,
        default: true
    },
    id_club: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: false
    }],
    value: {
        type: Number,
        required: true,
        min: [0, 'Percentage value cannot be negative'],
        max: [100, 'Percentage value cannot exceed 100']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Promotion', promotionSchema);
