import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  listarAgendas,
  buscarAgenda,
  criarAgenda,
  atualizarItem,
  uploadFotos,
  deletarFoto,
  deletarItem,
  buscarPedidoNaBase
} from '../controllers/agendaController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(process.cwd(), 'uploads', 'agenda');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

const router = express.Router();

router.get('/', authenticateToken, listarAgendas);
router.get('/pedido/:pedido_id', authenticateToken, buscarPedidoNaBase);
router.get('/:id', authenticateToken, buscarAgenda);
router.post('/', authenticateToken, authorizeRoles('Administrador', 'Supervisor'), criarAgenda);
router.put('/item/:item_id', authenticateToken, atualizarItem);
router.delete('/item/:item_id', authenticateToken, authorizeRoles('Administrador', 'Supervisor'), deletarItem);
router.post('/item/:item_id/fotos', authenticateToken, upload.array('fotos', 20), uploadFotos);
router.delete('/foto/:foto_id', authenticateToken, deletarFoto);

export default router;
