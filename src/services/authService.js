const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

function getJwtSecret() {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev_secret'))) {
    throw new Error('FATAL: JWT_SECRET seguro deve ser obrigatoriamente configurado em ambiente de produção.');
  }
  return process.env.JWT_SECRET || 'dev_secret_taskflow_key_change_in_prod';
}

const JWT_EXPIRES_IN = '24h';

class AuthService {
  async register({ name, email, password }) {
    if (!name || name.trim().length < 2) {
      const err = new Error('O nome deve ter no mínimo 2 caracteres.');
      err.statusCode = 400;
      throw err;
    }

    if (!email || !this.validateEmail(email)) {
      const err = new Error('Forneça um e-mail válido.');
      err.statusCode = 400;
      throw err;
    }

    if (!password || password.length < 6) {
      const err = new Error('A senha deve possuir no mínimo 6 caracteres.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      const err = new Error('Este e-mail já está em uso.');
      err.statusCode = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error('E-mail e senha são obrigatórios.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      const err = new Error('Credenciais inválidas.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Credenciais inválidas.');
      err.statusCode = 401;
      throw err;
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    };

    const token = this.generateToken(safeUser);
    return { user: safeUser, token };
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    return jwt.verify(token, getJwtSecret());
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

module.exports = new AuthService();
