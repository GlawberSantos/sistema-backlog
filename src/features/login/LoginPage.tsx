// src/features/login/LoginPage.tsx
// Login por e-mail e senha.

import { useState } from 'react';
import { useAppStore, User } from '../../store/useAppStore';
import { useEffect } from 'react';

const roleColors: Record<User['nivel'], string> = {
  Administrador: '#e85555',
  Supervisor: '#2d7ef0',
  Técnico: '#0eb88a',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: '#0a0f1a',
  border: '1px solid #1e2e4a', borderRadius: 8, color: '#e8edf5',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#4a5a7a',
  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, display: 'block',
};

export default function LoginPage() {
  const { users, loadAll, setCurrentUser } = useAppStore();

  useEffect(() => {
    loadAll(); // Carrega os dados da API ao abrir a página
  }, [loadAll]);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [credErr, setCredErr] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Tratamento de login.
   * Verifica se o e-mail e senha inseridos correspondem a um usuário ativo.
   * Se sim, atualiza o estado do usuário logado e aguarda 400ms antes de atualizar a tela.
   * Se não, mostra um erro de credencial inválida.
   */
  function handleLogin() {
    setCredErr('');

    // ADICIONE ESTA LINHA:
    if (!users) return;

    const user = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
        && u.senha === senha
        && u.status === 'Ativo'
    );

    if (!user) { setCredErr('E-mail ou senha incorretos.'); return; }
    setLoading(true);
    setTimeout(() => { setCurrentUser(user); setLoading(false); }, 400);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>

      {/* fundo decorativo */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,126,240,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,216,216,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 420, padding: '0 20px' }}>

        {/* logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #2d7ef0, #0dd8d8)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 32px rgba(45,126,240,0.3)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.136 12.006a8.25 8.25 0 0 1 13.728 0M2 8.974a12 12 0 0 1 20 0" />
              <circle cx="12" cy="19" r="1.5" fill="white" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8edf5', margin: 0, letterSpacing: '-0.5px' }}>SMRA</h1>
          <p style={{ fontSize: 12, color: '#4a5a7a', marginTop: 5 }}>Sistema de Monitoramento de Rede e Ativações</p>
        </div>

        {/* card */}
        <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 14, padding: '30px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e8edf5', margin: '0 0 4px' }}>Acesso ao sistema</h2>
          <p style={{ fontSize: 12, color: '#4a5a7a', margin: '0 0 24px' }}>Informe seu e-mail e senha para continuar.</p>

          {/* e-mail */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>E-mail</label>
            <input
              type="email" placeholder="seu@email.com" value={email}
              onChange={e => { setEmail(e.target.value); setCredErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inputStyle} autoComplete="email"
              onFocus={e => (e.target.style.borderColor = '#2d7ef0')}
              onBlur={e => (e.target.style.borderColor = '#1e2e4a')}
            />
          </div>

          {/* senha */}
          <div style={{ marginBottom: credErr ? 12 : 24 }}>
            <label style={labelStyle}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={senha}
                onChange={e => { setSenha(e.target.value); setCredErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ ...inputStyle, paddingRight: 44 }} autoComplete="current-password"
                onFocus={e => (e.target.style.borderColor = '#2d7ef0')}
                onBlur={e => (e.target.style.borderColor = '#1e2e4a')}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5a7a', padding: 2, display: 'flex' }}>
                {showPwd
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                }
              </button>
            </div>
          </div>

          {/* erro */}
          {credErr && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#e8555518', border: '1px solid #e8555540', borderRadius: 8, fontSize: 12, color: '#e85555', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {credErr}
            </div>
          )}

          {/* botão */}
          <button type="button" onClick={handleLogin} disabled={!email || !senha || loading}
            style={{ width: '100%', padding: '13px', background: (email && senha && !loading) ? 'linear-gradient(135deg, #2d7ef0, #1a5fc4)' : '#1e2e4a', color: (email && senha && !loading) ? '#fff' : '#4a5a7a', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: (email && senha && !loading) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
            {loading
              ? 'Entrando…'
              : (<>Entrar <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg></>)
            }
          </button>

          {/* atalhos de teste */}
          <div style={{ marginTop: 24, borderTop: '1px solid #1e2e4a', paddingTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2a3a5a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Acesso rápido (dev)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {users?.filter(u => u.status === 'Ativo').map(u => (
                <button key={u.id} type="button"
                  onClick={() => { setEmail(u.email); setSenha(u.senha); setCredErr(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'transparent', border: '1px solid #1e2e4a', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = roleColors[u.nivel] + '60')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e2e4a')}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: roleColors[u.nivel] + '20', color: roleColors[u.nivel], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                    {u.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e8edf5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nome}</div>
                    <div style={{ fontSize: 10, color: '#4a5a7a' }}>{u.nivel} · {u.email}</div>
                  </div>
                  <div style={{ fontSize: 10, color: roleColors[u.nivel], fontWeight: 700, flexShrink: 0 }}>{u.uf}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#1e2e4a', marginTop: 20 }}>SMRA v1.0 · Uso interno</p>
      </div>
    </div>
  );
}