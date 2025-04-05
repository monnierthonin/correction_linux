// models/exercice.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Exercice = sequelize.define('Exercice', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
    return Exercice;
};
