const authMiddleware = require('../../src/middlewares/authMiddleware');
const errorMiddleware = require('../../src/middlewares/errorMiddleware');
const authService = require('../../src/services/authService');

describe('Unit Tests: Middlewares', () => {
  describe('authMiddleware', () => {
    test('Deve retornar 401 se cabeçalho de autorização estiver ausente', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(next).not.toHaveBeenCalled();
    });

    test('Deve retornar 401 se formato do cabeçalho for inválido', () => {
      const req = { headers: { authorization: 'InvalidoSemBearerToken' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Formato de cabeçalho') }));
    });

    test('Deve retornar 401 se o token JWT for forjado ou inválido', () => {
      const req = { headers: { authorization: 'Bearer token_invalido_com_certeza' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token inválido ou expirado.' }));
    });

    test('Deve chamar next() e anexar req.user se token for válido', () => {
      const user = { id: 42, name: 'Tester', email: 'test@middle.com' };
      const token = authService.generateToken(user);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(42);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('errorMiddleware', () => {
    test('Deve formatar resposta com código de erro customizado', () => {
      const err = new Error('Erro de validação');
      err.statusCode = 400;

      const req = { originalUrl: '/api/v1/test', method: 'POST' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Erro de validação' });
    });

    test('Deve mapear código 23505 para status 409', () => {
      const err = new Error('Violacao de chave unica');
      err.code = '23505';

      const req = { originalUrl: '/api/v1/test', method: 'POST' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });
});
