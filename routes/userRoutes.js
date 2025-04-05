// routes/userRoutes.js
const express = require('express');
const { getUserById, updateUser } = require('../controllers/userController');
const router = express.Router();

// Récupérer un utilisateur par ID
router.get('/:id', getUserById);

// Mettre à jour un utilisateur
router.put('/:id', updateUser);

module.exports = router;
