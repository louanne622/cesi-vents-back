const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { isAdmin, eventExists } = require('../middleware/EventMiddlewares');
const { Parser } = require('json2csv');

// Créer un nouvel événement (admin seulement)
router.post('/create', isAdmin, async (req, res) => {
    try {       
        if (!req.user || !req.user._id) {
            console.error('Données utilisateur manquantes ou invalides');
            return res.status(500).json({ message: "Erreur d'authentification - données utilisateur invalides" });
        }
        const eventData = {
            ...req.body,
            createdBy: req.user._id.toString() // Conversion explicite en string si c'est un ObjectId
        };        
        const event = new Event(eventData);
        const savedEvent = await event.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Récupérer tous les événements
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Récupérer un événement par son ID
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Événement non trouvé' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Modifier un événement (admin seulement)
router.put('/:id', isAdmin, eventExists, async (req, res) => {
    try {
        if (!req.event.canBeModified() && !req.body.forceUpdate) {
            return res.status(400).json({ 
                message: 'L\'événement ne peut pas être modifié car il a déjà des participants. Utilisez forceUpdate pour forcer la modification.'
            });
        }

        // Si forceUpdate est true et qu'il y a des participants, annuler l'événement
        if (req.body.forceUpdate && req.event.participants.length > 0) {
            await req.event.cancel();
            return res.status(200).json({
                message: 'L\'événement a été annulé car il y avait des participants.',
                event: req.event
            });
        }

        // Vérifier que la date limite d'inscription est valide si elle est fournie
        if (req.body.registrationDeadline && req.body.date) {
            const registrationDate = new Date(req.body.registrationDeadline);
            const eventDate = new Date(req.body.date);
            if (registrationDate > eventDate) {
                return res.status(400).json({
                    message: 'La date limite d\'inscription doit être avant la date de l\'événement'
                });
            }
        }

        // Mettre à jour l'événement (createdBy sera ignoré car immutable)
        Object.assign(req.event, req.body);
        const updatedEvent = await req.event.save();
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Annuler un événement (admin seulement)
router.delete('/:id', isAdmin, eventExists, async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Événement supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Voir la liste des inscrits (admin seulement)
router.get('/:id/participants', isAdmin, eventExists, async (req, res) => {
    try {
        // Format de sortie (JSON par défaut ou CSV si spécifié)
        const format = req.query.format?.toLowerCase();
        const participants = req.event.getParticipantsList();

        if (format === 'csv') {
            const parser = new Parser({
                fields: ['name', 'email', 'pricePaid', 'registrationDate']
            });
            const csv = parser.parse(participants);
            res.header('Content-Type', 'text/csv');
            res.attachment(`participants-event-${req.event.title}.csv`);
            return res.send(csv);
        }

        res.json(participants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir la liste des participants
router.get('/:id/participants/export', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        const fields = ['name', 'email', 'pricePaid', 'registrationDate'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(event.participants);

        res.header('Content-Type', 'text/csv');
        res.attachment(`participants-${event.title}-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Envoyer un message groupé aux participants
router.post('/:id/send-message', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        if (!req.body.message) {
            return res.status(400).json({ message: 'Le message est requis' });
        }

        // Note: Cette partie nécessiterait un service d'envoi d'emails
        // Pour l'instant, on simule l'envoi
        const recipients = event.participants.map(p => p.email);
        
        res.json({ 
            message: 'Message envoyé avec succès',
            recipients: recipients
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Récupérer tous les événements d'un club
router.get('/getAllClubEvents/:id', async (req, res) => {
    try {
        const events = await Event.find({ clubId: req.params.id });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Créer un événement pour un club
router.post('/createClubEvent/:id', async (req, res) => {
    try {
        const event = new Event(req.body);
        event.clubId = req.params.id;
        await event.save();
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}); 

// Modifier un événement pour un club
router.put('/updateClubEvent/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        event.clubId = req.params.id;
        await event.save(); 
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}); 

// Supprimer un événement pour un club
router.delete('/deleteClubEvent/:id', async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Événement supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});










module.exports = router;