import logger from '../config/logger.js';

export const errorHandler = (err, req, res, _next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 'ERR_VALIDATION',
      message: 'Validation failed',
      details: err.errors
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      code: 'ERR_VALIDATION',
      message: 'Database validation failed',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      code: 'ERR_DUPLICATE',
      message: 'Resource already exists',
      details: err.errors
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      code: 'ERR_UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  if (err.status === 403) {
    return res.status(403).json({
      code: 'ERR_FORBIDDEN',
      message: 'Access denied'
    });
  }

  if (err.status === 404) {
    return res.status(404).json({
      code: 'ERR_NOT_FOUND',
      message: err.message || 'Resource not found'
    });
  }

  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    code: 'ERR_INTERNAL',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};