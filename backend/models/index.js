const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const Policy = require('./Policy');

// Many-to-Many: User <-> Role
const UserRole = sequelize.define('UserRole', {}, { timestamps: true });
User.belongsToMany(Role, { through: UserRole, as: 'roles' });
Role.belongsToMany(User, { through: UserRole, as: 'users' });

// Many-to-Many: Role <-> Permission
const RolePermission = sequelize.define('RolePermission', {}, { timestamps: true });
Role.belongsToMany(Permission, { through: RolePermission, as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, as: 'roles' });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  Policy,
  UserRole,
  RolePermission,
};
