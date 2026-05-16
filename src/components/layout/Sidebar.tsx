// src/components/layout/Sidebar.tsx
import { useState } from 'react';
import { useAppStore, User } from '../../store/useAppStore';
import { Link, useLocation } from 'react-router-dom';

const navGroups = [
  {
    group: 'Principal',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
      },
      {
        id: 'backlog-geral',
        label: 'Backlog',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}>
            <path d="M3.75 12h16.5M3.75 6h16.5M3.75 18h16.5" />
          </svg>
        ),
      },
      {
        id: 'agenda',
        label: 'Agenda Técnica',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
          </svg>
        ),
      },
      {
        id: 'producao',
        label: 'Produção Diária',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}>
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Configurações',
    items: [
      {
        id: 'relatorios',
        label: 'Relatórios',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}>
            <path d="M3 3v18h18" />
            <path d="M7 16l4-4 4 4 4-8" />
          </svg>
        ),
      },
      {
        id: 'importar',
        label: 'Importar Planilha',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}>
            <path d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
          </svg>
        ),
      },
      {
        id: 'usuarios',
        label: 'Usuários',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}>
            <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.53-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-4.663M12 3.375c-3.418 0-6.162 2.744-6.162 6.125 0 3.38 2.744 6.125 6.162 6.125s6.162-2.744 6.162-6.125c0-3.38-2.744-6.125-6.162-6.125Z" />
          </svg>
        ),
      },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

const roleColors: Record<User['nivel'], string> = {
  Administrador: '#e85555',
  Supervisor: '#2d7ef0',
  Técnico: '#0eb88a',
};

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { currentUser, users, setCurrentUser } = useAppStore();
  const location = useLocation();
  const activeView = location.pathname.slice(1) || 'dashboard';
  const [pickUser, setPickUser] = useState(false);

  const loginAsRole = (nivel: User['nivel']) => {
    const u = users.find((x) => x.nivel === nivel);
    if (u) setCurrentUser(u);
    setPickUser(false);
  };

  return (
    <aside
      style={{
        width: collapsed ? 60 : 240,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        zIndex: 30,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.136 12.006a8.25 8.25 0 0 1 13.728 0M2 8.974a12 12 0 0 1 20 0" />
            <circle cx="12" cy="19" r="1.5" fill="white" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              SMRA
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, lineHeight: 1.35 }}>
              Sistema de Monitoramento
              <br /> Rede e Ativações
            </div>
          </div>
        )}
      </div>

      <nav style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
        {navGroups.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '12px 16px 4px',
                }}
              >
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = activeView === item.id;
              return (
                <Link
                  key={item.id}
                  to={`/${item.id}`}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: collapsed ? '10px' : '8px 14px',
                    margin: '1px 8px',
                    marginRight: isActive ? '6px' : '8px',
                    borderRadius: 6,
                    fontSize: 13,
                    color: isActive ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(45,126,240,0.15)' : 'transparent',
                    borderRight: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    justifyContent: collapsed ? 'center' : undefined,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {collapsed && currentUser && (
          <button
            type="button"
            title="Sair"
            onClick={() => setCurrentUser(null)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '10px', background: 'transparent',
              border: 'none', color: 'var(--accent-red)', cursor: 'pointer',
              borderRadius: 6,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        )}
        {!collapsed && currentUser && !pickUser && (
          <>
            <div className="user-card">
              <div
                className="user-avatar"
                style={{
                  background: `${roleColors[currentUser.nivel]}20`,
                  color: roleColors[currentUser.nivel],
                }}
              >
                {currentUser.nome
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name">{currentUser.nome}</div>
                <div className="user-role">
                  {currentUser.nivel} · {currentUser.uf || '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 10 }} onClick={() => setPickUser(true)}>
                Trocar
              </button>
              <button type="button" className="btn btn-danger btn-sm" style={{ fontSize: 10 }} onClick={() => setCurrentUser(null)}>
                Sair
              </button>
            </div>
          </>
        )}
        {!collapsed && pickUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <button type="button" className="btn btn-danger btn-sm" style={{ justifyContent: 'center' }} onClick={() => loginAsRole('Administrador')}>
              Admin
            </button>
            <button type="button" className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }} onClick={() => loginAsRole('Supervisor')}>
              Supervisor
            </button>
            <button type="button" className="btn btn-success btn-sm" style={{ justifyContent: 'center' }} onClick={() => loginAsRole('Técnico')}>
              Técnico
            </button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }} onClick={() => setPickUser(false)}>
              Cancelar
            </button>
          </div>
        )}
        {!collapsed && !currentUser && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Simular login:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <button type="button" className="btn btn-danger btn-sm" style={{ justifyContent: 'center' }} onClick={() => loginAsRole('Administrador')}>
                Admin
              </button>
              <button type="button" className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }} onClick={() => loginAsRole('Supervisor')}>
                Supervisor
              </button>
              <button type="button" className="btn btn-success btn-sm" style={{ justifyContent: 'center' }} onClick={() => loginAsRole('Técnico')}>
                Técnico
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export type { SidebarProps };
