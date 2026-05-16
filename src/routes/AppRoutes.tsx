// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '../features/dashboard/DashboardPage';
import BacklogPage from '../features/backlog/BacklogPage';
import AgendaPage from '../features/agenda/AgendaPage';
import ProducaoPage from '../features/producao/ProducaoPage';
import RelatoriosPage from '../features/relatorios/RelatoriosPage';
import ImportarPage from '../features/importar/ImportarPage';
import UsuariosPage from '../features/usuarios/UsuariosPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/backlog-geral" element={<BacklogPage />} />
      <Route path="/agenda" element={<AgendaPage />} />
      <Route path="/producao" element={<ProducaoPage />} />
      <Route path="/relatorios" element={<RelatoriosPage />} />
      <Route path="/importar" element={<ImportarPage />} />
      <Route path="/usuarios" element={<UsuariosPage />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}