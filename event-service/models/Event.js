const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    pricePaid: {
        type: Number,
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
});

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:mm)']
    },
    location: {
        type: String,
        required: true
    },
    maxCapacity: {
        type: Number,
        required: true,
        min: [1, 'La capacité doit être au moins de 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Le prix ne peut pas être négatif']
    },
    registrationDeadline: {
        type: Date,
        required: true,
        validate: {
            validator: function(v) {
                return v <= this.date;
            },
            message: 'La date limite d\'inscription doit être avant la date de l\'événement'
        }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled'],
        default: 'published'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        immutable: true // Empêche la modification après la création
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    participants: [participantSchema]
}, {
    timestamps: true
});

// Méthode pour vérifier si l'événement peut être modifié
eventSchema.methods.canBeModified = function() {
    return this.participants.length === 0 || this.status === 'draft';
};

// Méthode pour vérifier si l'événement est complet
eventSchema.methods.isFull = function() {
    return this.participants.length >= this.maxCapacity;
};

// Méthode pour vérifier si les inscriptions sont encore ouvertes
eventSchema.methods.isRegistrationOpen = function() {
    return (
        this.status === 'published' &&
        !this.isFull() &&
        new Date() <= this.registrationDeadline
    );
};

// Méthode pour annuler l'événement
eventSchema.methods.cancel = async function() {
    this.status = 'cancelled';
    await this.save();
};

// Méthode pour obtenir la liste des participants
eventSchema.methods.getParticipantsList = function() {
    return this.participants.map(p => ({
        name: `${p.firstName} ${p.lastName}`,
        email: p.email,
        pricePaid: p.pricePaid,
        registrationDate: p.registrationDate
    }));
};

module.exports = mongoose.model('Event', eventSchema);
