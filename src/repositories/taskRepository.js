const db = require('../config/database');

class TaskRepository {
  async create({ userId, title, description, priority, status, dueDate }) {
    const text = `
      INSERT INTO tasks (user_id, title, description, priority, status, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, title, description, priority, status, due_date, created_at, updated_at
    `;
    const result = await db.query(text, [
      userId,
      title,
      description || null,
      priority || 'MEDIA',
      status || 'PENDENTE',
      dueDate || null
    ]);
    return result.rows[0];
  }

  async findAllByUser(userId, { status, priority } = {}) {
    let text = 'SELECT id, user_id, title, description, priority, status, due_date, created_at, updated_at FROM tasks WHERE user_id = $1';
    const params = [userId];

    if (status) {
      params.push(status);
      text += ` AND status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      text += ` AND priority = $${params.length}`;
    }

    text += ' ORDER BY created_at DESC';
    const result = await db.query(text, params);
    return result.rows;
  }

  async findByIdAndUser(id, userId) {
    const text = 'SELECT id, user_id, title, description, priority, status, due_date, created_at, updated_at FROM tasks WHERE id = $1 AND user_id = $2';
    const result = await db.query(text, [id, userId]);
    return result.rows[0] || null;
  }

  async update(id, userId, { title, description, priority, status, dueDate }) {
    const text = `
      UPDATE tasks
      SET title = $1, description = $2, priority = $3, status = $4, due_date = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7
      RETURNING id, user_id, title, description, priority, status, due_date, created_at, updated_at
    `;
    const result = await db.query(text, [
      title,
      description || null,
      priority,
      status,
      dueDate || null,
      id,
      userId
    ]);
    return result.rows[0] || null;
  }

  async delete(id, userId) {
    const text = 'DELETE FROM tasks WHERE id = $1 AND user_id = $2';
    const result = await db.query(text, [id, userId]);
    return result.rowCount > 0;
  }
}

module.exports = new TaskRepository();
