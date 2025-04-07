const jwt = require('jsonwebtoken');

const verifyToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};

module.exports = function(req, res, next) {
    try {
        // Récupérer l'access token du header
        const accessToken = req.header('x-auth-token');
        
        if (!accessToken) {
            return res.status(401).json({ message: 'Access token manquant' });
        }

        // Vérifier l'access token
        const decoded = verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
        
        if (!decoded) {
            // Si l'access token est invalide, vérifier le refresh token
            const refreshToken = req.header('x-refresh-token');
            
            if (!refreshToken) {
                return res.status(401).json({ message: 'Tokens invalides' });
            }

            const refreshDecoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            if (!refreshDecoded) {
                return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter' });
            }

            // Générer un nouvel access token
            const newAccessToken = jwt.sign(
                { user: refreshDecoded.user },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: '15m' }
            );

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
            error: err.message 
        });
    }
};
