// config/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('algo_correction', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;
