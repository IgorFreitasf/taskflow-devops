require('dotenv').config();
const app = require('./app');
const db = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Inicialização do Banco de Dados
    await db.initDb();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 TaskFlow Server operacional na porta ${PORT} [Ambiente: ${process.env.NODE_ENV || 'development'}]`);
      logger.info(`📊 Métricas disponíveis em http://localhost:${PORT}/metrics`);
      logger.info(`💓 Health check disponível em http://localhost:${PORT}/health`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`Sinal de encerramento recebido (${signal}). Fechando conexões...`);
      server.close(async () => {
        await db.closeDb();
        logger.info('Servidor HTTP e pool de banco finalizados com sucesso.');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Encerramento forçado após timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Erro crítico ao inicializar o servidor TaskFlow', { error: error.message });
    process.exit(1);
  }
}

startServer();
