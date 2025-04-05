// routes/exerciceRoutes.js
const express = require('express');
const router = express.Router();
const exerciceController = require('../controllers/exerciceController');
const auth = require('../middleware/auth');

// Appliquer le middleware d'authentification à toutes les routes
router.use(auth);

// Route pour uploader un exercice
router.post('/upload', exerciceController.upload.single('file'), exerciceController.addExercice);

// Route pour obtenir les exercices de l'utilisateur connecté
// router.get('/user', exerciceController.getUserExercices);

// Route pour exécuter un exercice
router.post('/run/:exerciceId', exerciceController.runExercice);

module.exports = router;
