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

//get all transactions
router.get('/', isAuth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//get all amount transactions by month
router.get('/month', isAuth, async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const transactions = await Transaction.aggregate([
            {
                $match: {
                    userId: req.userId,
                    date: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);
        
        res.json({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            totalAmount: transactions.length > 0 ? transactions[0].totalAmount : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//get all amount transactions by year
router.get('/year', isAuth, async (req, res) => {
    try {
        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        
        const endOfYear = new Date();
        endOfYear.setMonth(11, 31);
        endOfYear.setHours(23, 59, 59, 999);

        const transactions = await Transaction.aggregate([
            {
                $match: {
                    userId: req.userId,
                    date: {
                        $gte: startOfYear,
                        $lte: endOfYear
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);
        
        res.json({
            year: new Date().getFullYear(),
            totalAmount: transactions.length > 0 ? transactions[0].totalAmount : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
