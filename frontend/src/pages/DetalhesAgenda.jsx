import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  buscarAgenda, atualizarItemAgenda,
  uploadFotosAgenda, deletarFotoAgenda, deletarItemAgenda
} from '../services/apiService';
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle,
  Camera, Trash2, ChevronDown, ChevronUp, Save
} from 'lucide-react';

const STATUS_OPTS = ['PENDENTE', 'EM ANDAMENTO', 'Tecnica COM SUCESSO', 'Tecnica COM PENDÊNCIA', 'NÃO REALIZADO'];

const STATUS_COLOR = {
  'PENDENTE': 'bg-gray-100 text-gray-700',
  'EM ANDAMENTO': 'bg-yellow-100 text-yellow-800',
  'Tecnica COM SUCESSO': 'bg-green-100 text-green-800',
  'Tecnica COM PENDÊNCIA': 'bg-orange-100 text-orange-800',
  'NÃO REALIZADO': 'bg-red-100 text-red-800',
};

function ItemAgenda({ item, usuario, onAtualizado }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ ...item });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [fotos, setFotos] = useState(item.fotos || []);
  const fileRef = useRef();

  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const salvar = async () => {
    setSalvando(true);
    try {
      const atualizado = await atualizarItemAgenda(item.id, form);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
      onAtualizado(atualizado);
    } catch (err) {
      alert('Erro ao salvar: ' + (err?.response?.data?.error || err.message));
    } finally {
      setSalvando(false);
    }
  };

  const handleFotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadando(true);
    try {
      const novas = await uploadFotosAgenda(item.id, files);
      setFotos(prev => [...prev, ...novas]);
    } catch (err) {
      alert('Erro ao enviar foto: ' + (err?.response?.data?.error || err.message));
    } finally {
      setUploadando(false);
      e.target.value = '';
    }
  };

  const removerFoto = async (foto_id) => {
    if (!confirm('Remover esta foto?')) return;
    try {
      await deletarFotoAgenda(foto_id);
      setFotos(prev => prev.filter(f => f.id !== foto_id));
    } catch { alert('Erro ao remover foto.'); }
  };

  const podeEditar = ['Administrador', 'Supervisor', 'Técnico'].includes(usuario?.tipo_usuario);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono font-bold text-primary-700 text-sm shrink-0">{item.pedido_id}</span>
          {item.cliente && <span className="text-sm text-gray-700 truncate">{item.cliente}</span>}
          {item.cidade && <span className="text-xs text-gray-500 hidden sm:inline">· {item.cidade}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[form.status_servico] || 'bg-gray-100 text-gray-600'}`}>
            {form.status_servico}
          </span>
          {aberto ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {aberto && (
        <div className="p-4 space-y-5 border-t border-gray-100">
          {/* Identificação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ID Pedido" value={item.pedido_id} readOnly />
            <Field label="ID Draft" value={form.id_draft} onChange={v => set('id_draft', v)} readOnly={!podeEditar} />
            <Field label="Empresa Responsável" value={form.empresa_responsavel} onChange={v => set('empresa_responsavel', v)} readOnly={!podeEditar} />
            <Field label="Cliente" value={form.cliente} onChange={v => set('cliente', v)} readOnly={!podeEditar} />
            <Field label="Endereço" value={form.endereco} onChange={v => set('endereco', v)} readOnly={!podeEditar} className="sm:col-span-2" />
            <Field label="Cidade" value={form.cidade} onChange={v => set('cidade', v)} readOnly={!podeEditar} />
            <Field label="Serviço" value={form.servico} onChange={v => set('servico', v)} readOnly={!podeEditar} />
            <Field label="Site" value={form.site} onChange={v => set('site', v)} readOnly={!podeEditar} />
          </div>

          {/* Booleanos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CheckField label="Alteração de Projeto" value={form.alteracao_projeto} onChange={v => set('alteracao_projeto', v)} disabled={!podeEditar} />
            <CheckField label="Alteração de CTO / SP / Site" value={form.alteracao_cto} onChange={v => set('alteracao_cto', v)} disabled={!podeEditar} />
            <CheckField label="Abordagem" value={form.abordagem} onChange={v => set('abordagem', v)} disabled={!podeEditar} />
          </div>

          {/* Rede */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Informações de Rede</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="DGO" value={form.dgo} onChange={v => set('dgo', v)} readOnly={!podeEditar} />
              <Field label="FO" value={form.fo} onChange={v => set('fo', v)} readOnly={!podeEditar} />
              <Field label="Rede Lançada" value={form.rede_lancada} onChange={v => set('rede_lancada', v)} readOnly={!podeEditar} />
              <Field label="Rede Interna" value={form.rede_interna} onChange={v => set('rede_interna', v)} readOnly={!podeEditar} />
              <Field label="Rede Existente" value={form.rede_existente} onChange={v => set('rede_existente', v)} readOnly={!podeEditar} />
              <Field label="Enlace Total" value={form.enlace_total} onChange={v => set('enlace_total', v)} readOnly={!podeEditar} />
            </div>
          </div>

          {/* Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Responsável no Local" value={form.responsavel_local} onChange={v => set('responsavel_local', v)} readOnly={!podeEditar} />
            <Field label="Contato" value={form.contato_local} onChange={v => set('contato_local', v)} readOnly={!podeEditar} />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status do Serviço</label>
            <select
              value={form.status_servico}
              onChange={e => set('status_servico', e.target.value)}
              disabled={!podeEditar}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm disabled:bg-gray-50"
            >
              {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={form.observacoes || ''}
              onChange={e => set('observacoes', e.target.value)}
              rows={3}
              readOnly={!podeEditar}
              placeholder="Registre observações do campo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm disabled:bg-gray-50 resize-none"
            />
          </div>

          {/* Fotos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Fotos ({fotos.length})</p>
              {podeEditar && (
                <>
                  <button
                    onClick={() => fileRef.current.click()}
                    disabled={uploadando}
                    className="flex items-center gap-1 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    <Camera size={15} />
                    {uploadando ? 'Enviando...' : 'Anexar fotos'}
                  </button>
                  <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFotos} />
                </>
              )}
            </div>
            {fotos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {fotos.map(foto => (
                  <div key={foto.id} className="relative group aspect-square">
                    <img
                      src={`http://localhost:3001${foto.caminho}`}
                      alt={foto.nome_arquivo}
                      className="w-full h-full object-cover rounded border border-gray-200"
                    />
                    {podeEditar && (
                      <button
                        onClick={() => removerFoto(foto.id)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Nenhuma foto anexada.</p>
            )}
          </div>

          {/* Botão salvar */}
          {podeEditar && (
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={salvar}
                disabled={salvando}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 ${
                  salvo ? 'bg-green-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {salvo ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, readOnly, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 read-only:bg-gray-50 read-only:text-gray-600"
      />
    </div>
  );
}

function CheckField({ label, value, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer select-none text-sm ${value ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
      <input
        type="checkbox"
        checked={!!value}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="accent-primary-600"
      />
      {label}
    </label>
  );
}

function DetalhesAgenda({ usuario }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregar(); }, [id]);

  const carregar = async () => {
    setCarregando(true);
    try {
      const data = await buscarAgenda(id);
      setAgenda(data);
    } catch { navigate('/agenda'); }
    finally { setCarregando(false); }
  };

  const onItemAtualizado = (atualizado) => {
    setAgenda(prev => ({
      ...prev,
      itens: prev.itens.map(i => i.id === atualizado.id ? { ...i, ...atualizado } : i)
    }));
  };

  if (carregando) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  if (!agenda) return null;

  const total = agenda.itens?.length || 0;
  const concluidos = agenda.itens?.filter(i => i.status_servico?.startsWith('Tecnica')).length || 0;
  const pendentes = agenda.itens?.filter(i => i.status_servico === 'PENDENTE').length || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/agenda')} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{agenda.tecnico_nome}</h1>
          <p className="text-sm text-gray-500">
            {new Date(agenda.data_agenda + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            {agenda.equipe ? ` · ${agenda.equipe}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{concluidos}</p>
          <p className="text-xs text-gray-500 mt-1">Tecnicas</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{pendentes}</p>
          <p className="text-xs text-gray-500 mt-1">Pendentes</p>
        </div>
      </div>

      <div className="space-y-3">
        {(!agenda.itens || agenda.itens.length === 0) ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Nenhum pedido nesta agenda.
          </div>
        ) : (
          agenda.itens.map(item => (
            <ItemAgenda
              key={item.id}
              item={item}
              usuario={usuario}
              onAtualizado={onItemAtualizado}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default DetalhesAgenda;
