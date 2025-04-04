const Ticket = require('../models/ticket');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Middleware pour vérifier si l'événement existe et a des places disponibles
const validateEventAvailability = async (req, res, next) => {
    try {
        const { event_id } = req.body;

        if (!event_id) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        // Vérifier si l'événement existe et a des places disponibles
        try {
            const eventResponse = await axios.get(`${process.env.EVENT_SERVICE_URL}/${event_id}`);
            const event = eventResponse.data;

            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            if (event.available_tickets <= 0) {
                return res.status(400).json({ message: 'No tickets available for this event' });
            }

            // Ajouter les informations de l'événement à la requête pour utilisation ultérieure
            req.event = event;
            next();
        } catch (error) {
            return res.status(503).json({ message: 'Event service unavailable', error: error.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Middleware pour vérifier si l'utilisateur a le droit d'accéder au ticket
const validateTicketAccess = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Vérifier le token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Récupérer le ticket
        const ticketId = req.params.ticketId;
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du ticket ou un admin
        if (ticket.user_id.toString() !== userId && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Ajouter le ticket à la requête pour utilisation ultérieure
        req.ticket = ticket;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Middleware pour valider le QR code
const validateQRCode = async (req, res, next) => {
    try {
        const { qr_code } = req.body;
        
        if (!qr_code) {
            return res.status(400).json({ message: 'QR code is required' });
        }

        // Vérifier si le ticket avec ce QR code existe
        const ticket = await Ticket.findOne({ qr_code });

        if (!ticket) {
            return res.status(404).json({ message: 'Invalid QR code' });
        }

        if (ticket.status !== 'valid') {
            return res.status(400).json({ message: `Ticket is ${ticket.status}` });
        }

        // Ajouter le ticket à la requête pour utilisation ultérieure
        req.ticket = ticket;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    validateEventAvailability,
    validateTicketAccess,
    validateQRCode
};
