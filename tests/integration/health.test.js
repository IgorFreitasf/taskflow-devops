const request = require('supertest');
const app = require('../../src/app');

describe('Integration Tests: System Diagnostics (/health e /metrics)', () => {
  test('GET /health deve retornar status 200 e payload com uptime e status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('latencyMs');
  });

  test('GET /metrics deve expor métricas no formato padrão do Prometheus', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('taskflow_');
    expect(res.text).toContain('http_requests_total');
  });
});
