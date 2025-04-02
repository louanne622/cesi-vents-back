require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');

// Vérifier que les variables d'environnement sont définies
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined');
    process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

// Connexion à la base de données
connectDB();

// Routes publiques
app.use("/api/auth", require("./routes/authRoutes"));

// Test de la connexion
app.get('/api/test', auth, (req, res) => {
    res.json({ message: 'Route protégée accessible' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
