import express from 'express';
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario,
  listarTecnicos,
  listarUfs
} from '../controllers/usuariosController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('Administrador', 'Supervisor'), listarUsuarios);
router.get('/tecnicos', authenticateToken, listarTecnicos);
router.get('/ufs', authenticateToken, listarUfs);
router.post('/', authenticateToken, authorizeRoles('Administrador'), criarUsuario);
router.put('/:id', authenticateToken, authorizeRoles('Administrador'), atualizarUsuario);
router.delete('/:id', authenticateToken, authorizeRoles('Administrador'), deletarUsuario);

export default router;
