import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listarTecnicos, criarOrdemServico } from '../services/apiService';
import { ArrowLeft, Save } from 'lucide-react';

function NovaOrdem() {
  const navigate = useNavigate();
  const [tecnicos, setTecnicos] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    numero_os: '',
    cliente: '',
    endereco: '',
    bairro: '',
    cidade: '',
    tipo_servico: '',
    prioridade: 'Normal',
    status: 'AC',
    tecnico_responsavel: '',
    data_abertura: '',
    prazo: '',
  });

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await listarTecnicos();
        setTecnicos(data);
      } catch (error) {
        console.error('Erro ao carregar técnicos:', error);
      }
    };
    carregar();
  }, []);

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const payload = { ...form };
      if (!payload.tecnico_responsavel) delete payload.tecnico_responsavel;
      if (!payload.data_abertura) delete payload.data_abertura;
      if (!payload.prazo) delete payload.prazo;
      await criarOrdemServico(payload);
      navigate('/backlog');
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      setErro(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao criar ordem de serviço. Verifique os campos e tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/backlog"
          className="flex items-center text-gray-500 hover:text-primary-600 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nova Ordem de Serviço</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero OS <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.numero_os}
              onChange={(e) => handleChange('numero_os', e.target.value)}
              required
              placeholder="Ex: OS-2024-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.cliente}
              onChange={(e) => handleChange('cliente', e.target.value)}
              required
              placeholder="Nome do cliente"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereco
            </label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => handleChange('endereco', e.target.value)}
              placeholder="Rua, numero, complemento"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bairro
            </label>
            <input
              type="text"
              value={form.bairro}
              onChange={(e) => handleChange('bairro', e.target.value)}
              placeholder="Bairro"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => handleChange('cidade', e.target.value)}
              placeholder="Cidade"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Servico <span className="text-red-500">*</span>
            </label>
            <select
              value={form.tipo_servico}
              onChange={(e) => handleChange('tipo_servico', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecione...</option>
              <option value="Ativação">Ativação</option>
              <option value="Construção de rede">Construção de rede</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Preventiva">Preventiva</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade <span className="text-red-500">*</span>
            </label>
            <select
              value={form.prioridade}
              onChange={(e) => handleChange('prioridade', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Baixa">Baixa</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="AC">AC</option>
              <option value="Falta RFB">Falta RFB</option>
              <option value="Faturado">Faturado</option>
              <option value="Pend Cliente / Comercial">Pend Cliente / Comercial</option>
              <option value="Tecnica">Tecnica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tecnico Responsavel
            </label>
            <select
              value={form.tecnico_responsavel}
              onChange={(e) => handleChange('tecnico_responsavel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Nenhum</option>
              {tecnicos.map(tec => (
                <option key={tec.id} value={tec.id}>{tec.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Abertura
            </label>
            <input
              type="date"
              value={form.data_abertura}
              onChange={(e) => handleChange('data_abertura', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prazo
            </label>
            <input
              type="date"
              value={form.prazo}
              onChange={(e) => handleChange('prazo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/backlog"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {salvando ? 'Salvando...' : 'Criar Ordem'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovaOrdem;
