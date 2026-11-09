const db = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const text = 'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1';
    const result = await db.query(text, [email]);
    return result.rows[0] || null;
  }

  async findById(id) {
    const text = 'SELECT id, name, email, created_at FROM users WHERE id = $1';
    const result = await db.query(text, [id]);
    return result.rows[0] || null;
  }

  async create({ name, email, passwordHash }) {
    const text = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
    `;
    const result = await db.query(text, [name, email, passwordHash]);
    return result.rows[0];
  }
}

module.exports = new UserRepository();
