const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { memoryDb, handleMemoryQuery } = require('./memoryDb');

let pool = null;
let useMemoryFallback = process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL;

if (!useMemoryFallback) {
  const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'taskflow_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres_password',
        max: 10,
        idleTimeoutMillis: 30000
      };

  pool = new Pool(connectionConfig);

  pool.on('error', (err) => {
    logger.error('Erro inesperado no pool do PostgreSQL', { error: err.message });
  });
}

/**
 * Executa uma query SQL com suporte a PostgreSQL e fallback em memória para testes isolados.
 */
async function query(text, params = []) {
  if (useMemoryFallback) {
    return handleMemoryQuery(text, params);
  }

  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    if (process.env.NODE_ENV === 'test' && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
      logger.warn('PostgreSQL inacessível em ambiente de teste. Alternando para memória temporária.');
      useMemoryFallback = true;
      return handleMemoryQuery(text, params);
    }
    logger.error('Erro ao executar query SQL', { text, error: error.message });
    throw error;
  }
}

/**
 * Inicialização do Banco de Dados a partir do schema.sql (Única fonte de verdade)
 */
async function initDb() {
  if (useMemoryFallback) {
    logger.info('Banco em memória inicializado para testes.');
    return;
  }

  try {
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const ddl = fs.readFileSync(schemaPath, 'utf-8');
    await query(ddl);
    logger.info('Tabelas e índices do banco de dados verificados com sucesso a partir de schema.sql.');
  } catch (error) {
    logger.error('Falha ao rodar DDL do schema.sql no banco', { error: error.message });
    throw error;
  }
}

async function closeDb() {
  if (pool) {
    await pool.end();
  }
}

module.exports = {
  query,
  initDb,
  closeDb,
  memoryDb,
  isUsingMemory: () => useMemoryFallback,
  setUseMemory: (val) => { useMemoryFallback = val; }
};
