import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarTecnicos, criarAgenda, buscarPedidoNaBase, listarAgendas } from '../services/apiService';
import { CalendarPlus, Trash2, Search, ChevronRight, Calendar } from 'lucide-react';

function AgendaDia() {
  const navigate = useNavigate();
  const [tecnicos, setTecnicos] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [dataAgenda, setDataAgenda] = useState(() => new Date().toISOString().split('T')[0]);
  const [tecnicoNome, setTecnicoNome] = useState('');
  const [equipe, setEquipe] = useState('');
  const [inputPedidos, setInputPedidos] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    listarTecnicos().then(setTecnicos).catch(console.error);
    carregarAgendas();
  }, [dataAgenda]);

  const carregarAgendas = () => {
    listarAgendas({ data: dataAgenda }).then(setAgendas).catch(console.error);
  };

  const handleAdicionarPedidos = async () => {
    const ids = inputPedidos
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (ids.length === 0) return;
    setBuscando(true);

    const novos = [];
    for (const id of ids) {
      if (pedidos.find(p => p.pedido_id === id)) continue;
      try {
        const dados = await buscarPedidoNaBase(id);
        novos.push({
          pedido_id: id,
          cliente: dados.cliente || '',
          endereco: dados.endereco || '',
          cidade: dados.cidade || '',
          servico: dados.servico || '',
          encontrado: dados.encontrado
        });
      } catch {
        novos.push({ pedido_id: id, cliente: '', endereco: '', cidade: '', servico: '', encontrado: false });
      }
    }

    setPedidos(prev => [...prev, ...novos]);
    setInputPedidos('');
    setBuscando(false);
  };

  const removerPedido = (pedido_id) => {
    setPedidos(prev => prev.filter(p => p.pedido_id !== pedido_id));
  };

  const handleSalvar = async () => {
    setErro('');
    setSucesso('');
    
    if (!dataAgenda) {
      setErro('Selecione a data.');
      return;
    }
    
    if (!tecnicoNome) {
      setErro('Digite o nome do técnico.');
      return;
    }
    
    if (pedidos.length === 0) {
      setErro('Adicione ao menos um pedido.');
      return;
    }
    
    if (!equipe) {
      setErro('Selecione a equipe/empresa responsável.');
      return;
    }
    
    setSalvando(true);
    try {
      const resultado = await criarAgenda({
        data_agenda: dataAgenda,
        tecnico_nome: tecnicoNome,
        equipe,
        pedidos
      });
      setSucesso(`Agenda criada! ${resultado.inseridos} pedido(s) adicionado(s).${resultado.erros?.length ? ` (${resultado.erros.length} duplicado(s) ignorado(s))` : ''}`);
      setPedidos([]);
      setEquipe('');
      setTecnicoNome('');
      carregarAgendas();
    } catch (err) {
      setErro(err?.response?.data?.error || 'Erro ao salvar agenda.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <CalendarPlus size={26} className="text-primary-600" />
        Agenda Técnica
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário nova agenda */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-base">Nova agenda do dia</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                value={dataAgenda}
                onChange={e => setDataAgenda(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
              <input
                type="text"
                value={tecnicoNome}
                onChange={e => setTecnicoNome(e.target.value)}
                placeholder="Digite o nome do técnico..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipe / Empresa Responsável</label>
            <select
              value={equipe}
              onChange={e => setEquipe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione...</option>
              <option value="VIVO">VIVO</option>
              <option value="ICOMON">ICOMON</option>
              <option value="R2 TELECOM">R2 TELECOM</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IDs dos Pedidos
              <span className="text-gray-400 font-normal ml-1">(um por linha ou separado por vírgula)</span>
            </label>
            <textarea
              value={inputPedidos}
              onChange={e => setInputPedidos(e.target.value)}
              rows={5}
              placeholder="1944274&#10;1-850355258283&#10;2123828&#10;..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            />
            <button
              onClick={handleAdicionarPedidos}
              disabled={buscando || !inputPedidos.trim()}
              className="mt-2 flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 text-sm"
            >
              <Search size={16} />
              {buscando ? 'Buscando...' : 'Adicionar pedidos'}
            </button>
          </div>

          {pedidos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{pedidos.length} pedido(s) na lista:</p>
              <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {pedidos.map(p => (
                  <div key={p.pedido_id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                    <div className="min-w-0">
                      <span className={`font-mono font-medium ${p.encontrado ? 'text-primary-700' : 'text-gray-600'}`}>
                        {p.pedido_id}
                      </span>
                      {p.cliente && <span className="text-gray-500 ml-2 truncate">{p.cliente}</span>}
                      {!p.encontrado && <span className="text-amber-600 ml-1 text-xs">(não importado)</span>}
                    </div>
                    <button onClick={() => removerPedido(p.pedido_id)} className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{erro}</p>}
          {sucesso && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded">{sucesso}</p>}

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar Agenda'}
          </button>
        </div>

        {/* Agendas do dia selecionado */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <h2 className="font-semibold text-gray-700 text-base flex items-center gap-2">
            <Calendar size={18} className="text-primary-600" />
            Agendas de {new Date(dataAgenda + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h2>

          {agendas.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhuma agenda para esta data.</p>
          ) : (
            <div className="space-y-2">
              {agendas.map(a => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/agenda/${a.id}`)}
                  className="w-full flex items-center justify-between bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 rounded-lg px-4 py-3 transition"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{a.tecnico_nome}</p>
                    <p className="text-xs text-gray-500">
                      {a.total_itens} pedido(s){a.equipe ? ` · ${a.equipe}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgendaDia;
