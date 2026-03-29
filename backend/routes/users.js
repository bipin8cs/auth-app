const express = require('express');
const { User, Role, Permission } = require('../models');
const { authenticate, requireRole, requirePermission } = require('../middleware/auth');
const { requirePolicy } = require('../middleware/abac');

const router = express.Router();

// GET /api/users — list all users (admin only)
router.get(
  '/',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const users = await User.findAll({
        include: [{ model: Role, as: 'roles' }],
        order: [['createdAt', 'DESC']],
      });
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /api/users/:id
router.get(
  '/:id',
  authenticate,
  async (req, res) => {
    try {
      // Users can view themselves, admins can view anyone
      const userRoles = req.user.roles.map((r) => r.name);
      if (req.params.id !== req.user.id && !userRoles.includes('admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const user = await User.findByPk(req.params.id, {
        include: [
          {
            model: Role,
            as: 'roles',
            include: [{ model: Permission, as: 'permissions' }],
          },
        ],
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PUT /api/users/:id
router.put(
  '/:id',
  authenticate,
  async (req, res) => {
    try {
      const userRoles = req.user.roles.map((r) => r.name);
      if (req.params.id !== req.user.id && !userRoles.includes('admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { firstName, lastName, department, location, isActive } = req.body;

      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (department !== undefined) user.department = department;
      if (location !== undefined) user.location = location;

      // Only admin can change isActive
      if (isActive !== undefined && userRoles.includes('admin')) {
        user.isActive = isActive;
      }

      await user.save();

      // Handle role assignment (admin only)
      if (req.body.roleIds && userRoles.includes('admin')) {
        const roles = await Role.findAll({ where: { id: req.body.roleIds } });
        await user.setRoles(roles);
      }

      const updatedUser = await User.findByPk(req.params.id, {
        include: [{ model: Role, as: 'roles' }],
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// DELETE /api/users/:id (admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
      }

      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

module.exports = router;
