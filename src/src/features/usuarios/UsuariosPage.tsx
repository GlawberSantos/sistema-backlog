// src/features/usuarios/UsuariosPage.tsx
import { useState } from 'react';
import { useAppStore, User } from '../../store/useAppStore';
import { Badge } from '../../components/ui/Badge';

export default function UsuariosPage() {
  const { users, setCurrentUser, addUser, updateUser, deleteUser } = useAppStore();
  const [form, setForm] = useState<Partial<User>>({
    nome: '', email: '', senha: '', nivel: 'Técnico', uf: '', status: 'Ativo'
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha) return;

    if (editingId) {
      updateUser(editingId, {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        nivel: form.nivel as User['nivel'],
        uf: form.uf || '',
        status: form.status as User['status'],
      });
    } else {
      const newUser: User = {
        id: Date.now(),
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        nivel: form.nivel as any,
        uf: form.uf || '',
        status: form.status as any
      };
      addUser(newUser);
    }
    setForm({ nome: '', email: '', senha: '', nivel: 'Técnico', uf: '', status: 'Ativo' });
    setEditingId(null);
  };

  const nivelPillClass = (nivel: User['nivel']) =>
    nivel === 'Administrador' ? 'type-alteracao' : nivel === 'Supervisor' ? 'type-construcao' : 'type-ativacao';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
      {/* Lista de Usuários */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="panel-header">
          <h2 className="panel-title">Usuários Cadastrados</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Nível</th>
                <th>UF</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="td-primary">{user.nome}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`type-pill ${nivelPillClass(user.nivel)}`}>{user.nivel}</span>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{user.uf}</td>
                  <td>
                    <Badge status={user.status}>{user.status}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                      <button
                        onClick={() => {
                          setEditingId(user.id);
                          setForm({
                            nome: user.nome,
                            email: user.email,
                            nivel: user.nivel,
                            uf: user.uf,
                            status: user.status,
                          });
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Excluir este usuário?')) {
                            deleteUser(user.id);
                          }
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => setCurrentUser(user)}
                        className="btn btn-ghost btn-sm"
                      >
                        Entrar como
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{editingId ? 'Editar Usuário' : 'Adicionar Usuário'}</span>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                className="form-input"
                required
                placeholder="Nome do usuário"
              />
            </div>
            <div>
              <label className="form-label">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="form-input"
                required
                placeholder="email@empresa.com"
              />
            </div>
            <div>
              <label className="form-label">Senha</label>
              <input
                type="text"
                value={form.senha}
                onChange={e => setForm({ ...form, senha: e.target.value })}
                className="form-input"
                required
                placeholder="Senha de acesso"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="form-label">Nível</label>
                <select
                  value={form.nivel}
                  onChange={e => setForm({ ...form, nivel: e.target.value as any })}
                  className="form-input form-select"
                >
                  <option>Administrador</option>
                  <option>Supervisor</option>
                  <option>Técnico</option>
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="form-input form-select"
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">UF(s)</label>
              <input
                type="text"
                value={form.uf}
                onChange={e => setForm({ ...form, uf: e.target.value })}
                placeholder="Ex: PE, BA, CE"
                className="form-input"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
              <button type="submit" className="btn btn-primary flex-1">
                {editingId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
              <button
                type="button"
                onClick={() => { setForm({ nome: '', email: '', senha: '', nivel: 'Técnico', uf: '', status: 'Ativo' }); setEditingId(null); }}
                className="btn btn-ghost"
              >
                Limpar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}