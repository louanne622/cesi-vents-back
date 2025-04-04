const express = require('express');
const router = express.Router();
const BdeMembership = require('../models/bde_membership');
const { validateBdeMembership } = require('../middleware/bde_membershipMiddlewares');
const axios = require('axios');

// Créer un nouveau membership BDE et ajouter 10 points de fidélité
router.post('/new', async (req, res) => {
    try {
        const { user_id, pourcentage_reduction } = req.body;

        const newMembership = new BdeMembership({
            user_id,
            membership_start: new Date(),
            membership_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year membership
            pourcentage_reduction
        });

        await newMembership.save();

        // Update user points through auth service API
        try {
            await axios.post(`${process.env.AUTH_SERVICE_URL}/${user_id}/addPoints`, {
                userId: user_id,
                points: 10
            });
        } catch (error) {
            console.error('Error updating user points:', error);
            // Continue anyway as the membership is already created
        }

        res.status(201).json(newMembership);
    } catch (error) {
        console.error('Error creating membership:', error);
        res.status(500).json({ message: 'Error creating membership', error: error.message });
    }
});

// Get membership by user ID
router.get('/user/:userId', async (req, res) => {
    try {
        const membership = await BdeMembership.findOne({ user_id: req.params.userId });
        if (!membership) {
            return res.status(404).json({ message: 'Membership not found' });
        }
        res.json(membership);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
