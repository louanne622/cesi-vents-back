const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICES = {
    auth: "http://localhost:5000",
    events: "http://localhost:5001",
    tickets: "http://localhost:5002",
    gamification: "http://localhost:5003",
    clubs: "http://localhost:5004",
};

app.use("api/:service", async (req, res) => {
    const { service } = req.params;
    const targetUrl = SERVICES[service];
    if (!targetUrl) {
        return res.status(404).json({ error: "Service not found" });
    }

    const endpoint = req.params[0];
    const fullUrl = `${targetUrl}${endpoint}`;

    try {
        const response = await fetch(url, {
            method: req.method,
            body: req.body,
            headers: req.headers,
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Gateway is running on port ${PORT}`);
});
