const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Générer les tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { user: { id: user.id, role: user.role } },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '6h' }  
    );

    const refreshToken = jwt.sign(
        { user: { id: user.id, role: user.role } },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// Route d'inscription
router.post('/register', async (req, res) => {
    try {
        const { email, password, first_name, last_name, role, bde_member, phone, campus } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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

        const { accessToken, refreshToken } = generateTokens(user);

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                bde_member: user.bde_member
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route de connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Identifiants invalides' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides' });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                bde_member: user.bde_member
            }
        });
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
            console.log("Erreur: Utilisateur non trouvé");
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        console.log("Utilisateur trouvé:", user);
        res.json(user);
    } catch (err) {
        console.error("Erreur lors de la récupération du profil:", err.message);
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
            console.error("Erreur lors de la sauvegarde:", saveError);
            return res.status(400).json({ 
                message: 'Erreur de validation', 
                error: saveError.message 
            });
        }

        // Retourner l'utilisateur mis à jour sans le mot de passe
        const updatedUser = await User.findById(req.user.id).select('-password_hash');
        res.json(updatedUser);
    } catch (err) {
        console.error("Erreur lors de la mise à jour du profil:", err.message);
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
