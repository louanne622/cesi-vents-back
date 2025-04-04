const Club = require('../models/Clubs');
const axios = require('axios');

// Middleware pour valider les données du club
const validateClub = async (req, res, next) => {
    try {
        const { name, description, logo, email } = req.body;

        if (!name || !description || !logo || !email) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        if (!logo.url || !logo.alt) {
            return res.status(400).json({ message: 'Le logo doit avoir une URL et un texte alternatif' });
        }

        // Vérifier si le nom du club existe déjà
        const existingClub = await Club.findOne({ name });
        if (existingClub) {
            return res.status(400).json({ message: 'Un club avec ce nom existe déjà' });
        }

        // Vérifier le format de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Format d\'email invalide' });
        }

        next();
    } catch (error) {
        console.error('Erreur de validation du club:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = async (req, res, next) => {
    try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profil`, {
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

// Middleware pour vérifier si un club existe
const clubExists = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club non trouvé' });
        }
        req.club = club;
        next();
    } catch (err) {
        console.error('Erreur de recherche de club:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Middleware pour vérifier si l'utilisateur est membre du club
const isMemberOfClub = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club non trouvé' });
        }

        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profil`, {
            headers: {
                'x-auth-token': req.header('x-auth-token')
            }
        });

        // Vérifier si l'utilisateur est admin ou membre du club
        if (response.data.role === 'admin' || club.admins.includes(response.data.id)) {
            req.club = club;
            next();
        } else {
            // Vérifier avec le service BDE si l'utilisateur est membre
            try {
                await axios.get(`${process.env.BDE_MEMBERSHIP_SERVICE_URL}/api/membership/verify/${response.data.id}/${club._id}`);
                req.club = club;
                next();
            } catch (err) {
                return res.status(403).json({ message: "Vous n'êtes pas membre de ce club" });
            }
        }
    } catch (err) {
        console.error('Erreur de vérification de membre:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Middleware pour vérifier si l'utilisateur est admin du club
const isClubAdmin = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club non trouvé' });
        }

        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profil`, {
            headers: {
                'x-auth-token': req.header('x-auth-token')
            }
        });

        // Vérifier si l'utilisateur est admin du site ou admin du club
        if (response.data.role === 'admin' || club.admins.includes(response.data.id)) {
            req.club = club;
            next();
        } else {
            return res.status(403).json({ message: "Vous n'êtes pas administrateur de ce club" });
        }
    } catch (err) {
        console.error('Erreur de vérification admin du club:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    validateClub,
    isAdmin,
    clubExists,
    isMemberOfClub,
    isClubAdmin
};
