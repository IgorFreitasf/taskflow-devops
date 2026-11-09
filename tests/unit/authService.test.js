const authService = require('../../src/services/authService');

describe('Unit Tests: AuthService', () => {
  test('Deve validar e rejeitar e-mails em formato inválido', () => {
    expect(authService.validateEmail('usuario_sem_arroba')).toBe(false);
    expect(authService.validateEmail('email@incompleto')).toBe(false);
    expect(authService.validateEmail('correto@dominio.com')).toBe(true);
  });

  test('Deve falhar ao registrar usuário com nome curto (< 2 caracteres)', async () => {
    await expect(authService.register({
      name: 'A',
      email: 'valido@dominio.com',
      password: 'senhaValida123'
    })).rejects.toThrow('O nome deve ter no mínimo 2 caracteres.');
  });

  test('Deve falhar ao registrar usuário com e-mail inválido', async () => {
    await expect(authService.register({
      name: 'Usuario Valido',
      email: 'email_sem_arroba.com',
      password: 'senhaValida123'
    })).rejects.toThrow('Forneça um e-mail válido.');
  });

  test('Deve falhar ao registrar usuário com senha inferior a 6 caracteres', async () => {
    await expect(authService.register({
      name: 'Dev Teste',
      email: 'teste@dev.com',
      password: '123'
    })).rejects.toThrow('A senha deve possuir no mínimo 6 caracteres.');
  });

  test('Deve falhar ao registrar usuário com e-mail duplicado', async () => {
    const userPayload = {
      name: 'Primeiro Usuario',
      email: 'duplicado@teste.com',
      password: 'senhaSegura123'
    };
    await authService.register(userPayload);

    await expect(authService.register(userPayload)).rejects.toThrow('Este e-mail já está em uso.');
  });

  test('Deve falhar login quando e-mail ou senha não forem fornecidos', async () => {
    await expect(authService.login({ email: '', password: '123' })).rejects.toThrow('E-mail e senha são obrigatórios.');
    await expect(authService.login({ email: 'user@test.com', password: '' })).rejects.toThrow('E-mail e senha são obrigatórios.');
  });

  test('Deve falhar login para usuário inexistente', async () => {
    await expect(authService.login({
      email: 'inexistente@teste.com',
      password: 'qualquer_senha'
    })).rejects.toThrow('Credenciais inválidas.');
  });

  test('Deve falhar login com senha incorreta', async () => {
    await authService.register({
      name: 'Usuario Login',
      email: 'login_errado@teste.com',
      password: 'senhaCorreta123'
    });

    await expect(authService.login({
      email: 'login_errado@teste.com',
      password: 'senhaIncorreta'
    })).rejects.toThrow('Credenciais inválidas.');
  });

  test('Deve realizar login com sucesso e retornar usuário e token', async () => {
    const email = 'login_sucesso@teste.com';
    const password = 'senhaCorreta123';
    await authService.register({
      name: 'Usuario Sucesso',
      email,
      password
    });

    const result = await authService.login({ email, password });
    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe(email);
  });

  test('Deve lançar erro fatal ao rodar em produção sem JWT_SECRET seguro', () => {
    const oldEnv = process.env.NODE_ENV;
    const oldSecret = process.env.JWT_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      expect(() => {
        authService.generateToken({ id: 99, email: 'prod@test.com' });
      }).toThrow('FATAL: JWT_SECRET seguro deve ser obrigatoriamente configurado em ambiente de produção.');
    } finally {
      process.env.NODE_ENV = oldEnv;
      process.env.JWT_SECRET = oldSecret;
    }
  });

  test('Deve gerar e verificar um token JWT válido', () => {
    const mockUser = { id: 1, name: 'Dev', email: 'dev@test.com' };
    const token = authService.generateToken(mockUser);
    expect(typeof token).toBe('string');

    const decoded = authService.verifyToken(token);
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
  });
});
