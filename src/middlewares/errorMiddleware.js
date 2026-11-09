const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || (err.code === '23505' ? 409 : 500);
  const message = err.message || 'Erro interno no servidor.';

  logger.error('Erro interceptado no middleware', {
    message,
    statusCode,
    url: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  res.status(statusCode).json({
    success: false,
    error: message
  });
}

module.exports = errorMiddleware;
