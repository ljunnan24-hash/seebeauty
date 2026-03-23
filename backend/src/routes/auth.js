import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, AuthSession } from '../models/index.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';
import logger from '../config/logger.js';

const router = express.Router();

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 'ERR_VALIDATION',
      message: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Register endpoint
router.post('/register',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          code: 'ERR_DUPLICATE',
          message: 'Email already registered'
        });
      }

      const user = await User.create({
        email,
        password_hash: password
      });

      const { accessToken, refreshToken } = generateTokens(user.id);

      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await AuthSession.create({
        user_id: user.id,
        refresh_token_hash: refreshTokenHash,
        user_agent: req.headers['user-agent'],
        ip: req.ip,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      logger.info(`New user registered: ${user.id}`);

      res.status(201).json({
        token: accessToken,
        refreshToken,
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login endpoint
router.post('/login',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user || !user.password_hash) {
        return res.status(401).json({
          code: 'ERR_UNAUTHORIZED',
          message: 'Invalid credentials'
        });
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          code: 'ERR_UNAUTHORIZED',
          message: 'Invalid credentials'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          code: 'ERR_FORBIDDEN',
          message: 'Account deactivated'
        });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);

      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await AuthSession.create({
        user_id: user.id,
        refresh_token_hash: refreshTokenHash,
        user_agent: req.headers['user-agent'],
        ip: req.ip,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      logger.info(`User logged in: ${user.id}`);

      res.json({
        token: accessToken,
        refreshToken,
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token endpoint
router.post('/refresh',
  [
    body('refreshToken').notEmpty()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (error) {
        return res.status(401).json({
          code: 'ERR_UNAUTHORIZED',
          message: 'Invalid refresh token'
        });
      }

      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const session = await AuthSession.findOne({
        where: {
          user_id: decoded.userId,
          refresh_token_hash: refreshTokenHash
        }
      });

      if (!session || session.expires_at < new Date()) {
        return res.status(401).json({
          code: 'ERR_UNAUTHORIZED',
          message: 'Refresh token expired or invalid'
        });
      }

      const user = await User.findByPk(decoded.userId);
      if (!user || !user.is_active) {
        return res.status(403).json({
          code: 'ERR_FORBIDDEN',
          message: 'Account not found or deactivated'
        });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

      const newRefreshTokenHash = crypto
        .createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

      await session.update({
        refresh_token_hash: newRefreshTokenHash,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      res.json({
        token: accessToken,
        refreshToken: newRefreshToken,
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout endpoint
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(200).json({ message: 'Logged out' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await AuthSession.destroy({
        where: { user_id: decoded.userId }
      });
      logger.info(`User logged out: ${decoded.userId}`);
    } catch (error) {
      // Token invalid, but still return success
    }

    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
});

export default router;