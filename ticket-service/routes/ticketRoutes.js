const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket');
const QRCode = require('qrcode');
const axios = require('axios');
const { validateEventAvailability, validateTicketAccess, validateQRCode } = require('../middleware/ticketMiddlewares');

// Create a new ticket
router.post('/new', validateEventAvailability, async (req, res) => {
    try {
        const { event_id, user_id } = req.body;

        // Generate unique QR code
        const qrData = `${event_id}-${user_id}-${Date.now()}`;
        const qrCode = await QRCode.toDataURL(qrData);

        const ticket = new Ticket({
            event_id,
            user_id,
            qr_code: qrCode
        });

        await ticket.save();

        // Update event available tickets
        try {
            await axios.put(`${process.env.EVENT_SERVICE_URL}/api/events/${event_id}/tickets/decrease`);
        } catch (error) {
            console.error('Error updating event tickets:', error);
            // Continue anyway as the ticket is already created
        }

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all tickets for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const tickets = await Ticket.find({ user_id: req.params.userId });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all tickets for an event
router.get('/event/:eventId', async (req, res) => {
    try {
        const tickets = await Ticket.find({ event_id: req.params.eventId });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Validate a ticket using QR code
router.put('/validate', validateQRCode, async (req, res) => {
    try {
        const ticket = req.ticket; // Le middleware a déjà vérifié et fourni le ticket
        ticket.status = 'used';
        await ticket.save();

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel a ticket
router.put('/:ticketId/cancel', validateTicketAccess, async (req, res) => {
    try {
        const ticket = req.ticket; // Le middleware a déjà vérifié et fourni le ticket
        ticket.status = 'cancelled';
        await ticket.save();

        // Increase available tickets for the event
        try {
            await axios.put(`${process.env.EVENT_SERVICE_URL}/api/events/${ticket.event_id}/tickets/increase`);
        } catch (error) {
            console.error('Error updating event tickets:', error);
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
