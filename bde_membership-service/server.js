require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

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
app.use("/", require("./routes/bde_membershipRoutes"));

// Route de test
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT_SERVICE_BDE_MEMBERSHIP || 3006;
app.listen(PORT, async () => {
    console.log(`BDE Membership Service is running on port ${PORT}`);
});

module.exports = app;
