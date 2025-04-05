// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const exerciceRoutes = require('./routes/exerciceRoutes');
const sequelize = require('./config/db');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ message: 'Le serveur fonctionne correctement!' });
});

// Routes principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/auth', authRoutes);
app.use('/exercices', exerciceRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Une erreur est survenue!' });
});

// Synchronisation de la base de données sans force: true pour préserver les données
sequelize.sync()
    .then(() => {
        console.log('Base de données synchronisée');
        app.listen(3000, () => {
            console.log('Serveur backend démarré sur http://localhost:3000');
        });
    })
    .catch((error) => {
        console.error('Erreur:', error);
    });
