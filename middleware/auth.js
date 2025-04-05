const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'SECRET_KEY');
        req.userData = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Authentification requise'
        });
    }
};

module.exports = auth;
