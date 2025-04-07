const express = require('express');
const router = express.Router();
const { upload, addExercice, runExercice, getUserExercices } = require('../controllers/exerciceController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/upload', upload.single('file'), addExercice);

router.get('/user/:userId', getUserExercices);

router.post('/run/:exerciceId', runExercice);

module.exports = router;
