import express from 'express';
import {
  getDashboardStats,
  getRelatorioBacklogPorUF,
  getRelatorioBacklogPorRegiao,
  getRelatorioConcluidosPorPeriodo,
  getRelatorioTempoMedio
} from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/relatorio/uf', authenticateToken, getRelatorioBacklogPorUF);
router.get('/relatorio/tecnico', authenticateToken, getRelatorioBacklogPorUF); // Alias for backward compatibility
router.get('/relatorio/regiao', authenticateToken, getRelatorioBacklogPorRegiao);
router.get('/relatorio/concluidos', authenticateToken, getRelatorioConcluidosPorPeriodo);
router.get('/relatorio/tempo-medio', authenticateToken, getRelatorioTempoMedio);

export default router;
