const metricsService = require('../services/metricsService');

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics' || req.path.startsWith('/css') || req.path.startsWith('/js') || req.path === '/favicon.ico') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    let route = req.route ? req.baseUrl + req.route.path : req.path;
    route = route.replace(/\/\d+/g, '/:id');

    const statusCode = res.statusCode ? res.statusCode.toString() : '500';

    metricsService.httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: statusCode
    });

    metricsService.httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode
      },
      durationInSeconds
    );
  });

  next();
}

module.exports = metricsMiddleware;
