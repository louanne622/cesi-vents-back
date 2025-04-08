const axios = require('axios');

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = async (req, res, next) => {
    try {
        let token = req.header('x-auth-token');
        const refreshToken = req.header('x-refresh-token');

        if (!token) {
            return res.status(401).json({ message: "Token manquant" });
        }
        try {
            const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/profil`, {
                headers: {
                    'x-auth-token': token
                }
            });
            
            if (!response.data || response.data.role !== 'admin') {
                return res.status(401).json({ message: "Vous n'avez pas accès à cette fonctionnalité" });
            }
            
            // S'assurer que nous avons l'ID utilisateur
            if (!response.data._id) {
                console.error('ID utilisateur manquant dans la réponse');
                return res.status(500).json({ message: "Erreur d'authentification" });
            }

            // Stocker les informations utilisateur dans req.user
            req.user = {
                _id: response.data._id,
                role: response.data.role
            };
            next();
        } catch (error) {
            console.log('Erreur lors de la vérification:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
            // Si le token est expiré et qu'un refresh token est disponible
            if (error.response && error.response.status === 401 && refreshToken) {
                try {
                    // Tenter de rafraîchir le token
                    const refreshResponse = await axios.post(`${process.env.AUTH_SERVICE_URL}/refresh-token`, {}, {
                        headers: {
                            'x-refresh-token': refreshToken
                        }
                    });

                    // Réessayer avec le nouveau token
                    const newResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/profil`, {
                        headers: {
                            'x-auth-token': refreshResponse.data.accessToken
                        }
                    });

                    if (!newResponse.data || newResponse.data.role !== 'admin') {
                        return res.status(401).json({ message: "Vous n'avez pas accès à cette fonctionnalité" });
                    }

                    // S'assurer que nous avons l'ID de l'utilisateur
                    if (!newResponse.data._id) {
                        console.error('ID utilisateur manquant dans la réponse après refresh');
                        return res.status(500).json({ message: "Erreur d'authentification" });
                    }

                    // Mettre à jour le token dans la réponse
                    res.set('x-auth-token', refreshResponse.data.accessToken);
                    
                    // Stocker les informations utilisateur dans req.user
                    req.user = {
                        _id: newResponse.data._id,
                        role: newResponse.data.role
                    };

                    next();
                } catch (refreshError) {
                    console.error('Erreur lors du rafraîchissement du token:', refreshError);
                    return res.status(401).json({ 
                        message: "Session expirée, veuillez vous reconnecter",
                        code: 'SESSION_EXPIRED'
                    });
                }
            } else {
                console.error('Erreur de vérification admin:', error);
                return res.status(401).json({ message: "Authentification requise" });
            }
        }
    } catch (err) {
        console.error('Erreur de vérification admin:', err);
        res.status(500).json({ message: "Erreur serveur" });
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
