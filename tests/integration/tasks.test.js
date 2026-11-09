const request = require('supertest');
const app = require('../../src/app');

describe('Integration Tests: Task CRUD Endpoints (/api/v1/tasks)', () => {
  let authToken;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Dev DevOps',
        email: `dev_${Date.now()}@teste.com`,
        password: 'senha_segura_123'
      });
    authToken = regRes.body.data.token;
  });

  test('POST /tasks deve criar uma nova tarefa para o usuário logado (HTTP 201)', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Configurar Prometheus no CI',
        description: 'Criar arquivo prometheus.yml e conectar ao endpoint /metrics',
        priority: 'ALTA',
        status: 'PENDENTE'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Configurar Prometheus no CI');
    expect(res.body.data.priority).toBe('ALTA');
  });

  test('GET /tasks sem token deve ser rejeitado (HTTP 401)', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.statusCode).toBe(401);
  });

  test('PUT /tasks/:id deve atualizar o status de uma tarefa existente (HTTP 200)', async () => {
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Deploy no Render', priority: 'MEDIA' });

    const taskId = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'CONCLUIDA' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.status).toBe('CONCLUIDA');
  });

  test('DELETE /tasks/:id deve excluir a tarefa com sucesso (HTTP 204)', async () => {
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Tarefa para Excluir', priority: 'BAIXA' });

    const taskId = createRes.body.data.id;

    const delRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(delRes.statusCode).toBe(204);

    const getRes = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.statusCode).toBe(404);
  });
});
