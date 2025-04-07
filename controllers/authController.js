const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({ username, password: hashedPassword });
        res.status(201).json({ message: 'Utilisateur créé', user });
    } catch (error) {
        res.status(400).json({ error: 'Erreur de création de l\'utilisateur' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign({ userId: user.id }, 'SECRET_KEY', { expiresIn: '1h' });
    res.status(200).json({ 
        token,
        userId: user.id,
        username: user.username
    });
};

module.exports = { register, login };
