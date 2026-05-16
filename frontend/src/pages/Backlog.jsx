import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listarOrdensServico, listarUfs } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { Plus, Filter } from 'lucide-react';

function Backlog() {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState([]);
  const [ufs, setUfs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({
    status: '',
    uf: '',
    tipo_servico: '',
    cidade: '',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    carregarUfs();
    carregarOrdens(filtros);
  }, []);

  const carregarUfs = async () => {
    try {
      const data = await listarUfs();
      setUfs(data);
    } catch (error) {
      console.error('Erro ao carregar UFs:', error);
    }
  };

  const carregarOrdens = async (filtrosAtuais) => {
    try {
      setCarregando(true);
      const filtrosLimpos = {};
      Object.keys(filtrosAtuais).forEach(key => {
        if (filtrosAtuais[key]) {
          filtrosLimpos[key] = filtrosAtuais[key];
        }
      });
      const data = await listarOrdensServico(filtrosLimpos);
      setOrdens(data);
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = () => {
    carregarOrdens(filtros);
  };

  const limparFiltros = () => {
    const filtrosVazios = {
      status: '',
      uf: '',
      tipo_servico: '',
      cidade: '',
    };
    setFiltros(filtrosVazios);
    carregarOrdens(filtrosVazios);
  };

  const getStatusColor = (status) => {
    const cores = {
      'Cancelado': 'bg-red-100 text-red-800',
      'Falta RFB': 'bg-blue-100 text-blue-800',
      'Faturado': 'bg-orange-100 text-orange-800',
      'Pend Cliente / Comercial': 'bg-yellow-100 text-yellow-800',
      'Tecnica': 'bg-green-100 text-green-800',
      'Versionado': 'bg-gray-100 text-gray-800',
    };
    return cores[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade) => {
    const cores = {
      'Urgente': 'bg-red-500',
      'Alta': 'bg-orange-500',
      'Normal': 'bg-blue-500',
      'Baixa': 'bg-gray-500',
    };
    return cores[prioridade] || 'bg-gray-500';
  };

  const podeEditarOrdem = () => {
    return ['Administrador', 'Supervisor'].includes(user?.tipo_usuario);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Backlog</h1>

        {podeEditarOrdem() && (
          <Link
            to="/nova-ordem"
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} />
            <span>Nova Ordem</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
        >
          <Filter size={20} />
          <span>Filtros</span>
        </button>

        {mostrarFiltros && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>
              <select
                value={filtros.tipo_servico}
                onChange={(e) => handleFiltroChange('tipo_servico', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="Ativação">Ativação</option>
                <option value="Construção de rede">Construção de rede</option>
                <option value="Reparo">Reparo</option>
                <option value="Preventiva">Preventiva</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
              <select
                value={filtros.uf}
                onChange={(e) => handleFiltroChange('uf', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={filtros.cidade}
                onChange={(e) => handleFiltroChange('cidade', e.target.value)}
                placeholder="Digite a cidade"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filtros.status}
                onChange={(e) => handleFiltroChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Falta RFB">Falta RFB</option>
                <option value="Faturado">Faturado</option>
                <option value="Pend Cliente / Comercial">Pend Cliente / Comercial</option>
                <option value="Tecnica">Tecnica</option>
                <option value="Versionado">Versionado</option>
              </select>
            </div>
            <div className="col-span-full flex space-x-2">
              <button
                onClick={aplicarFiltros}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={limparFiltros}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {carregando ? (
          <div className="p-8 text-center text-gray-600">Carregando...</div>
        ) : ordens.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Nenhuma ordem encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UF</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ordens.map((ordem) => (
                  <tr key={ordem.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/ordem/${ordem.id}`} className="text-primary-600 hover:underline font-medium">
                        {ordem.numero_os}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{ordem.cliente}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{ordem.tipo_servico}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{ordem.tecnico_uf || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{ordem.tecnico_nome || 'Não atribuído'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-3 h-3 rounded-full ${getPrioridadeColor(ordem.prioridade)}`} title={ordem.prioridade}></span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ordem.status)}`}>
                        {ordem.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {ordem.prazo ? new Date(ordem.prazo).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Backlog;
