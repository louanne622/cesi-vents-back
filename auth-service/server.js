require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { auth, isAdmin } = require('./middleware/auth');
const path = require('path');

// Vérifier que les variables d'environnement sont définies
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error('JWT secrets are not defined');
    process.exit(1);
}

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-refresh-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Connexion à la base de données
connectDB();

// Routes publiques - Enlever le préfixe /api car il est géré par la gateway
app.use("/", require("./routes/authRoutes"));
app.use("/goodies", require("./routes/goodieRoutes"));

// Servir les fichiers statiques après les routes
app.use('/api/auth/uploads', express.static('/auth-service/uploads', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.set('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.set('Content-Type', 'image/png');
        }
    }
}));
console.log('Serving static files from:', '/auth-service/uploads');

// Test de la connexion
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

const PORT = process.env.AUTH_SERVICE_PORT || 5001;
app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});

module.exports = app;
