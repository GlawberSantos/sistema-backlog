import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import ordensServicoRoutes from './routes/ordensServico.js';
import dashboardRoutes from './routes/dashboard.js';
import agendaRoutes from './routes/agenda.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ordens-servico', ordensServicoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agenda', agendaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}/api`);
});
