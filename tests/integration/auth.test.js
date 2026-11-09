const request = require('supertest');
const app = require('../../src/app');

describe('Integration Tests: Auth Endpoints (/api/v1/auth)', () => {
  const testUser = {
    name: 'Engenheiro QA',
    email: 'qa@empresa.com',
    password: 'password123'
  };

  test('POST /register deve cadastrar usuário com sucesso (HTTP 201)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data).toHaveProperty('token');
  });

  test('POST /register deve impedir cadastro duplicado com mesmo e-mail (HTTP 409)', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain('já está em uso');
  });

  test('POST /login deve autenticar com sucesso credenciais válidas (HTTP 200)', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  test('POST /login deve rejeitar senha incorreta (HTTP 401)', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'senha_errada' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Credenciais inválidas.');
  });
});
