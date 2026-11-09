const authService = require('../services/authService');
const logger = require('../config/logger');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Acesso negado. Token de autenticação não fornecido.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Formato de cabeçalho de autorização inválido. Use: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    logger.warn('Falha na validação do token JWT', { error: error.message });
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado.'
    });
  }
}

module.exports = authMiddleware;
