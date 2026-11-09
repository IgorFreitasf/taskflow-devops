/**
 * Banco em memória (test double / fallback de desenvolvimento).
 * Emula apenas as queries usadas pelos repositórios quando não há PostgreSQL.
 * Fica FORA da métrica de cobertura (ver collectCoverageFrom no package.json):
 * o CI roda contra PostgreSQL real, então este código não é o alvo dos testes.
 */
// Banco de dados em memória para testes unitários ou ambientes sem PostgreSQL ativo
const memoryDb = {
  users: [],
  tasks: [],
  userIdSeq: 1,
  taskIdSeq: 1,
  reset() {
    this.users = [];
    this.tasks = [];
    this.userIdSeq = 1;
    this.taskIdSeq = 1;
  }
};

function handleMemoryQuery(text, params) {
  const cleanSql = text.replace(/\s+/g, ' ').trim().toUpperCase();

  // Teste de conexão: SELECT 1
  if (cleanSql.includes('SELECT 1')) {
    return { rows: [{ '?COLUMN?': 1 }], rowCount: 1 };
  }

  // TRUNCATE TABLE (limpeza entre testes)
  if (cleanSql.startsWith('TRUNCATE')) {
    memoryDb.reset();
    return { rows: [], rowCount: 0 };
  }

  // INSERT INTO USERS
  if (cleanSql.startsWith('INSERT INTO USERS')) {
    const [name, email, password_hash] = params;
    const existing = memoryDb.users.find(u => u.email === email);
    if (existing) {
      const err = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      throw err;
    }
    const newUser = {
      id: memoryDb.userIdSeq++,
      name,
      email,
      password_hash,
      created_at: new Date()
    };
    memoryDb.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  // INSERT INTO TASKS
  if (cleanSql.startsWith('INSERT INTO TASKS')) {
    const [user_id, title, description, priority, status, due_date] = params;
    const newTask = {
      id: memoryDb.taskIdSeq++,
      user_id: parseInt(user_id, 10),
      title,
      description: description || null,
      priority: priority || 'MEDIA',
      status: status || 'PENDENTE',
      due_date: due_date || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryDb.tasks.push(newTask);
    return { rows: [newTask], rowCount: 1 };
  }

  // DELETE FROM TASKS (PROCESSADO ANTES DE QUALQUER SELECT PARA EVITAR FALSO MATCH)
  if (cleanSql.startsWith('DELETE FROM TASKS')) {
    const [id, userId] = params;
    const initialLen = memoryDb.tasks.length;
    memoryDb.tasks = memoryDb.tasks.filter(t => !(t.id === parseInt(id, 10) && t.user_id === parseInt(userId, 10)));
    const deletedCount = initialLen - memoryDb.tasks.length;
    return { rows: [], rowCount: deletedCount };
  }

  // UPDATE TASKS
  if (cleanSql.startsWith('UPDATE TASKS')) {
    const [title, description, priority, status, due_date, id, userId] = params;
    const taskIndex = memoryDb.tasks.findIndex(t => t.id === parseInt(id, 10) && t.user_id === parseInt(userId, 10));
    if (taskIndex === -1) {
      return { rows: [], rowCount: 0 };
    }
    const updated = {
      ...memoryDb.tasks[taskIndex],
      title,
      description,
      priority,
      status,
      due_date,
      updated_at: new Date()
    };
    memoryDb.tasks[taskIndex] = updated;
    return { rows: [updated], rowCount: 1 };
  }

  // SELECT ... FROM USERS WHERE EMAIL = $1
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM USERS') && cleanSql.includes('EMAIL = $1')) {
    const email = params[0];
    const user = memoryDb.users.find(u => u.email === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // SELECT ... FROM USERS WHERE ID = $1
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM USERS') && cleanSql.includes('ID = $1')) {
    const id = parseInt(params[0], 10);
    const user = memoryDb.users.find(u => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // SELECT ... FROM TASKS WHERE ID = $1 AND USER_ID = $2
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM TASKS') && cleanSql.includes('ID = $1') && cleanSql.includes('USER_ID = $2')) {
    const [id, userId] = params;
    const task = memoryDb.tasks.find(t => t.id === parseInt(id, 10) && t.user_id === parseInt(userId, 10));
    return { rows: task ? [task] : [], rowCount: task ? 1 : 0 };
  }

  // SELECT ... FROM TASKS WHERE USER_ID = $1
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM TASKS') && cleanSql.includes('USER_ID = $1')) {
    const userId = parseInt(params[0], 10);
    let results = memoryDb.tasks.filter(t => t.user_id === userId);

    if (params.length > 1 && params[1]) {
      results = results.filter(t => t.status === params[1]);
    }
    if (params.length > 2 && params[2]) {
      results = results.filter(t => t.priority === params[2]);
    }

    return { rows: results, rowCount: results.length };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = { memoryDb, handleMemoryQuery };
