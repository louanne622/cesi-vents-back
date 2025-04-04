const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICES = {
    auth: "http://auth-service:3001",
    events: "http://event-service:3002",
    tickets: "http://ticket-service:3003",
    gamification: "http://gamification-service:3004",
    clubs: "http://club-service:3005",
    bde_membership: "http://bde_membership-service:3006",
    promotion: "http://promotion-service:3007",
    transaction: "http://transaction-service:3008"
};

// Middleware pour logger les requêtes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// Route principale pour rediriger vers les services
app.use('/api/:service/*', async (req, res) => {
    const { service } = req.params;
    const targetUrl = SERVICES[service];
    
    if (!targetUrl) {
        return res.status(404).json({ error: "Service not found" });
    }

    // Récupérer le chemin après /api/service/
    const path = req.originalUrl.replace(`/api/${service}`, '');
    const fullUrl = `${targetUrl}${path}`;

    try {
        // Copier les headers de la requête originale
        const headers = {
            ...req.headers,
            'content-type': 'application/json',
        };
        
        // Supprimer l'host header pour éviter les conflits
        delete headers.host;

        const response = await fetch(fullUrl, {
            method: req.method,
            headers: headers,
            body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return res.status(response.status).json(data);
        } else {
            const data = await response.text();
            return res.status(response.status).send(data);
        }
    } catch (error) {
        console.error(`Error forwarding request to ${service}:`, error);
        res.status(500).json({ 
            error: "Internal Server Error",
            message: "Unable to process request"
        });
    }
});

// Route de santé
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
});
