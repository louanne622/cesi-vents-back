const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Event'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    purchase_date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['valid', 'used', 'cancelled'],
        default: 'valid'
    },
    qr_code: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
