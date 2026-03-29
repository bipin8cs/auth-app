const express = require('express');
const { Policy } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/policies
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const policies = await Policy.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ policies });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/policies (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, effect, resource, action, conditions, isActive } = req.body;

    if (!name || !resource || !action) {
      return res.status(400).json({ message: 'name, resource, and action are required' });
    }

    const existing = await Policy.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ message: 'Policy already exists' });
    }

    const policy = await Policy.create({
      name,
      description,
      effect: effect || 'allow',
      resource,
      action,
      conditions: conditions || {},
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ policy });
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/policies/:id (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const { name, description, effect, resource, action, conditions, isActive } = req.body;

    if (name !== undefined) policy.name = name;
    if (description !== undefined) policy.description = description;
    if (effect !== undefined) policy.effect = effect;
    if (resource !== undefined) policy.resource = resource;
    if (action !== undefined) policy.action = action;
    if (conditions !== undefined) policy.conditions = conditions;
    if (isActive !== undefined) policy.isActive = isActive;

    await policy.save();
    res.json({ policy });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/policies/:id (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    await policy.destroy();
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
