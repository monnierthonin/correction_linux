const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Solution = sequelize.define('Solution', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_path: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'Solutions',
        timestamps: true
    });
    return Solution;
};
