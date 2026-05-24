import * as React from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppStore, type User } from "../../store/useAppStore";

const navGroups = [
  {
    group: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "backlog-geral", label: "Backlog" },
      { id: "agenda", label: "Agenda Técnica" },
      { id: "producao", label: "Produção Diária" },
    ],
  },
  {
    group: "Configurações",
    items: [
      { id: "relatorios", label: "Relatórios" },
      { id: "importar", label: "Importar Planilha" },
      { id: "usuarios", label: "Usuários" },
    ],
  },
];

const icons: Record<string, React.ReactNode> = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  "backlog-geral": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3.75 12h16.5M3.75 6h16.5M3.75 18h16.5"/></svg>,
  agenda: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>,
  producao: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  relatorios: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-8"/></svg>,
  importar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"/></svg>,
  usuarios: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>,
};

const roleColors: Record<User["nivel"], string> = {
  Administrador: "#e85555",
  Supervisor: "#2d7ef0",
  Técnico: "#0eb88a",
};

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  const { currentUser, users, setCurrentUser } = useAppStore();
  const location = useLocation();
  const active = location.pathname.replace(/^\//, "") || "dashboard";
  const [pickUser, setPickUser] = useState(false);

  const loginAsRole = (nivel: User["nivel"]) => {
    const u = users.find((x) => x.nivel === nivel);
    if (u) setCurrentUser(u);
    setPickUser(false);
  };

  return (
    <>
      <div className={`sidebar-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.136 12.006a8.25 8.25 0 0 1 13.728 0M2 8.974a12 12 0 0 1 20 0"/><circle cx="12" cy="19" r="1.5" fill="white"/></svg>
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.3px", lineHeight: 1.1 }}>SMRA</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.35 }}>Monitoramento de Rede</div>
            </div>
          )}
        </div>

        <nav style={{ padding: "8px 0", flex: 1, overflowY: "auto" }}>
          {navGroups.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, padding: "12px 16px 4px" }}>
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <Link
                    key={item.id}
                    to={`/${item.id}` as string}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: collapsed ? "10px" : "10px 14px",
                      margin: "1px 8px",
                      borderRadius: 8,
                      fontSize: 13, fontWeight: 500,
                      color: isActive ? "var(--accent-blue-light)" : "var(--text-secondary)",
                      background: isActive ? "color-mix(in oklab, var(--accent-blue) 18%, transparent)" : "transparent",
                      textDecoration: "none", transition: "all 0.15s",
                      justifyContent: collapsed ? "center" : undefined, whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ width: 18, height: 18, display: "flex" }}>{icons[item.id]}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {currentUser && !pickUser && !collapsed && (
            <>
              <div className="user-card">
                <div className="user-avatar" style={{ background: `${roleColors[currentUser.nivel]}25`, color: roleColors[currentUser.nivel] }}>
                  {currentUser.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="user-name">{currentUser.nome}</div>
                  <div className="user-role">{currentUser.nivel} · {currentUser.uf || "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setPickUser(true)}>Trocar</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setCurrentUser(null)}>Sair</button>
              </div>
            </>
          )}
          {pickUser && !collapsed && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <button type="button" className="btn btn-danger btn-sm" style={{ justifyContent: "center" }} onClick={() => loginAsRole("Administrador")}>Admin</button>
              <button type="button" className="btn btn-primary btn-sm" style={{ justifyContent: "center" }} onClick={() => loginAsRole("Supervisor")}>Supervisor</button>
              <button type="button" className="btn btn-success btn-sm" style={{ justifyContent: "center" }} onClick={() => loginAsRole("Técnico")}>Técnico</button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={() => setPickUser(false)}>Cancelar</button>
            </div>
          )}
          {collapsed && currentUser && (
            <button type="button" title="Sair" onClick={() => setCurrentUser(null)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: 10, background: "transparent", border: "none", color: "var(--accent-red)", cursor: "pointer", borderRadius: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
