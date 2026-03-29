const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const { User, Role } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        provider: 'local',
      });

      // Assign default 'user' role
      const defaultRole = await Role.findOne({ where: { name: 'user' } });
      if (defaultRole) {
        await user.addRole(defaultRole);
      }

      const { accessToken, refreshToken } = generateTokens(user.id);
      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON(),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email },
        include: [{ model: Role, as: 'roles', include: [{ model: require('../models/Permission'), as: 'permissions' }] }],
      });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      {
        model: Role,
        as: 'roles',
        include: [{ model: require('../models/Permission'), as: 'permissions' }],
      },
    ],
  });
  res.json({ user: user.toJSON() });
});

// Google OAuth 2.0 / OpenID Connect
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'openid'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  async (req, res) => {
    const { accessToken, refreshToken } = generateTokens(req.user.id);
    req.user.refreshToken = refreshToken;
    await req.user.save();

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
);

module.exports = router;
