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
        enum: ['user', 'admin', 'clubleader']   
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
    },
    phone: {
        type: String,
        required: false
    },
    campus: {
        type: String,
        required: false,
        enum: ['Lille', 'Paris', 'Arras', 'Rouen']
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: false
    },
    logo: {
        url: {
            type: String,
            required: false
        },
        alt: {
            type: String,
            required: false
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
