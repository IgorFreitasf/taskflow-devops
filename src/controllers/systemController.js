const db = require('../config/database');
const metricsService = require('../services/metricsService');
const logger = require('../config/logger');

class SystemController {
  async health(req, res) {
    const startTime = Date.now();
    let dbStatus = 'disconnected';
    let httpStatus = 200;

    try {
      await db.query('SELECT 1');
      dbStatus = 'connected';
    } catch (error) {
      logger.error('Health check falhou na checagem do banco de dados', { error: error.message });
      dbStatus = 'error: ' + error.message;
      httpStatus = 503;
    }

    const payload = {
      status: httpStatus === 200 ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      latencyMs: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development'
    };

    return res.status(httpStatus).json(payload);
  }

  async metrics(req, res) {
    try {
      res.set('Content-Type', metricsService.getContentType());
      const data = await metricsService.getMetrics();
      return res.send(data);
    } catch (error) {
      logger.error('Erro ao coletar métricas do Prometheus', { error: error.message });
      return res.status(500).send('# Erro ao coletar métricas');
    }
  }
}

module.exports = new SystemController();
