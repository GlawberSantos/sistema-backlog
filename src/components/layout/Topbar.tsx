import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../ThemeProvider";

type TopbarProps = { onToggleSidebar: () => void };

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  "backlog-geral": "Backlog Geral",
  agenda: "Agenda Técnica",
  producao: "Produção Diária",
  relatorios: "Relatórios",
  importar: "Importar Planilha",
  usuarios: "Cadastro de Usuários",
};
const subtitles: Record<string, string> = {
  dashboard: "Visão geral do sistema",
  "backlog-geral": "Todas as ordens",
  agenda: "Calendário e agendamentos",
  producao: "Atividades em campo hoje",
  relatorios: "Exportar dados e relatórios",
  importar: "Carregar dados do Excel",
  usuarios: "Gerenciar acessos",
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const location = useLocation();
  const active = location.pathname.replace(/^\//, "") || "dashboard";
  const { theme, toggle } = useTheme();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const dateText = useMemo(() => {
    void tick;
    return new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }, [tick]);

  return (
    <div className="topbar">
      <button type="button" className="topbar-btn" title="Menu" onClick={onToggleSidebar}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="topbar-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titles[active] || "SMRA"}</div>
        <div className="topbar-breadcrumb hide-mobile">{subtitles[active] || ""}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="topbar-date hide-mobile">{dateText}</span>
        <button type="button" className="topbar-btn" onClick={toggle} title={theme === "dark" ? "Tema claro" : "Tema escuro"}>
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
        <button type="button" className="topbar-btn" title="Notificações" style={{ position: "relative" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span className="notif-dot" style={{ position: "absolute", top: 6, right: 6 }} />
        </button>
      </div>
    </div>
  );
}
