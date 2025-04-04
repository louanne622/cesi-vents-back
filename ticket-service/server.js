require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/", require("./routes/ticketRoutes"));

// Route de test
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT_SERVICE_TICKET || 3003;
app.listen(PORT, () => {
    console.log(`Ticket service is running on port ${PORT}`);
});
