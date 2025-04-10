const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { isAdmin, isAuth } = require('../middleware/transactionMiddleware');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

//create transaction
router.post('/create', isAuth, async (req, res) => {
    try {
        const { userId, totalAmount, promoCode, date } = req.body;
        const transaction = new Transaction({
            userId,
            totalAmount,
            promoCode,
            date
        });
        await transaction.save();
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//get all amount transactions by month
router.get('/month', isAuth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId, date: { $gte: new Date().setDate(1), $lt: new Date().setDate(1) } }).select('totalAmount');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//get all amount transactions by years
router.get('/year', isAuth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId, date: { $gte: new Date().setFullYear(new Date().getFullYear()) } }).select('totalAmount');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
