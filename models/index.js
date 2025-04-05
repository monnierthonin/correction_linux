// models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};

// Lire tous les fichiers du répertoire models
fs.readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && 
               (file !== 'index.js') && 
               (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

// Associer les modèles si des associations existent
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Synchroniser la base de données
sequelize.sync()
    .then(() => {
        console.log('Base de données synchronisée');
    })
    .catch(err => {
        console.error('Erreur de synchronisation:', err);
    });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
