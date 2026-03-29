const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Policy = sequelize.define('Policy', {
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
  effect: {
    type: DataTypes.ENUM('allow', 'deny'),
    allowNull: false,
    defaultValue: 'allow',
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  conditions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'ABAC conditions: { userAttributes: {}, resourceAttributes: {}, environment: {} }',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = Policy;
