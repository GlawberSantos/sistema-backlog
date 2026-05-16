import { useState, useEffect } from 'react';
import { listarUsuarios, criarUsuario, atualizarUsuario, deletarUsuario } from '../services/apiService';
import { Plus, Pencil, Trash2, X, Save, Users } from 'lucide-react';

const FORM_INICIAL = {
  nome: '',
  email: '',
  senha: '',
  tipo_usuario: 'Técnico',
  uf: '',
};

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setCarregando(true);
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuarios:', error);
      setErro('Erro ao carregar usuarios.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalCriacao = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErroModal('');
    setModalAberto(true);
  };

  const abrirModalEdicao = (usuario) => {
    setEditando(usuario);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      tipo_usuario: usuario.tipo_usuario,
      uf: usuario.uf || '',
    });
    setErroModal('');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setForm(FORM_INICIAL);
    setErroModal('');
  };

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroModal('');
    setSalvando(true);
    try {
      if (editando) {
        const payload = { nome: form.nome, email: form.email, tipo_usuario: form.tipo_usuario, uf: form.uf };
        if (form.senha) payload.senha = form.senha;
        await atualizarUsuario(editando.id, payload);
      } else {
        await criarUsuario(form);
      }
      fecharModal();
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuario:', error);
      setErroModal(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao salvar usuario. Verifique os campos e tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (usuario) => {
    if (!window.confirm(`Deseja realmente deletar o usuario "${usuario.nome}"?`)) return;
    try {
      await deletarUsuario(usuario.id);
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao deletar usuario:', error);
      alert(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao deletar usuario.'
      );
    }
  };

  const getTipoColor = (tipo) => {
    const cores = {
      'Administrador': 'bg-red-100 text-red-800',
      'Supervisor': 'bg-blue-100 text-blue-800',
      'Tecnico': 'bg-green-100 text-green-800',
    };
    return cores[tipo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">Gestao de Usuarios</h1>
        </div>
        <button
          onClick={abrirModalCriacao}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <Plus size={20} />
          <span>Novo Usuario</span>
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {erro}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {carregando ? (
          <div className="p-8 text-center text-gray-600">Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Nenhum usuario cadastrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{usuario.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{usuario.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTipoColor(usuario.tipo_usuario)}`}>
                        {usuario.tipo_usuario}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirModalEdicao(usuario)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletar(usuario)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Deletar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {editando ? 'Editar Usuario' : 'Novo Usuario'}
              </h2>
              <button
                onClick={fecharModal}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {erroModal && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {erroModal}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  required
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {!editando && <span className="text-red-500">*</span>}
                  {editando && <span className="text-gray-400 text-xs ml-1">(deixe em branco para manter a atual)</span>}
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => handleChange('senha', e.target.value)}
                  required={!editando}
                  placeholder={editando ? 'Nova senha (opcional)' : 'Senha'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuario <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.tipo_usuario}
                  onChange={(e) => handleChange('tipo_usuario', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Técnico">Técnico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  value={form.uf}
                  onChange={(e) => handleChange('uf', e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
