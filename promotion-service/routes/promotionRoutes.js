const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');
const { validatePromotion, isAdmin, promotionExists, isPromotionValid } = require('../middleware/promotionMiddleware');
const axios = require('axios');

// Créer une promotion (admin seulement)
router.post('/create', isAdmin, validatePromotion, async (req, res) => {
    try {
        const { promotion_code, validation_date, max_use, id_club } = req.body;
        
        const promotion = new Promotion({
            promotion_code,
            validation_date,
            max_use,
            id_club
        });

        await promotion.save();
        res.status(201).json(promotion);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Obtenir toutes les promotions (admin seulement)
router.get('/list', isAdmin, async (req, res) => {
    try {
        const promotions = await Promotion.find();
        res.json(promotions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Obtenir une promotion par son code
router.get('/code/:promotion_code', isPromotionValid, async (req, res) => {
    // La promotion est déjà vérifiée et attachée à req par le middleware
    res.json(req.promotion);
});

// Désactiver une promotion (admin seulement)
router.put('/deactivate/:id', isAdmin, promotionExists, async (req, res) => {
    try {
        req.promotion.activate = false;
        await req.promotion.save();
        res.json(req.promotion);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Vérifier la validité d'une promotion
router.get('/verify/:promotion_code', isPromotionValid, async (req, res) => {
    res.json({ 
        message: 'Promotion valide',
        promotion: req.promotion
    });
});

module.exports = router;
