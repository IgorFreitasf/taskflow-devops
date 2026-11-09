const taskService = require('../services/taskService');

class TaskController {
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { title, description, priority, status, dueDate } = req.body;
      const task = await taskService.createTask(userId, {
        title,
        description,
        priority,
        status,
        dueDate
      });
      return res.status(201).json({
        success: true,
        message: 'Tarefa criada com sucesso.',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, priority } = req.query;
      const tasks = await taskService.listTasks(userId, { status, priority });
      return res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const userId = req.user.id;
      const taskId = parseInt(req.params.id, 10);
      const task = await taskService.getTaskById(taskId, userId);
      return res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const taskId = parseInt(req.params.id, 10);
      const { title, description, priority, status, dueDate } = req.body;
      const updated = await taskService.updateTask(taskId, userId, {
        title,
        description,
        priority,
        status,
        dueDate
      });
      return res.status(200).json({
        success: true,
        message: 'Tarefa atualizada com sucesso.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const taskId = parseInt(req.params.id, 10);
      await taskService.deleteTask(taskId, userId);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
