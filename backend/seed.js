const { sequelize, User, Role, Permission, Policy } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Create roles
    const adminRole = await Role.create({ name: 'admin', description: 'Full system access' });
    const managerRole = await Role.create({ name: 'manager', description: 'Can manage users and content' });
    const userRole = await Role.create({ name: 'user', description: 'Basic user access' });
    console.log('Roles created');

    // Create permissions
    const permissions = await Permission.bulkCreate([
      { name: 'users:read', description: 'View users', resource: 'users', action: 'read' },
      { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
      { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
      { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'users:manage', description: 'Full user management', resource: 'users', action: 'manage' },
      { name: 'roles:read', description: 'View roles', resource: 'roles', action: 'read' },
      { name: 'roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
      { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
      { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'roles:manage', description: 'Full role management', resource: 'roles', action: 'manage' },
      { name: 'policies:read', description: 'View policies', resource: 'policies', action: 'read' },
      { name: 'policies:create', description: 'Create policies', resource: 'policies', action: 'create' },
      { name: 'policies:update', description: 'Update policies', resource: 'policies', action: 'update' },
      { name: 'policies:delete', description: 'Delete policies', resource: 'policies', action: 'delete' },
      { name: 'policies:manage', description: 'Full policy management', resource: 'policies', action: 'manage' },
    ]);
    console.log('Permissions created');

    // Assign all permissions to admin
    await adminRole.setPermissions(permissions);

    // Assign user/role read + user update to manager
    const managerPerms = permissions.filter(
      (p) =>
        (p.resource === 'users' && ['read', 'update'].includes(p.action)) ||
        (p.resource === 'roles' && p.action === 'read')
    );
    await managerRole.setPermissions(managerPerms);

    // Assign basic read to user role
    const userPerms = permissions.filter(
      (p) => p.resource === 'users' && p.action === 'read'
    );
    await userRole.setPermissions(userPerms);
    console.log('Permissions assigned to roles');

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      department: 'Engineering',
      location: 'US',
      provider: 'local',
    });
    await adminUser.addRole(adminRole);

    // Create manager user
    const managerUser = await User.create({
      email: 'manager@example.com',
      password: 'manager123',
      firstName: 'Manager',
      lastName: 'User',
      department: 'Operations',
      location: 'UK',
      provider: 'local',
    });
    await managerUser.addRole(managerRole);

    // Create regular user
    const regularUser = await User.create({
      email: 'user@example.com',
      password: 'user123',
      firstName: 'Regular',
      lastName: 'User',
      department: 'Marketing',
      location: 'US',
      provider: 'local',
    });
    await regularUser.addRole(userRole);
    console.log('Users created');

    // Create ABAC policies
    await Policy.bulkCreate([
      {
        name: 'US users can read users',
        description: 'Allow users from US location to read user data',
        effect: 'allow',
        resource: 'users',
        action: 'read',
        conditions: {
          'user.location': 'US',
        },
      },
      {
        name: 'Business hours access',
        description: 'Allow access only during business hours (9-17)',
        effect: 'allow',
        resource: 'users',
        action: 'update',
        conditions: {
          'environment.hour': { $gte: 9, $lte: 17 },
        },
      },
      {
        name: 'Engineering department full access',
        description: 'Engineering department members have full access to user resources',
        effect: 'allow',
        resource: 'users',
        action: 'manage',
        conditions: {
          'user.department': 'Engineering',
        },
      },
      {
        name: 'Deny inactive users',
        description: 'Deny all actions for inactive users',
        effect: 'deny',
        resource: '*',
        action: '*',
        conditions: {
          'user.isActive': false,
        },
      },
    ]);
    console.log('ABAC policies created');

    console.log('\n--- Seed Complete ---');
    console.log('Admin:   admin@example.com / admin123');
    console.log('Manager: manager@example.com / manager123');
    console.log('User:    user@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
