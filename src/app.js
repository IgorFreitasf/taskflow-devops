const express = require('express');
const cors = require('cors');
const path = require('path');

const authController = require('./controllers/authController');
const taskController = require('./controllers/taskController');
const systemController = require('./controllers/systemController');

const authMiddleware = require('./middlewares/authMiddleware');
const metricsMiddleware = require('./middlewares/metricsMiddleware');
const metricsAuthMiddleware = require('./middlewares/metricsAuthMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Configuração segura de CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

// Servir frontend estático da SPA
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de Operações e Monitoramento
app.get('/health', (req, res) => systemController.health(req, res));
app.get('/metrics', metricsAuthMiddleware, (req, res) => systemController.metrics(req, res));

// Rotas de Autenticação
const authRouter = express.Router();
authRouter.post('/register', (req, res, next) => authController.register(req, res, next));
authRouter.post('/login', (req, res, next) => authController.login(req, res, next));
authRouter.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));
app.use('/api/v1/auth', authRouter);

// Rotas do CRUD de Tarefas (Protegidas por JWT)
const taskRouter = express.Router();
taskRouter.use(authMiddleware);
taskRouter.post('/', (req, res, next) => taskController.create(req, res, next));
taskRouter.get('/', (req, res, next) => taskController.list(req, res, next));
taskRouter.get('/:id', (req, res, next) => taskController.getById(req, res, next));
taskRouter.put('/:id', (req, res, next) => taskController.update(req, res, next));
taskRouter.delete('/:id', (req, res, next) => taskController.delete(req, res, next));
app.use('/api/v1/tasks', taskRouter);

// Fallback para SPA (qualquer rota não-API serve o index.html)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint não encontrado.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware Global de Tratamento de Erros
app.use(errorMiddleware);

module.exports = app;
