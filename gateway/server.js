const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICES = {
    auth: "http://localhost:3001",
    events: "http://localhost:3002",
    tickets: "http://localhost:3003",
    gamification: "http://localhost:3004",
    clubs: "http://localhost:3005",
    bde_membership: "http://localhost:3006"
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Gateway is running on port ${PORT}`);
});
