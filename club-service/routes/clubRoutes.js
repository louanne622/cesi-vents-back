const express = require('express');
const router = express.Router();
const Club = require('../models/Clubs');
const { validateClub, isAdmin, clubExists, isClubAdmin } = require('../middleware/ClubsMiddlewares');

// Créer un club (admin seulement)
router.post('/create', isAdmin, validateClub, async (req, res) => {
    try {
        const { name, description, logo, email, category, campus } = req.body;
        const club = new Club({
            name,
            description,
            logo: {
                url: logo.url,
                alt: logo.alt
            },
            email,
            category,
            campus
        });

        await club.save();
        res.status(201).json(club);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Obtenir la liste des clubs
router.get('/list', async (req, res) => {
    try {
        const clubs = await Club.find();
        res.json(clubs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Obtenir un club par ID
router.get('/:id', clubExists, async (req, res) => {
    res.json(req.club);
});

// Mettre à jour un club (admin du club seulement)
router.put('/:id', isClubAdmin, async (req, res) => {
    try {
        const { name, description, logo, email, category, campus } = req.body;
        
        req.club.name = name;
        req.club.description = description;
        req.club.logo = logo;
        req.club.email = email;
        req.club.category = category;
        req.club.campus = campus;   
        await req.club.save();
        res.json(req.club);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Ajouter un admin au club (admin du club seulement)
router.post('/:id/admins', isClubAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'ID utilisateur requis' });
        }

        if (req.club.admins.includes(userId)) {
            return res.status(400).json({ message: 'Cet utilisateur est déjà admin' });
        }

        req.club.admins.push(userId);
        await req.club.save();
        
        res.json(req.club);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Supprimer un admin du club (admin du club seulement)
router.delete('/:id/admins/:userId', isClubAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (req.club.admins.length === 1) {
            return res.status(400).json({ message: 'Impossible de supprimer le dernier admin' });
        }

        req.club.admins = req.club.admins.filter(adminId => adminId.toString() !== userId);
        await req.club.save();
        
        res.json(req.club);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Supprimer un club (admin seulement)
router.delete('/:id', isAdmin, clubExists, async (req, res) => {
    try {
        const result = await Club.deleteOne({ _id: req.params.id });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Club non trouvé' });
        }
        
        res.json({ message: 'Club supprimé avec succès' });
    } catch (err) {
        console.error('Erreur lors de la suppression du club:', err);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du club' });
    }
});

// Obtenir un club par nom
router.get('/name/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const club = await Club.findOne({ name });
      if (!club) {
        return res.status(404).json({ message: 'Club non trouvé' });
      }
      return res.json(club);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  });

module.exports = router;
