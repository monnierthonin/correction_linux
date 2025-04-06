// routes/exerciceRoutes.js
const express = require('express');
const router = express.Router();
const { upload, addExercice, runExercice, getUserExercices } = require('../controllers/exerciceController');
const auth = require('../middleware/auth');

// Appliquer le middleware d'authentification à toutes les routes
router.use(auth);

// Route pour uploader un exercice
router.post('/upload', upload.single('file'), addExercice);

// Route pour obtenir les exercices de l'utilisateur connecté
router.get('/user/:userId', getUserExercices);

// Route pour exécuter un exercice
router.post('/run/:exerciceId', runExercice);

module.exports = router;
