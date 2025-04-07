require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');
const path = require('path');

// Vérifier que les variables d'environnement sont définies
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined');
    process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connexion à la base de données
connectDB();

// Routes publiques - Enlever le préfixe /api car il est géré par la gateway
app.use("/", require("./routes/authRoutes"));

// Servir les fichiers statiques après les routes
app.use('/api/auth/uploads', express.static(path.join(__dirname, 'uploads'), {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});
