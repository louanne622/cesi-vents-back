const Promotion = require('../models/Promotion');
const axios = require('axios');

// Middleware pour valider les données de la promotion
const validatePromotion = async (req, res, next) => {
    try {
        const { promotion_code, validation_date, max_use, id_club } = req.body;

        if (!promotion_code || !validation_date || !max_use) {
            return res.status(400).json({ message: 'Les champs promotion_code, validation_date et max_use sont requis' });
        }

        if (max_use <= 0) {
            return res.status(400).json({ message: "Le nombre maximum d'utilisations doit être supérieur à 0" });
        }

        // Vérifier si le code promotion existe déjà
        const existingPromotion = await Promotion.findOne({ promotion_code });
        if (existingPromotion) {
            return res.status(400).json({ message: 'Ce code promotion existe déjà' });
        }

        // Vérifier si les clubs existent seulement si id_club est fourni
        if (id_club && id_club.length > 0) {
            try {
                for (const clubId of id_club) {
                    await axios.get(`${process.env.CLUB_SERVICE_URL}/${clubId}`);
                }
            } catch (err) {
                return res.status(400).json({ message: 'Un ou plusieurs clubs n\'ont pas été trouvés' });
            }
        }

        next();
    } catch (error) {
        console.error('Erreur de validation de promotion:', error);
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

// Middleware pour vérifier si une promotion existe
const promotionExists = async (req, res, next) => {
    try {
        const promotion = await Promotion.findById(req.params.id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion non trouvée' });
        }
        req.promotion = promotion;
        next();
    } catch (err) {
        console.error('Erreur de recherche de promotion:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Middleware pour vérifier si une promotion est valide et active
const isPromotionValid = async (req, res, next) => {
    try {
        const { promotion_code } = req.params;
        const promotion = await Promotion.findOne({ promotion_code });

        if (!promotion) {
            return res.status(404).json({ message: 'Code promotion non trouvé' });
        }

        if (!promotion.activate) {
            return res.status(400).json({ message: 'Cette promotion n\'est plus active' });
        }

        const now = new Date();
        const validationDate = new Date(promotion.validation_date);

        if (validationDate < now) {
            return res.status(400).json({ message: 'Cette promotion a expiré' });
        }

        req.promotion = promotion;
        next();
    } catch (err) {
        console.error('Erreur de validation de promotion:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    validatePromotion,
    isAdmin,
    promotionExists,
    isPromotionValid
};
