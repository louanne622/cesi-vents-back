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
app.use("/", require("./routes/clubRoutes"));

const PORT = process.env.PORT_SERVICE_CLUB || 3002;
app.listen(PORT, async () => {
    console.log(`Club Service is running on port ${PORT}`);
});
