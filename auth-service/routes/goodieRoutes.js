const express = require('express');
const router = express.Router();
const Goodie = require('../models/Goodie');
const GoodieExchange = require('../models/GoodieExchange');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// Liste tous les goodies disponibles
router.get('/', async (req, res) => {
    try {
        const goodies = await Goodie.find({ available: true, stock: { $gt: 0 } });
        res.json(goodies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Ajouter un nouveau goodie (admin seulement)
router.post('/', auth, isAdmin, async (req, res) => {
    const goodie = new Goodie({
        name: req.body.name,
        description: req.body.description,
        points_cost: req.body.points_cost,
        image_url: req.body.image_url,
        stock: req.body.stock
    });

    try {
        const newGoodie = await goodie.save();
        res.status(201).json(newGoodie);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Échanger des points contre un goodie
router.post('/exchange/:goodieId', auth, async (req, res) => {
    try {
        const goodie = await Goodie.findById(req.params.goodieId);
        if (!goodie) {
            return res.status(404).json({ message: 'Goodie non trouvé' });
        }

        if (!goodie.available || goodie.stock <= 0) {
            return res.status(400).json({ message: 'Ce goodie n\'est pas disponible' });
        }

        const user = await User.findById(req.user.id);
        if (user.points < goodie.points_cost) {
            return res.status(400).json({ 
                message: 'Points insuffisants',
                required: goodie.points_cost,
                current: user.points
            });
        }

        // Créer l'échange
        const exchange = new GoodieExchange({
            user_id: user._id,
            goodie_id: goodie._id,
            points_spent: goodie.points_cost
        });

        // Mettre à jour les points de l'utilisateur et le stock
        user.points -= goodie.points_cost;
        goodie.stock -= 1;
        if (goodie.stock === 0) {
            goodie.available = false;
        }

        await Promise.all([
            exchange.save(),
            user.save(),
            goodie.save()
        ]);

        res.status(201).json({
            message: 'Échange réussi',
            exchange: exchange,
            remaining_points: user.points
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtenir l'historique des échanges d'un utilisateur
router.get('/my-exchanges', auth, async (req, res) => {
    try {
        const exchanges = await GoodieExchange.find({ user_id: req.user.id })
            .populate('goodie_id')
            .sort({ createdAt: -1 });
        res.json(exchanges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
