require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à la base de données
connectDB();

// Routes
app.use('/', require('./routes/promotionRoutes'));

// Route de santé
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
    console.log(`Promotion service running on port ${PORT}`);
});
