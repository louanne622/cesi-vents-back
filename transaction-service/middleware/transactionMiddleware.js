const Transaction = require('../models/Transaction');
const axios = require('axios');

// Middleware pour vérifier si l'utilisateur est authentifié
const isAuth = async (req, res, next) => {
    try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/profil`, {
            headers: {
                'x-auth-token': req.header('x-auth-token')
            }
        });
        
        req.user = response.data;
        next();
    } catch (err) {
        console.error('Erreur d\'authentification:', err);
        res.status(401).json({ message: "Authentification requise" });
    }
};

// Middleware pour valider les données de la transaction
const validateTransaction = async (req, res, next) => {
    try {
        const { event_id, amount, payment_method } = req.body;

        if (!event_id || !amount || !payment_method) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
        }

        // Vérifier si l'événement existe et a des tickets disponibles
        try {
            const eventResponse = await axios.get(`${process.env.EVENT_SERVICE_URL}/${event_id}`);
            const event = eventResponse.data;

            if (event.available_tickets <= 0) {
                return res.status(400).json({ message: 'Plus de tickets disponibles pour cet événement' });
            }
        } catch (err) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        next();
    } catch (error) {
        console.error('Erreur de validation de transaction:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = async (req, res, next) => {
    try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/profil`, {
            headers: {
                'x-auth-token': req.header('x-auth-token')
            }
        });
        
        if (response.data.role !== 'admin') {
            return res.status(401).json({ message: "Vous n'avez pas accès à cette fonctionnalité" });
        }
        
        next();
    } catch (err) {
        console.error('Erreur de vérification admin:', err);
        res.status(401).json({ message: "Authentification requise" });
    }
};

// Middleware pour vérifier si une transaction existe
const transactionExists = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction non trouvée' });
        }
        req.transaction = transaction;
        next();
    } catch (err) {
        console.error('Erreur de recherche de transaction:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Middleware pour vérifier si l'utilisateur a accès à la transaction
const canAccessTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction non trouvée' });
        }

        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/profil`, {
            headers: {
                'x-auth-token': req.header('x-auth-token')
            }
        });

        // Autoriser l'accès si l'utilisateur est admin ou propriétaire de la transaction
        if (response.data.role === 'admin' || transaction.user_id.toString() === response.data.id) {
            req.transaction = transaction;
            next();
        } else {
            return res.status(403).json({ message: "Vous n'avez pas accès à cette transaction" });
        }
    } catch (err) {
        console.error('Erreur de vérification d\'accès:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Middleware pour valider le statut de la transaction
const validateTransactionStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'completed', 'failed', 'refunded'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Statut invalide',
                validStatuses
            });
        }

        next();
    } catch (err) {
        console.error('Erreur de validation du statut:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    isAuth,
    validateTransaction,
    isAdmin,
    transactionExists,
    canAccessTransaction,
    validateTransactionStatus
};
