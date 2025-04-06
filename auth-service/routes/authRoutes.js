const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Route d'inscription
router.post('/register', async (req, res) => {
    try {
        const { email, password, first_name, last_name, role, bde_member, phone, campus } = req.body;

        // Vérifier si l'utilisateur existe déjà
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer le nouvel utilisateur
        user = new User({
            email,
            password_hash: hashedPassword,
            first_name,
            last_name,
            role,
            bde_member,
            phone,
            campus
        });

        await user.save();

        // Créer et retourner le token JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Route de connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Identifiants invalides' });
        }

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides' });
        }

        // Créer et retourner le token JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profil', auth, async (req, res) => {
    try {
        console.log("Recherche de l'utilisateur avec l'ID:", req.user.id);
        
        const user = await User.findById(req.user.id).select('-password_hash');
        if (!user) {
            console.log('Erreur: Utilisateur non trouvé');
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        console.log('Utilisateur trouvé:', user);
        res.json(user);
    } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err.message);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour mettre à jour le profil de l'utilisateur
router.put('/settings', auth, async (req, res) => {
    try {
        const { first_name, last_name, email, phone, campus, role, bde_member } = req.body;

        // Trouver et mettre à jour l'utilisateur
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Mettre à jour les champs
        user.first_name = first_name;
        user.last_name = last_name;
        user.email = email;
        user.phone = phone;
        if (campus) {
            if (!['Lille', 'Paris', 'Arras', 'Rouen'].includes(campus)) {
                return res.status(400).json({ message: 'Campus invalide. Les valeurs possibles sont : Lille, Paris, Arras, Rouen' });
            }
            user.campus = campus;
        }
        if (role) user.role = role;
        if (typeof bde_member !== 'undefined') user.bde_member = bde_member;

        try {
            await user.save();
        } catch (saveError) {
            console.error('Erreur lors de la sauvegarde:', saveError);
            return res.status(400).json({ 
                message: 'Erreur de validation', 
                error: saveError.message 
            });
        }

        // Retourner l'utilisateur mis à jour sans le mot de passe
        const updatedUser = await User.findById(req.user.id).select('-password_hash');
        res.json(updatedUser);
    } catch (err) {
        console.error('Erreur lors de la mise à jour du profil:', err.message);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

//route pour ajouter des points à l'utilisateur
router.post('/:id/addPoints', auth, async (req, res) => {
    try {
        const { points } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        user.points += points;
        await user.save();
        res.json({ message: 'Points ajoutés avec succès' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
