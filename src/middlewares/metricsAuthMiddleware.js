const crypto = require('crypto');

function safeCompare(provided, expected) {
  const providedBuffer = Buffer.from(provided, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  return providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function metricsAuthMiddleware(req, res, next) {
  const expectedUsername = process.env.METRICS_USERNAME;
  const expectedPassword = process.env.METRICS_PASSWORD;

  // Fail closed: never expose metrics if credentials were not configured.
  if (!expectedUsername || !expectedPassword) {
    return res.status(503).json({
      success: false,
      error: 'Monitoramento indisponível: credenciais não configuradas.'
    });
  }

  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Basic\s+(.+)$/i);

  if (!match) {
    res.set('WWW-Authenticate', 'Basic realm="TaskFlow Metrics"');
    return res.status(401).json({
      success: false,
      error: 'Autenticação necessária.'
    });
  }

  let decoded;

  try {
    decoded = Buffer.from(match[1], 'base64').toString('utf8');
  } catch (error) {
    res.set('WWW-Authenticate', 'Basic realm="TaskFlow Metrics"');
    return res.status(401).json({
      success: false,
      error: 'Credenciais inválidas.'
    });
  }

  const separator = decoded.indexOf(':');

  if (separator < 0) {
    res.set('WWW-Authenticate', 'Basic realm="TaskFlow Metrics"');
    return res.status(401).json({
      success: false,
      error: 'Credenciais inválidas.'
    });
  }

  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  const validUsername = safeCompare(username, expectedUsername);
  const validPassword = safeCompare(password, expectedPassword);

  if (!validUsername || !validPassword) {
    res.set('WWW-Authenticate', 'Basic realm="TaskFlow Metrics"');
    return res.status(401).json({
      success: false,
      error: 'Credenciais inválidas.'
    });
  }

  return next();
}

module.exports = metricsAuthMiddleware;
