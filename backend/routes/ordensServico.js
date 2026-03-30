import express from 'express';
import {
  listarOrdensServico,
  buscarOrdemServico,
  criarOrdemServico,
  atualizarOrdemServico,
  deletarOrdemServico,
  adicionarObservacao,
  importarPlanilha
} from '../controllers/ordensServicoController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/importar', authenticateToken, authorizeRoles('Administrador', 'Supervisor'), importarPlanilha);

router.get('/', authenticateToken, listarOrdensServico);
router.get('/:id', authenticateToken, buscarOrdemServico);
router.post('/', authenticateToken, authorizeRoles('Administrador', 'Supervisor'), criarOrdemServico);
router.put('/:id', authenticateToken, atualizarOrdemServico);
router.delete('/:id', authenticateToken, authorizeRoles('Administrador', 'Supervisor'), deletarOrdemServico);
router.post('/:id/observacoes', authenticateToken, adicionarObservacao);

export default router;
