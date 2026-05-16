import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  buscarOrdemServico,
  atualizarOrdemServico,
  adicionarObservacao,
  listarTecnicos,
} from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Plus, MessageSquare, User, MapPin, Wrench, Calendar, Clock } from 'lucide-react';

const getStatusColor = (status) => {
  const cores = {
    'AC': 'bg-gray-100 text-gray-800',
    'Falta RFB': 'bg-blue-100 text-blue-800',
    'Faturado': 'bg-yellow-100 text-yellow-800',
    'Pend Cliente / Comercial': 'bg-orange-100 text-orange-800',
    'Tecnica': 'bg-green-100 text-green-800',
    'Versionado': 'bg-red-100 text-red-800',
    'Aberto': 'bg-purple-100 text-purple-800',
  };
  return cores[status] || 'bg-gray-100 text-gray-800';
};

const getPrioridadeColor = (prioridade) => {
  const cores = {
    'Urgente': 'bg-red-500',
    'Alta': 'bg-orange-500',
    'Normal': 'bg-blue-500',
    'Baixa': 'bg-gray-400',
  };
  return cores[prioridade] || 'bg-gray-400';
};

function DetalhesOrdem() {
  const { id } = useParams();
  const { user } = useAuth(); // Using context
  const [ordem, setOrdem] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState('');
  const [sucessoGeral, setSucessoGeral] = useState('');
  const [erroObs, setErroObs] = useState('');
  const [adicionandoObs, setAdicionandoObs] = useState(false);
  const [novaObs, setNovaObs] = useState('');
  const [form, setForm] = useState(null);

  const podeEditar = ['Administrador', 'Supervisor'].includes(user?.tipo_usuario);

  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregando(true);
        const [ordemData, tecnicosData] = await Promise.all([
          buscarOrdemServico(id),
          podeEditar ? listarTecnicos() : Promise.resolve([]),
        ]);
        setOrdem(ordemData);
        setTecnicos(tecnicosData);
        setForm({
          status: ordemData.status || '',
          prioridade: ordemData.prioridade || 'Normal',
          tecnico_responsavel: ordemData.tecnico_responsavel || '',
          prazo: ordemData.prazo ? ordemData.prazo.split('T')[0] : '',
          cliente: ordemData.cliente || '',
          endereco: ordemData.endereco || '',
          bairro: ordemData.bairro || '',
          cidade: ordemData.cidade || '',
          tipo_servico: ordemData.tipo_servico || '',
        });
      } catch (error) {
        console.error('Erro ao carregar ordem:', error);
        setErroGeral('Erro ao carregar os dados da ordem.');
      } finally {
        setCarregando(false);
      }
    };
    if (id) carregar();
  }, [id, podeEditar]);

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErroGeral('');
    setSucessoGeral('');
    setSalvando(true);
    try {
      const payload = { ...form };
      if (payload.tecnico_responsavel === '') payload.tecnico_responsavel = null;
      if (!payload.prazo) delete payload.prazo;
      
      const { rows } = await atualizarOrdemServico(id, payload);
      const osAtualizada = await buscarOrdemServico(id);
      setOrdem(osAtualizada);
      setSucessoGeral('Ordem atualizada com sucesso.');
      setTimeout(() => setSucessoGeral(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      setErroGeral(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao atualizar a ordem.'
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleAdicionarObservacao = async (e) => {
    e.preventDefault();
    if (!novaObs.trim()) return;
    setErroObs('');
    setAdicionandoObs(true);
    try {
      await adicionarObservacao(id, novaObs.trim());
      const osAtualizada = await buscarOrdemServico(id); // Re-fetch to get all updates
      setOrdem(osAtualizada);
      setNovaObs('');
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      setErroObs(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao adicionar observação.'
      );
    } finally {
      setAdicionandoObs(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!ordem || !form) {
    return (
      <div className="space-y-4">
        <Link to="/backlog" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition">
          <ArrowLeft size={20} /> Voltar
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {erroGeral || 'Ordem não encontrada.'}
        </div>
      </div>
    );
  }

  const observacoes = ordem.observacoes || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/backlog"
          className="flex items-center text-gray-500 hover:text-primary-600 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 truncate">
            OS: {ordem.numero_os}
          </h1>
          <p className="text-sm text-gray-500">{ordem.cliente}</p>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(ordem.status)}`}>
          {ordem.status}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Informações da Ordem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <User size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="text-sm font-medium text-gray-800">{ordem.cliente || '-'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Endereço</p>
              <p className="text-sm font-medium text-gray-800">
                {[ordem.endereco, ordem.bairro, ordem.cidade].filter(Boolean).join(', ') || '-'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Wrench size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Tipo de Serviço</p>
              <p className="text-sm font-medium text-gray-800">{ordem.tipo_servico || '-'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getPrioridadeColor(ordem.prioridade)}`} />
            <div>
              <p className="text-xs text-gray-500">Prioridade</p>
              <p className="text-sm font-medium text-gray-800">{ordem.prioridade || '-'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Técnico Responsável</p>
              <p className="text-sm font-medium text-gray-800">{ordem.tecnico_nome || 'Não atribuído'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Data de Abertura</p>
              <p className="text-sm font-medium text-gray-800">
                {ordem.data_abertura ? new Date(ordem.data_abertura).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Prazo</p>
              <p className="text-sm font-medium text-gray-800">
                {ordem.prazo ? new Date(ordem.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(podeEditar || user?.tipo_usuario === 'Técnico') && (
        <form onSubmit={handleSalvar} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Atualizar Ordem</h2>

          {erroGeral && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erroGeral}</div>}
          {sucessoGeral && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{sucessoGeral}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {podeEditar && <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input type="text" value={form.cliente} onChange={(e) => handleChange('cliente', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"/>
              </div>
              {/* Other admin/supervisor fields */}
            </>}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="Aberto">Aberto</option>
                <option value="Falta RFB">Falta RFB</option>
                <option value="Faturado">Faturado</option>
                <option value="Pend Cliente / Comercial">Pend Cliente / Comercial</option>
                <option value="Tecnica">Tecnica</option>
                 <option value="Versionado">Versionado</option>
              </select>
            </div>
             {podeEditar && <>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Técnico Responsável</label>
                  <select value={form.tecnico_responsavel} onChange={(e) => handleChange('tecnico_responsavel', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="">Nenhum</option>
                    {tecnicos.map(tec => <option key={tec.id} value={tec.id}>{tec.nome}</option>)}
                  </select>
                </div>
             </>}
            
          </div>
           <div className="md:col-span-2 flex justify-end mt-4">
              <button type="submit" disabled={salvando} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-60">
                <Save size={18} />
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-gray-500" />
          Observações <span className="text-sm font-normal text-gray-400">({observacoes.length})</span>
        </h2>
        <div className="space-y-3 mb-6">
          {observacoes.length > 0 ? observacoes.map(obs => (
            <div key={obs.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{obs.observacao}</p>
              <p className="text-xs text-gray-400 mt-1">{obs.usuario_nome} · {new Date(obs.data).toLocaleString('pt-BR')}</p>
            </div>
          )) : <p className="text-sm text-gray-400 italic">Nenhuma observação registrada.</p>}
        </div>
        <form onSubmit={handleAdicionarObservacao} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Nova Observação</label>
          {erroObs && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{erroObs}</div>}
          <textarea
            value={novaObs}
            onChange={(e) => setNovaObs(e.target.value)}
            rows={3}
            placeholder="Digite uma observação..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div className="flex justify-end">
            <button type="submit" disabled={adicionandoObs || !novaObs.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
              <Plus size={18} />
              {adicionandoObs ? 'Adicionando...' : 'Adicionar Observação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DetalhesOrdem;
