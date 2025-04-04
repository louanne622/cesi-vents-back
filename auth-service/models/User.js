const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
    },
    bde_member: {
        type: Boolean,
        default: false
    },
    points: {
        type: Number,
        default: 0
    },
    last_name: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
