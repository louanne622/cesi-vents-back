const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, isAdmin } = require('../middleware/auth');
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

        // Configurer les cookies avec le bon domaine
        res.cookie('cesi_vents_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            path: '/'
        });

        res.cookie('cesi_vents_refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            path: '/'
        });

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

// Route pour uploader une photo de profil
router.post('/upload-profile-picture', auth, upload.single('image'), async (req, res) => {
  try {         
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('Aucun fichier n\'a été reçu');
      return res.status(400).json({ message: 'Aucune image n\'a été uploadée' });
    }

    const user = await User.findById(req.user.id).select('-password_hash');
    console.log('Utilisateur trouvé:', user);

    if (!user) {
      console.error('Utilisateur non trouvé dans la base de données');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'ancienne image si elle existe
    if (user.logo && user.logo.url) {
      const oldPath = path.join('auth-service/uploads/profiles', path.basename(user.logo.url));
      console.log('Tentative de suppression de l\'ancienne image:', oldPath);
      try {
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log('Ancienne image supprimée avec succès');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'ancienne image:', error);
        // Continue with the upload even if old file deletion fails
      }
    }

    // Mettre à jour l'URL de l'image dans la base de données avec le bon chemin complet
    const imageUrl = `http://localhost:5000/api/auth/uploads/profiles/${req.file.filename}`;
    console.log('Nouvelle URL de l\'image:', imageUrl);
    user.logo = {
      url: imageUrl,
      alt: `Photo de profil de ${user.first_name}`
    };
    
    await user.save();
    console.log('Profil utilisateur mis à jour avec succès');

    res.json({
      message: 'Photo de profil mise à jour avec succès',
      logo: user.logo
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de la photo de profil:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la photo de profil" });
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

// Route pour consulter les points et le statut BDE
router.get('/:id/gamification', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Récupérer les goodies disponibles
        const goodies = await require('../models/Goodie').find({ available: true, stock: { $gt: 0 } });

        res.json({
            points: user.points,
            bde_member: user.bde_member,
            reductions: user.bde_member ? [
                { type: 'event', percentage: 20, description: 'Réduction de 20% sur les événements' },
            ] : [],
            available_goodies: goodies.map(g => ({
                id: g._id,
                name: g.name,
                description: g.description,
                points_cost: g.points_cost,
                image_url: g.image_url,
                stock: g.stock,
                can_afford: user.points >= g.points_cost
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

//route pour ajouter des points à l'utilisateur
router.post('/:id/addPoints', auth, async (req, res) => {
    try {
        console.log('Requête reçue pour ajouter des points:', {
            userId: req.params.id,
            points: req.body.points
        });

        const { points } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            console.log('Utilisateur non trouvé:', req.params.id);
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        console.log('Points avant ajout:', user.points);
        // Ajouter les points
        user.points += points;
        await user.save();
        console.log('Points après ajout:', user.points);

        res.json({ 
            message: 'Points ajoutés avec succès',
            points: user.points
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout des points:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout des points' });
    }
});

// Route pour rafraîchir le token
router.post('/refresh-token', async (req, res) => {
    try {
        const refreshToken = req.header('x-refresh-token');
        
        if (!refreshToken) {
            return res.status(401).json({ 
                message: 'Refresh token manquant',
                code: 'REFRESH_TOKEN_MISSING'
            });
        }

        // Vérifier le refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        if (!decoded) {
            return res.status(401).json({ 
                message: 'Refresh token invalide',
                code: 'REFRESH_TOKEN_INVALID'
            });
        }

        // Générer un nouvel access token
        const accessToken = jwt.sign(
            { user: decoded.user },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        // Mettre à jour le cookie du token d'accès
        res.cookie('cesi_vents_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            path: '/'
        });

        res.json({ accessToken });
    } catch (err) {
        console.error('Erreur lors du rafraîchissement du token:', err.message);
        res.status(401).json({ 
            message: 'Session expirée, veuillez vous reconnecter',
            code: 'REFRESH_TOKEN_ERROR'
        });
    }
});

// Route de déconnexion
router.post('/logout', (req, res) => {
    // Supprimer les cookies
    res.clearCookie('cesi_vents_access_token', {
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        path: '/'
    });
    
    res.clearCookie('cesi_vents_refresh_token', {
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        path: '/'
    });

    res.json({ message: 'Déconnexion réussie' });
});

router.get('/getAllUsers', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const users = await User.find().select('-password_hash');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

router.get('/getUserById/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password_hash');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        if (req.user.id !== user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Mettre à jour un utilisateur
router.put('/updateUser/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        if (req.user.id !== user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Mise à jour des champs autorisés
        if (req.body.first_name) user.first_name = req.body.first_name;
        if (req.body.last_name) user.last_name = req.body.last_name;
        if (req.body.phone) user.phone = req.body.phone;
        if (req.body.campus) user.campus = req.body.campus;
        if (req.body.role) user.role = req.body.role;
        if (typeof req.body.bde_member !== 'undefined') user.bde_member = req.body.bde_member;
        if (req.body.points) user.points = req.body.points;
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(req.body.password, salt);
          }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Supprimer un utilisateur (admin seulement)
router.delete('/deleteUser/:id', auth, isAdmin, async (req, res) => {
    const { id } = req.params;

    if (req.user.id == id) {
        return res.status(400).json({ message: "Tu ne peux pas te supprimer toi-même !" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json({ message: 'Utilisateur supprimé avec succès' });
}); 

// Route pour ajouter un utilisateur (admin seulement)
router.post('/addUser', auth, isAdmin, async (req, res) => {
    try {

        const { first_name, last_name, email, password, phone, campus, role, bde_member } = req.body;

        // Validation des champs requis
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            first_name,
            last_name,
            email,
            password_hash: hashedPassword,
            phone,
            campus,
            role,
            bde_member
          });
        await user.save();

        // Ne pas renvoyer le mot de passe hashé
        const userResponse = user.toObject();
        delete userResponse.password_hash;
        
        res.json(userResponse);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour associer un club à un utilisateur
router.put('/assignClub/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' }); 
        }
        user.clubId = req.body.clubId;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
}); 

// route pour supprimer un club d'un utilisateur
router.put('/deleteClub/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });     
        }
        user.clubId = null;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
}); 

// route pour récupérer les membres d'un club
router.get('/getAllClubMembers/:id', async (req, res) => {
    try {
        const users = await User.find({ clubId: req.params.id }).select('-password_hash');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

    

module.exports = router;
