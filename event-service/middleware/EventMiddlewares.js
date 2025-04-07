const axios = require('axios');

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: "Token manquant" });
        }

        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/profil`, {
            headers: {
                'x-auth-token': token
            }
        });
        
        if (!response.data || response.data.role !== 'admin') {
            return res.status(401).json({ message: "Vous n'avez pas accès à cette fonctionnalité" });
        }
        
        next();
    } catch (err) {
        console.error('Erreur de vérification admin:', err);
        res.status(401).json({ message: "Authentification requise" });
    }
};

// Middleware pour vérifier si un événement existe
const eventExists = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }
        req.event = event;
        next();
    } catch (error) {
        console.error('Erreur de validation de l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    isAdmin,
    eventExists
};
