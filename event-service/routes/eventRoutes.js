const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { Parser } = require('json2csv');

// Créer un nouvel événement
router.post('/create', async (req, res) => {
    try {
        const event = new Event(req.body);
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
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Modifier un événement
router.put('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        // Vérifier si l'événement peut être modifié
        if (!event.canBeModified() && !req.body.forceUpdate) {
            return res.status(400).json({ 
                message: 'L\'événement ne peut pas être modifié car il a déjà des participants',
                canForceUpdate: true
            });
        }

        // Si forceUpdate est true et status est 'cancelled', annuler toutes les réservations
        if (req.body.forceUpdate && req.body.status === 'cancelled') {
            event.participants = [];
            event.currentCapacity = 0;
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Annuler un événement
router.post('/:id/cancel', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        event.status = 'cancelled';
        event.participants = [];
        event.currentCapacity = 0;
        await event.save();

        res.json({ message: 'Événement annulé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir la liste des participants
router.get('/:id/participants', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }
        res.json(event.participants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Exporter la liste des participants en CSV
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

module.exports = router;