const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    id_transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
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
    id_club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Promotion', promotionSchema);
