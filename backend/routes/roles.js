const express = require('express');
const { Role, Permission } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/roles
router.get('/', authenticate, async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{ model: Permission, as: 'permissions' }],
      order: [['name', 'ASC']],
    });
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/roles (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const existing = await Role.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ message: 'Role already exists' });
    }

    const role = await Role.create({ name, description });
    res.status(201).json({ role });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/roles/:id (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const { name, description } = req.body;
    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    await role.save();

    res.json({ role });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/roles/:id (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent deleting built-in roles
    if (['admin', 'manager', 'user'].includes(role.name)) {
      return res.status(400).json({ message: 'Cannot delete built-in roles' });
    }

    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/roles/:id/permissions (admin only) — assign permissions to role
router.post('/:id/permissions', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const { permissionIds } = req.body;
    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({ message: 'permissionIds array is required' });
    }

    const permissions = await Permission.findAll({
      where: { id: permissionIds },
    });

    await role.setPermissions(permissions);

    const updatedRole = await Role.findByPk(req.params.id, {
      include: [{ model: Permission, as: 'permissions' }],
    });

    res.json({ role: updatedRole });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
