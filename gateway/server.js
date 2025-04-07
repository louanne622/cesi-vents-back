const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-refresh-token']
};

app.use(cors(corsOptions));
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
        return res.status(404).json({ message: 'Service not found' });
    }

    const path = req.originalUrl.replace(`/api/${service}`, '');
    const fullUrl = `${targetUrl}${path}`;

    console.log(`Redirection de la requête vers: ${fullUrl}`);

    try {
        // Log tous les headers reçus
        console.log('Headers reçus dans la gateway:', req.headers);
        
        // Gérer les requêtes multipart/form-data
        if (req.headers['content-type']?.includes('multipart/form-data')) {
            console.log('Détection d\'une requête multipart/form-data');
            upload.single('image')(req, res, async (err) => {
                if (err) {
                    console.error('Erreur upload:', err);
                    return res.status(400).json({ error: 'File upload error' });
                }

                const token = req.headers['x-auth-token'];
                console.log('Token reçu dans la gateway:', token);
                
                if (!token) {
                    console.error('No token provided');
                    return res.status(401).json({ message: 'Pas de token, autorisation refusée' });
                }

                const formData = new FormData();
                if (req.file) {
                    console.log('Fichier reçu:', req.file);
                    formData.append('image', fs.createReadStream(req.file.path), {
                        filename: req.file.originalname,
                        contentType: req.file.mimetype
                    });
                }

                const formDataHeaders = formData.getHeaders();
                formDataHeaders['x-auth-token'] = token;

                console.log('Envoi de la requête à:', fullUrl);
                console.log('Headers envoyés:', formDataHeaders);

                const response = await fetch(fullUrl, {
                    method: req.method,
                    headers: formDataHeaders,
                    body: formData
                });

                // Nettoyer le fichier temporaire
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const data = await response.json();
                    console.log('Réponse reçue:', data);
                    return res.status(response.status).json(data);
                } else {
                    const data = await response.text();
                    console.log('Réponse reçue (non JSON):', data);
                    return res.status(response.status).send(data);
                }
            });
            return;
        }

        // Pour les autres types de requêtes
        const headers = {
            ...req.headers,
            'content-type': 'application/json',
        };
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

// Route pour servir les fichiers statiques
app.use('/api/auth/uploads', async (req, res) => {
    const targetUrl = SERVICES.auth + '/api/auth/uploads' + req.path;
    console.log('Forwarding static file request to:', targetUrl);
    
    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            console.error('File not found:', response.status, response.statusText);
            return res.status(response.status).send('File not found');
        }
        
        const contentType = response.headers.get('content-type');
        console.log('Content-Type reçu:', contentType);
        res.set('Content-Type', contentType);
        response.body.pipe(res);
    } catch (error) {
        console.error('Error serving static file:', error);
        res.status(500).send('Error serving file');
    }
});

// Route pour gérer les uploads
app.post('/api/auth/upload-profile-picture', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const formDataHeaders = formData.getHeaders();
        formDataHeaders['x-auth-token'] = token;

        const response = await fetch(SERVICES.auth + '/upload-profile-picture', {
            method: 'POST',
            headers: formDataHeaders,
            body: formData
        });

        // Nettoyer le fichier temporaire
        fs.unlinkSync(req.file.path);

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file' });
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
