import { Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Backlog from './pages/Backlog';
import NovaOrdem from './pages/NovaOrdem';
import DetalhesOrdem from './pages/DetalhesOrdem';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';
import ImportarPlanilha from './pages/ImportarPlanilha';
import AgendaDia from './pages/AgendaDia';
import DetalhesAgenda from './pages/DetalhesAgenda';

// Import Components
import PrivateRoute from './components/PrivateRoute'; // Nosso novo PrivateRoute

function App() {
  return (
      <Routes>
        {/* A página de login é pública e não tem o Layout */}
        <Route path="/login" element={<Login />} />

        {/* Todas as outras rotas são privadas e usam o PrivateRoute */}
        {/* O PrivateRoute renderiza o Layout e o conteúdo da rota filha (Outlet) */}
        <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="backlog" element={<Backlog />} />
            <Route path="nova-ordem" element={<NovaOrdem />} />
            <Route path="ordem/:id" element={<DetalhesOrdem />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="importar" element={<ImportarPlanilha />} />
            <Route path="agenda" element={<AgendaDia />} />
            <Route path="agenda/:id" element={<DetalhesAgenda />} />
        </Route>
      </Routes>
  );
}

export default App;
