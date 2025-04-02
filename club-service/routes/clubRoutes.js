const express = require('express');
const router = express.Router();
const Club = require('../models/Clubs');

// Pour créer un club
router.post('/create', async (req, res) => {
    try {
        const { name, description, logo, email } = req.body;
        const club = new Club({
            name,
            description,
            logo: {
                url: logo.url,
                alt : logo.alt
            },
            email
        });
        await club.save();
        res.status(201).json(club);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour obtenir la liste des clubs
router.get('/list', async (req, res) => {
    try {
        const clubs = await Club.find();
        res.json(clubs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Pour obtenir un club par ID
router.get('/:id', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club non trouvé' });
        }
        res.json(club);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
