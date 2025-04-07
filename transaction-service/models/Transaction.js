const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'La quantité doit être au moins de 1']
    },
    price: {
        type: Number,
        required: true
    },
    eventDetails: {
        title: String,
        date: Date,
        time: String,
        location: String
    }
});

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [transactionItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'completed', 'failed', 'refunded'],
        default: 'draft'
    },
    promoCode: {
        code: String,
        discount: Number
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'transfer'],
        required: function() {
            return this.status !== 'draft';
        }
    }
}, {
    timestamps: true
});

// Méthode pour calculer le total
transactionSchema.methods.calculateTotal = function() {
    let total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (this.promoCode && this.promoCode.discount) {
        total = total * (1 - this.promoCode.discount);
    }
    
    this.totalAmount = total;
    return total;
};

// Méthode pour vérifier si la transaction peut être modifiée
transactionSchema.methods.canBeModified = function() {
    return this.status === 'draft';
};

module.exports = mongoose.model('Transaction', transactionSchema);
