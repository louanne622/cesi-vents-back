const BdeMembership = require('../models/bde_membership');

// Middleware to validate BDE membership data
const validateBdeMembership = async (req, res, next) => {
    try {
        const { user_id, membership_start, membership_end, pourcentage_reduction } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!membership_start || !membership_end) {
            return res.status(400).json({ error: 'Membership dates are required' });
        }

        if (pourcentage_reduction < 0 || pourcentage_reduction > 100) {
            return res.status(400).json({ error: 'Pourcentage reduction must be between 0 and 100' });
        }

        if (new Date(membership_start) >= new Date(membership_end)) {
            return res.status(400).json({ error: 'Membership end date must be after start date' });
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to check if user is currently a BDE member
const checkBdeMembership = async (req, res, next) => {
    try {
        const { user_id } = req.params || req.body;
        
        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const currentMembership = await BdeMembership.findOne({
            user_id,
            membership_start: { $lte: new Date() },
            membership_end: { $gte: new Date() }
        });

        req.isBdeMember = !!currentMembership;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    validateBdeMembership,
    checkBdeMembership
};
