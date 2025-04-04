const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { validateTransaction, isAdmin, transactionExists, canAccessTransaction, validateTransactionStatus } = require('../middleware/transactionMiddleware');
const axios = require('axios');

// Créer une transaction
router.post('/create', validateTransaction, async (req, res) => {
    try {
        // Récupérer l'utilisateur authentifié
        const userResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profil`, {
            headers: {
                'x-auth-token': req.header('x-auth-token')
            }
        });
        const user = userResponse.data;

        const { event_id, amount, payment_method } = req.body;

        const transaction = new Transaction({
            user_id: user.id,
            event_id,
            amount,
            payment_method
        });

        await transaction.save();

        // Mettre à jour le nombre de tickets disponibles
        try {
            await axios.put(`${process.env.EVENT_SERVICE_URL}/api/events/${event_id}/reserve-ticket`);
        } catch (err) {
            // Si la mise à jour échoue, annuler la transaction
            await Transaction.findByIdAndDelete(transaction._id);
            return res.status(500).json({ message: "Erreur lors de la réservation du ticket" });
        }

        res.status(201).json(transaction);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Obtenir l'historique des transactions d'un utilisateur
router.get('/my-transactions', async (req, res) => {
    try {
        // Récupérer l'utilisateur authentifié
        const userResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profil`, {
            headers: {
                'x-auth-token': req.header('x-auth-token')
            }
        });
        const user = userResponse.data;

        const transactions = await Transaction.find({ user_id: user.id });
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Obtenir une transaction spécifique (utilisateur propriétaire ou admin)
router.get('/:id', canAccessTransaction, async (req, res) => {
    res.json(req.transaction);
});

// Mettre à jour le statut d'une transaction (admin seulement)
router.put('/:id/status', isAdmin, transactionExists, validateTransactionStatus, async (req, res) => {
    try {
        const { status } = req.body;
        req.transaction.status = status;
        await req.transaction.save();

        // Si la transaction est annulée ou remboursée, remettre le ticket en disponibilité
        if (status === 'failed' || status === 'refunded') {
            try {
                await axios.put(`${process.env.EVENT_SERVICE_URL}/api/events/${req.transaction.event_id}/release-ticket`);
            } catch (err) {
                console.error('Erreur lors de la libération du ticket:', err);
                // On continue car la transaction a déjà été mise à jour
            }
        }

        res.json(req.transaction);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Obtenir toutes les transactions (admin seulement)
router.get('/admin/all', isAdmin, async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
