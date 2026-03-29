const express = require('express');
const { Permission } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/permissions
router.get('/', authenticate, async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['resource', 'ASC'], ['action', 'ASC']],
    });
    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/permissions (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, resource, action } = req.body;

    if (!name || !resource || !action) {
      return res.status(400).json({ message: 'name, resource, and action are required' });
    }

    const existing = await Permission.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ message: 'Permission already exists' });
    }

    const permission = await Permission.create({ name, description, resource, action });
    res.status(201).json({ permission });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/permissions/:id (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    await permission.destroy();
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
