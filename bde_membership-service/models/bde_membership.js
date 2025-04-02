const mongoose = require('mongoose');

const bdeMembershipSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    membership_start: {
        type: Date,
        required: true
    },
    membership_end: {
        type: Date,
        required: true
    },
    pourcentage_reduction: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

bdeMembershipSchema.index({ user_id: 1 });

module.exports = mongoose.model('BdeMembership', bdeMembershipSchema);
