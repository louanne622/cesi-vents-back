require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

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
app.use("/api/bde_membership", require("./routes/bde_membershipRoutes"));

const PORT = process.env.PORT_SERVICE_BDE_MEMBERSHIP || 3006;
app.listen(PORT, async () => {
    console.log(`BDE Membership Service is running on port ${PORT}`);
});
