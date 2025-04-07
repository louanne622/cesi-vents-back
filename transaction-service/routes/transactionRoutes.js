const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { isAdmin, isAuth } = require('../middleware/transactionMiddleware');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

// Obtenir le panier actif (transaction en mode draft)
router.get('/cart', isAuth, async (req, res) => {
    try {
        let transaction = await Transaction.findOne({ 
            userId: req.user.id,
            status: 'draft'
        });

        if (!transaction) {
            transaction = new Transaction({ userId: req.user.id });
            await transaction.save();
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Ajouter un événement au panier
router.post('/cart/add-item', isAuth, async (req, res) => {
    try {
        const { eventId, quantity } = req.body;

        // Vérifier la disponibilité de l'événement
        const eventResponse = await axios.get(`${process.env.EVENT_SERVICE_URL}/api/events/${eventId}`);
        const event = eventResponse.data;

        if (event.status !== 'published') {
            return res.status(400).json({ message: "Cet événement n'est pas disponible à la réservation" });
        }

        if (!event.isRegistrationOpen()) {
            return res.status(400).json({ message: "Les inscriptions pour cet événement sont fermées" });
        }

        // Vérifier la capacité disponible
        if (event.participants.length + quantity > event.maxCapacity) {
            return res.status(400).json({ message: "Nombre de places insuffisant" });
        }

        let transaction = await Transaction.findOne({ 
            userId: req.user.id,
            status: 'draft'
        });

        if (!transaction) {
            transaction = new Transaction({ userId: req.user.id });
        }

        // Vérifier si l'événement est déjà dans le panier
        const existingItem = transaction.items.find(item => item.eventId.toString() === eventId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            transaction.items.push({
                eventId,
                quantity,
                price: event.price,
                eventDetails: {
                    title: event.title,
                    date: event.date,
                    time: event.time,
                    location: event.location
                }
            });
        }

        transaction.calculateTotal();
        await transaction.save();
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour la quantité d'un item
router.put('/cart/update-quantity', isAuth, async (req, res) => {
    try {
        const { eventId, quantity } = req.body;
        
        const transaction = await Transaction.findOne({ 
            userId: req.user.id,
            status: 'draft'
        });

        if (!transaction) {
            return res.status(404).json({ message: "Panier non trouvé" });
        }

        const item = transaction.items.find(item => item.eventId.toString() === eventId);
        if (!item) {
            return res.status(404).json({ message: "Article non trouvé dans le panier" });
        }

        // Vérifier la disponibilité
        const eventResponse = await axios.get(`${process.env.EVENT_SERVICE_URL}/api/events/${eventId}`);
        const event = eventResponse.data;

        if (event.participants.length + quantity > event.maxCapacity) {
            return res.status(400).json({ message: "Nombre de places insuffisant" });
        }

        item.quantity = quantity;
        transaction.calculateTotal();
        await transaction.save();
        
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Supprimer un item du panier
router.delete('/cart/remove-item/:eventId', isAuth, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ 
            userId: req.user.id,
            status: 'draft'
        });

        if (!transaction) {
            return res.status(404).json({ message: "Panier non trouvé" });
        }

        transaction.items = transaction.items.filter(item => item.eventId.toString() !== req.params.eventId);
        transaction.calculateTotal();
        await transaction.save();
        
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Appliquer un code promo
router.post('/cart/apply-promo', isAuth, async (req, res) => {
    try {
        const { promotion_code } = req.body;
        
        // Vérifier le code promo
        const promoResponse = await axios.get(`${process.env.PROMOTION_SERVICE_URL}/api/promotions/code/${promotion_code}`);
        const promotion = promoResponse.data;

        if (!promotion || !promotion.activate || new Date() > new Date(promotion.validation_date)) {
            return res.status(400).json({ message: "Code promotion invalide ou expiré" });
        }

        const transaction = await Transaction.findOne({ 
            userId: req.user.id,
            status: 'draft'
        });

        if (!transaction) {
            return res.status(404).json({ message: "Panier non trouvé" });
        }

        // Vérifier si le club associé à la promotion correspond à l'événement
        const eventId = transaction.items[0]?.eventId;
        if (eventId) {
            const eventResponse = await axios.get(`${process.env.EVENT_SERVICE_URL}/api/events/${eventId}`);
            const event = eventResponse.data;
            
            if (event.clubId && event.clubId.toString() !== promotion.id_club.toString()) {
                return res.status(400).json({ message: "Ce code promotion n'est pas valide pour cet événement" });
            }
        }

        transaction.promoCode = {
            code: promotion_code,
            discount: 0.1 // 10% de réduction par défaut
        };

        transaction.calculateTotal();
        await transaction.save();
        
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Procéder au paiement
router.post('/cart/checkout', isAuth, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ 
            userId: req.user.id,
            status: 'draft'
        });

        if (!transaction || transaction.items.length === 0) {
            return res.status(400).json({ message: "Panier vide ou non trouvé" });
        }

        // Mettre à jour le statut et la méthode de paiement
        transaction.status = 'completed';
        transaction.paymentMethod = req.body.paymentMethod || 'card';
        await transaction.save();

        // Pour chaque événement dans le panier
        for (const item of transaction.items) {
            // Ajouter le participant à l'événement
            await axios.post(
                `${process.env.EVENT_SERVICE_URL}/api/events/${item.eventId}/participants`,
                {
                    userId: req.user.id,
                    quantity: item.quantity,
                    transactionId: transaction._id
                },
                { headers: { 'x-auth-token': req.header('x-auth-token') } }
            );

            // Générer et envoyer le e-ticket
            await generateAndSendETicket(req.user, item, transaction._id);
        }

        res.json({ 
            message: "Commande confirmée",
            transaction
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir toutes les transactions (admin seulement)
router.get('/admin/all', isAdmin, async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Obtenir les transactions d'un utilisateur
router.get('/my-transactions', isAuth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ 
            userId: req.user.id,
            status: { $ne: 'draft' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fonction pour générer et envoyer le e-ticket
async function generateAndSendETicket(user, transactionItem, transactionId) {
    // Générer le QR Code
    const qrCodeData = await QRCode.toDataURL(JSON.stringify({
        eventId: transactionItem.eventId,
        userId: user.id,
        transactionId: transactionId,
        quantity: transactionItem.quantity,
        timestamp: Date.now()
    }));

    // Créer le PDF
    const doc = new PDFDocument();
    const pdfBuffer = await new Promise((resolve) => {
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        doc.image(qrCodeData, 100, 100);
        doc.fontSize(25).text('E-Ticket pour ' + transactionItem.eventDetails.title, 100, 50);
        doc.fontSize(15).text(`Date: ${new Date(transactionItem.eventDetails.date).toLocaleDateString()}`, 100, 200);
        doc.fontSize(15).text(`Heure: ${transactionItem.eventDetails.time}`, 100, 220);
        doc.fontSize(15).text(`Lieu: ${transactionItem.eventDetails.location}`, 100, 240);
        doc.fontSize(15).text(`Quantité: ${transactionItem.quantity}`, 100, 260);
        doc.fontSize(12).text(`Transaction ID: ${transactionId}`, 100, 280);
        doc.end();
    });

    // Configurer l'envoi d'email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Envoyer l'email
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Votre e-ticket pour ${transactionItem.eventDetails.title}`,
        text: `Merci pour votre réservation à ${transactionItem.eventDetails.title}. Votre numéro de transaction est : ${transactionId}`,
        attachments: [{
            filename: 'e-ticket.pdf',
            content: pdfBuffer
        }]
    });
}

module.exports = router;
