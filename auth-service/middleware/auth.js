const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};

const generateAccessToken = (user) => {
    return jwt.sign(
        { user },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );
};

const auth = async function(req, res, next) {
    try {
        // Récupérer l'access token du header
        const accessToken = req.header('x-auth-token');
        const refreshToken = req.header('x-refresh-token');
        
        if (!accessToken) {
            return res.status(401).json({ message: 'Access token manquant' });
        }

        // Vérifier l'access token
        const decoded = verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
        
        if (!decoded) {
            // Si l'access token est invalide, vérifier le refresh token
            if (!refreshToken) {
                return res.status(401).json({ 
                    message: 'Session expirée',
                    code: 'TOKEN_EXPIRED'
                });
            }

            const refreshDecoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            if (!refreshDecoded) {
                return res.status(401).json({ 
                    message: 'Session expirée, veuillez vous reconnecter',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            }

            // Générer un nouvel access token
            const newAccessToken = generateAccessToken(refreshDecoded.user);

            // Envoyer le nouveau token dans le header
            res.setHeader('x-new-token', newAccessToken);
            req.user = refreshDecoded.user;
        } else {
            req.user = decoded.user;
        }

        next();
    } catch (err) {
        console.error("Erreur d'authentification:", err.message);
        res.status(401).json({ 
            message: "Erreur d'authentification", 
            error: err.message,
            code: 'AUTH_ERROR'
        });
    }
};

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé : droits administrateur requis' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    auth,
    isAdmin
};
