const Club = require('../models/Clubs');

module.exports = {
    async isClubExist(req, res, next) {
        try {
            const club = await Club.findById(req.params.id);
            if (!club) {
                return res.status(404).json({ message: "Club non trouvé" });
            }
            next();
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },
    async isClubAdmin(req, res, next) {
        try {
            const club = await Club.findById(req.params.id);
            if (!club) {
                return res.status(404).json({ message: "Club non trouvé" });
            }
            if (!club.admins.includes(req.user.id)) {
                return res.status(403).json({ message: "Vous n'êtes pas administrateur de ce club" });
            }
            next();
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};
