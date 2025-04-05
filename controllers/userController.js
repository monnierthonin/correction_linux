// controllers/userController.js
const { User } = require('../models');

// Récupérer un utilisateur par ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
    }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Mettre à jour les données de l'utilisateur
        await user.update(req.body);
        res.status(200).json({ message: 'Utilisateur mis à jour' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
};

module.exports = { getUserById, updateUser };
