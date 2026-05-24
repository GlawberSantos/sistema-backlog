// src/App.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import AppRoutes from './routes/AppRoutes';
import LoginPage from './features/login/LoginPage';
import TecnicoView from './features/tecnico/TecnicoView';
import { useAppStore } from './store/useAppStore';
import { useState } from 'react';

function App() {
  const { currentUser, loadAll } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setSidebarOpen((o) => !o);
    } else {
      setSidebarCollapsed((c) => !c);
    }
  };

  // Carrega dados do localStorage ao iniciar (síncrono na prática)
  useEffect(() => {
    loadAll().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg, #2d7ef0, #0dd8d8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.136 12.006a8.25 8.25 0 0 1 13.728 0M2 8.974a12 12 0 0 1 20 0"/>
            <circle cx="12" cy="19" r="1.5" fill="white"/>
          </svg>
        </div>
        <div style={{ color: '#4a5a7a', fontSize: 13 }}>Carregando dados...</div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  if (currentUser.nivel === 'Técnico') return <TecnicoView />;

  return (
    <ThemeProvider>
      <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <div className="bg-[#0a0f1a] text-[#c8d3e6]" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <Sidebar
            open={sidebarOpen}
            collapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <Topbar onToggleSidebar={toggleSidebar} />
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              <AppRoutes />
            </div>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;