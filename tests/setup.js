// Configuração do Ambiente de Testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_token_12345';
process.env.LOG_LEVEL = 'error';

const db = require('../src/config/database');

// BLOQUEADOR RESOLVIDO: Inicializa o schema DDL antes de qualquer teste rodar
beforeAll(async () => {
  await db.initDb();
});

// Limpeza de tabelas entre os testes (PostgreSQL real ou em memória)
beforeEach(async () => {
  if (db.isUsingMemory()) {
    db.memoryDb.reset();
  } else {
    await db.query('TRUNCATE TABLE tasks, users RESTART IDENTITY CASCADE;');
  }
});

afterAll(async () => {
  await db.closeDb();
});
