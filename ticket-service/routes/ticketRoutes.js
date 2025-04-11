const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket');
const QRCode = require('qrcode');
const axios = require('axios');
const { validateEventAvailability, validateTicketAccess, validateQRCode } = require('../middleware/ticketMiddlewares');

// Create a new ticket
router.post('/new', validateEventAvailability, async (req, res) => {
    try {
        const { event_id, user_id, date, status, price } = req.body;

        // Vérifier si l'utilisateur est membre BDE pour appliquer la réduction
        let finalPrice = price;
        try {
            const userResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/${user_id}/gamification`);
            if (userResponse.data.bde_member) {
                const reduction = userResponse.data.reductions.find(r => r.type === 'event');
                if (reduction) {
                    finalPrice = price * (1 - reduction.percentage / 100);
                }
            }
        } catch (error) {
            console.error('Error checking user BDE status:', error);
        }

        // Generate unique QR code
        const qrData = `${event_id}-${user_id}-${Date.now()}`;
        const qrCode = await QRCode.toDataURL(qrData);

        const ticket = new Ticket({
            event_id,
            user_id,
            purchase_date: date,
            status,
            qr_code: qrCode,
            price: finalPrice,
            original_price: price
        });

        await ticket.save();

        // Increase available tickets for the event
        try {
            await axios.put(`${process.env.EVENT_SERVICE_URL}/${event_id}/tickets/increase`);
        } catch (error) {
            console.error('Error increasing event tickets:', error);
        }

        // Add 5 points to the user
        try {
            const token = req.header('x-auth-token');
            await axios.post(
                `${process.env.AUTH_SERVICE_URL}/${user_id}/addPoints`, 
                { points: 5 },
                { headers: { 'x-auth-token': token } }
            );
        } catch (error) {
            console.error('Error updating user points:', error);
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

        res.json({ message: 'Ticket validated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// delete a ticket
router.delete('/:ticketId', validateTicketAccess, async (req, res) => {
    try {
        const ticket = req.ticket; // Le middleware a déjà vérifié et fourni le ticket
        
        // Decrease available tickets for the event
        try {
            await axios.put(`${process.env.EVENT_SERVICE_URL}/${ticket.event_id}/tickets/decrease`);
        } catch (error) {
            console.error('Error decreasing event tickets:', error);
        }

        // Delete the ticket
        await ticket.deleteOne();
        
        res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('Error in delete ticket:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
