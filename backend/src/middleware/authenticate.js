import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Simple in-memory user cache to reduce repetitive DB hits during rapid polling (e.g., task status requests)
// Controlled by AUTH_USER_CACHE_TTL_MS (default 10000 ms). Set to 0 to disable.
const userCache = new Map(); // key: userId -> { user, expiresAt }
const TTL = parseInt(process.env.AUTH_USER_CACHE_TTL_MS || '10000', 10);

async function fetchUserCached(userId) {
  if (TTL > 0) {
    const cached = userCache.get(userId);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }
    const user = await User.findByPk(userId);
    if (user) {
      userCache.set(userId, { user, expiresAt: now + TTL });
    }
    return user;
  }
  return User.findByPk(userId);
}

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        code: 'ERR_UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        code: 'ERR_UNAUTHORIZED',
        message: 'Invalid token format'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          code: 'ERR_TOKEN_EXPIRED',
          message: 'Token expired'
        });
      }
      return res.status(401).json({
        code: 'ERR_UNAUTHORIZED',
        message: 'Invalid token'
      });
    }

    if (decoded.type !== 'access') {
      return res.status(401).json({
        code: 'ERR_UNAUTHORIZED',
        message: 'Invalid token type'
      });
    }

  const user = await fetchUserCached(decoded.userId);

    if (!user) {
      return res.status(401).json({
        code: 'ERR_UNAUTHORIZED',
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        code: 'ERR_FORBIDDEN',
        message: 'Account deactivated'
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type === 'access') {
  const user = await fetchUserCached(decoded.userId);
        if (user && user.is_active) {
          req.user = user;
          req.userId = user.id;
        }
      }
    } catch (error) {
      // Invalid token, continue without authentication
    }

    next();
  } catch (error) {
    next(error);
  }
};