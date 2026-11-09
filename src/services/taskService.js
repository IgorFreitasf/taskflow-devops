const taskRepository = require('../repositories/taskRepository');
const metricsService = require('./metricsService');

const VALID_PRIORITIES = ['BAIXA', 'MEDIA', 'ALTA'];
const VALID_STATUSES = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'];

class TaskService {
  async createTask(userId, { title, description, priority = 'MEDIA', status = 'PENDENTE', dueDate }) {
    if (!title || title.trim().length === 0) {
      const err = new Error('O título da tarefa é obrigatório.');
      err.statusCode = 400;
      throw err;
    }

    if (title.trim().length > 150) {
      const err = new Error('O título não pode exceder 150 caracteres.');
      err.statusCode = 400;
      throw err;
    }

    const upperPriority = priority.toUpperCase();
    if (!VALID_PRIORITIES.includes(upperPriority)) {
      const err = new Error(`Prioridade inválida. Valores permitidos: ${VALID_PRIORITIES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const upperStatus = status.toUpperCase();
    if (!VALID_STATUSES.includes(upperStatus)) {
      const err = new Error(`Status inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const task = await taskRepository.create({
      userId,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: upperPriority,
      status: upperStatus,
      dueDate: dueDate || null
    });

    metricsService.tasksCreatedCounter.inc({ priority: upperPriority });
    return task;
  }

  async listTasks(userId, filters = {}) {
    const { status, priority } = filters;

    if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
      const err = new Error(`Filtro de status inválido. Permitidos: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (priority && !VALID_PRIORITIES.includes(priority.toUpperCase())) {
      const err = new Error(`Filtro de prioridade inválido. Permitidos: ${VALID_PRIORITIES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    return taskRepository.findAllByUser(userId, {
      status: status ? status.toUpperCase() : undefined,
      priority: priority ? priority.toUpperCase() : undefined
    });
  }

  async getTaskById(id, userId) {
    const task = await taskRepository.findByIdAndUser(id, userId);
    if (!task) {
      const err = new Error('Tarefa não encontrada.');
      err.statusCode = 404;
      throw err;
    }
    return task;
  }

  async updateTask(id, userId, updates) {
    const existing = await this.getTaskById(id, userId);

    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    if (!title || title.length === 0) {
      const err = new Error('O título não pode ficar em branco.');
      err.statusCode = 400;
      throw err;
    }

    const priority = updates.priority ? updates.priority.toUpperCase() : existing.priority;
    if (!VALID_PRIORITIES.includes(priority)) {
      const err = new Error(`Prioridade inválida. Permitidos: ${VALID_PRIORITIES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const status = updates.status ? updates.status.toUpperCase() : existing.status;
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Status inválido. Permitidos: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const description = updates.description !== undefined ? updates.description : existing.description;
    const dueDate = updates.dueDate !== undefined ? updates.dueDate : existing.due_date;

    return taskRepository.update(id, userId, {
      title,
      description,
      priority,
      status,
      dueDate
    });
  }

  async deleteTask(id, userId) {
    const deleted = await taskRepository.delete(id, userId);
    if (!deleted) {
      const err = new Error('Tarefa não encontrada ou não pertence ao usuário.');
      err.statusCode = 404;
      throw err;
    }
    return true;
  }
}

module.exports = new TaskService();
