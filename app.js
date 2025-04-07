const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const exerciceRoutes = require('./routes/exerciceRoutes');
const sequelize = require('./config/db');
const path = require('path');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/auth', authRoutes);
app.use('/exercices', exerciceRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Une erreur est survenue!' });
});
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
