const mongoose = require('mongoose');


const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    promoCode: {
        code: String,
        discount: Number
    },
    date: {
        type: Date,
        default: Date.now()
    }
}, {
    timestamps: true
});

// Méthode pour calculer le total
transactionSchema.methods.calculateTotal = function() {
    let total = this.totalAmount;
    
    if (this.promoCode && this.promoCode.discount) {
        total = total * (1 - this.promoCode.discount);
    }
    
    this.totalAmount = total;
    return total;
};

module.exports = mongoose.model('Transaction', transactionSchema);
