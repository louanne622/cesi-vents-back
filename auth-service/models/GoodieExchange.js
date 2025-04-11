const mongoose = require('mongoose');

const goodieExchangeSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    goodie_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goodie',
        required: true
    },
    points_spent: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GoodieExchange', goodieExchangeSchema);
