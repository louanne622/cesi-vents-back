const express = require('express');
const router = express.Router();
const BdeMembership = require('../models/bde_membership');
const { validateBdeMembership } = require('../middleware/bde_membershipMiddlewares');
const User = require('../../auth-service/models/User');

// Créer un nouveau membership BDE et ajouter 10 points de fidélité
router.post('/new', async (req, res) => {
    try {
        const { user_id, pourcentage_reduction } = req.body;

        const newMembership = new BdeMembership({
            user_id,
            membership_start: new Date(),
            membership_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year membership
            pourcentage_reduction,
            promo_code: `CESI-${Math.random().toString(36).substr(2, 9)}`
        });


        // Ajouter 10 points de fidélité
        const user = await User.findById(user_id);
        user.points += 10;
        await user.save();

        await newMembership.save();
        res.status(201).json(newMembership);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Obtenir les informations de membership d'un utilisateur
router.get('/:user_id', validateBdeMembership, async (req, res) => {
    try {
        if (req.isBdeMember) {
            res.json(req.bdeMemberInfo);
        } else {
            res.status(404).json({ error: 'User is not a BDE member' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
