const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    logo: {
        url: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            required: true
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    category: {
        type: String,
        required: true
    },
    campus: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Club', ClubSchema);
