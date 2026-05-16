// src/components/layout/Topbar.tsx
import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

type TopbarProps = {
  onToggleSidebar?: () => void;
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const location = useLocation();

  const activeView = location.pathname.slice(1);

  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    'backlog-geral': 'Backlog Geral',
    agenda: 'Agenda Técnica',
    producao: 'Produção Diária',
    relatorios: 'Relatórios',
    importar: 'Importar Planilha',
    usuarios: 'Cadastro de Usuários',
  };
  const subtitles: Record<string, string> = {
    dashboard: 'Visão geral do sistema',
    'backlog-geral': 'Todas as ordens',
    agenda: 'Calendário e agendamentos',
    producao: 'Atividades em campo hoje',
    relatorios: 'Exportar dados e relatórios',
    importar: 'Carregar dados do Excel',
    usuarios: 'Gerenciar acessos',
  };

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const dateText = useMemo(() => {
    const now = new Date();
    const opts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    };
    return now.toLocaleString('pt-BR', opts).replace(',', '');
  }, [tick]);

  return (
    <div className="topbar">
      <button
        type="button"
        className="topbar-btn"
        title="Toggle sidebar"
        onClick={onToggleSidebar}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <div>
        <div className="topbar-title">{titles[activeView] || 'SMRA'}</div>
        <div className="topbar-breadcrumb">
          {subtitles[activeView] || 'Sistema de Monitoramento de Rede e Ativações'}
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="topbar-date">{dateText}</div>

        <button type="button" className="topbar-btn" title="Notificações" style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notif-dot" style={{ position: 'absolute', top: 6, right: 6 }} />
        </button>
      </div>
    </div>
  );
}
