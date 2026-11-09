const taskService = require('../../src/services/taskService');
const userRepository = require('../../src/repositories/userRepository');

describe('Unit Tests: TaskService', () => {
  let userId;

  // Usuário real: a FK tasks.user_id exige que ele exista no PostgreSQL.
  // (tests/setup.js limpa as tabelas antes de cada teste.)
  beforeEach(async () => {
    const user = await userRepository.create({
      name: 'Usuário Teste',
      email: 'unit.tasks@taskflow.com',
      passwordHash: 'hash_ficticio'
    });
    userId = user.id;
  });

  test('Deve rejeitar criação de tarefa sem título', async () => {
    await expect(taskService.createTask(userId, {
      title: '   ',
      priority: 'MEDIA'
    })).rejects.toThrow('O título da tarefa é obrigatório.');
  });

  test('Deve rejeitar criação de tarefa com título maior que 150 caracteres', async () => {
    const longTitle = 'A'.repeat(151);
    await expect(taskService.createTask(userId, {
      title: longTitle,
      priority: 'MEDIA'
    })).rejects.toThrow('O título não pode exceder 150 caracteres.');
  });

  test('Deve rejeitar prioridade diferente de BAIXA, MEDIA ou ALTA', async () => {
    await expect(taskService.createTask(userId, {
      title: 'Tarefa Teste',
      priority: 'URGENTE_INVALIDA'
    })).rejects.toThrow('Prioridade inválida.');
  });

  test('Deve rejeitar status fora dos permitidos', async () => {
    await expect(taskService.createTask(userId, {
      title: 'Tarefa Teste',
      priority: 'ALTA',
      status: 'CANCELADA_INVALIDO'
    })).rejects.toThrow('Status inválido.');
  });

  test('Deve criar tarefa com sucesso e registrar métrica', async () => {
    const task = await taskService.createTask(userId, {
      title: 'Implementar testes unitários',
      description: 'Cobertura de testes acima de 70%',
      priority: 'ALTA',
      status: 'PENDENTE'
    });

    expect(task).toHaveProperty('id');
    expect(task.title).toBe('Implementar testes unitários');
    expect(task.priority).toBe('ALTA');
  });

  test('Deve listar tarefas com e sem filtros válidos', async () => {
    await taskService.createTask(userId, { title: 'T1', priority: 'BAIXA', status: 'PENDENTE' });
    await taskService.createTask(userId, { title: 'T2', priority: 'ALTA', status: 'CONCLUIDA' });

    const all = await taskService.listTasks(userId);
    expect(all.length).toBeGreaterThanOrEqual(2);

    const pending = await taskService.listTasks(userId, { status: 'PENDENTE' });
    expect(pending.every(t => t.status === 'PENDENTE')).toBe(true);

    const highPriority = await taskService.listTasks(userId, { priority: 'ALTA' });
    expect(highPriority.every(t => t.priority === 'ALTA')).toBe(true);
  });

  test('Deve falhar ao listar tarefas com filtro de status inválido', async () => {
    await expect(taskService.listTasks(userId, { status: 'STATUS_INVALIDO' })).rejects.toThrow('Filtro de status inválido.');
  });

  test('Deve falhar ao listar tarefas com filtro de prioridade inválida', async () => {
    await expect(taskService.listTasks(userId, { priority: 'PRIO_INVALIDA' })).rejects.toThrow('Filtro de prioridade inválido.');
  });

  test('Deve falhar ao buscar tarefa inexistente', async () => {
    await expect(taskService.getTaskById(99999, userId)).rejects.toThrow('Tarefa não encontrada.');
  });

  test('Deve atualizar dados e status de uma tarefa com sucesso', async () => {
    const created = await taskService.createTask(userId, { title: 'Tarefa Atualizavel', priority: 'MEDIA' });
    const updated = await taskService.updateTask(created.id, userId, {
      title: 'Tarefa Atualizada',
      priority: 'ALTA',
      status: 'EM_ANDAMENTO',
      description: 'Nova descricao'
    });

    expect(updated.title).toBe('Tarefa Atualizada');
    expect(updated.status).toBe('EM_ANDAMENTO');
    expect(updated.priority).toBe('ALTA');
  });

  test('Deve falhar ao atualizar tarefa com título em branco', async () => {
    const created = await taskService.createTask(userId, { title: 'Valida Titulo' });
    await expect(taskService.updateTask(created.id, userId, { title: '   ' })).rejects.toThrow('O título não pode ficar em branco.');
  });

  test('Deve falhar ao atualizar tarefa com prioridade ou status inválidos', async () => {
    const created = await taskService.createTask(userId, { title: 'Valida Campos' });
    await expect(taskService.updateTask(created.id, userId, { priority: 'INVALIDA' })).rejects.toThrow('Prioridade inválida.');
    await expect(taskService.updateTask(created.id, userId, { status: 'INVALIDO' })).rejects.toThrow('Status inválido.');
  });

  test('Deve falhar ao excluir tarefa inexistente e suceder com tarefa existente', async () => {
    await expect(taskService.deleteTask(99999, userId)).rejects.toThrow('Tarefa não encontrada');

    const created = await taskService.createTask(userId, { title: 'Para Deletar' });
    const deleted = await taskService.deleteTask(created.id, userId);
    expect(deleted).toBe(true);
  });
});
