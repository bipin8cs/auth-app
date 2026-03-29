const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('create', 'read', 'update', 'delete', 'manage'),
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Permission;
