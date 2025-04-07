const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    try {
        console.log('Headers reçus dans auth middleware:', req.headers);
        
        // Récupérer le token du header
        const token = req.header('x-auth-token');
        console.log('Token reçu dans auth middleware:', token);

        // Vérifier si pas de token
        if (!token) {
            console.log('Erreur: Pas de token dans les headers');
            return res.status(401).json({ message: 'Pas de token, autorisation refusée' });
        }

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token décodé:', decoded);
        
        // Vérifier si l'utilisateur existe
        if (!decoded.user || !decoded.user.id) {
            console.log('Erreur: Données utilisateur manquantes dans le token');
            return res.status(401).json({ message: 'Données utilisateur invalides' });
        }

        req.user = decoded.user;
        next();
    } catch (err) {
        console.error("Erreur d'authentification:", err.message);
        res.status(401).json({ 
            message: "Token non valide", 
            error: err.message 
        });
    }
};
