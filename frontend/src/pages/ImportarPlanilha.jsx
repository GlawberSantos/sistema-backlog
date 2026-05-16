import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { importarPlanilha } from '../services/apiService';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Eye, Send, Trash2 } from 'lucide-react';

const COLUNAS_PREVIEW = ['numero_os', 'cliente', 'cidade', 'tipo_servico', 'status', 'data_abertura', 'prazo'];

// Mapeamento: campo interno -> colunas aceitas (normalizadas, sem acento, lowercase)
const MAPA_COLUNAS = {
  numero_os:    ['pedido', 'numero_os', 'numero os', 'os', 'num_os', 'id_vantive', 'id vantive'],
  cliente:      ['cliente', 'client', 'nome_cliente', 'nome cliente'],
  endereco:     ['endereco_completo', 'endereco', 'endereço', 'end', 'address'],
  bairro:       ['bairro', 'district'],
  cidade:       ['cidade', 'city', 'cidadegpon'],
  tipo_servico: ['servico', 'serviço', 'tipo_servico', 'tipo servico', 'produto_star', 'produto'],
  prioridade:   ['prioridade', 'priority', 'tipo_alta_macro'],
  status:       ['classificacao_resumo_atual', 'status', 'status_vantive', 'status_pedido_star'],
  data_abertura:['data_entrada', 'data_abertura', 'data abertura', 'data de abertura', 'abertura'],
  prazo:        ['data_prazo', 'data_sla_rfs', 'prazo', 'deadline', 'data prazo'],
};

function normalizarChave(chave) {
  return String(chave)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function converterData(valor) {
  if (!valor && valor !== 0) return null;
  if (typeof valor === 'number') {
    try {
      const data = XLSX.SSF.parse_date_code(valor);
      if (data) {
        return `${data.y}-${String(data.m).padStart(2, '0')}-${String(data.d).padStart(2, '0')}`;
      }
    } catch { /* ignora */ }
    return null;
  }
  const str = String(valor).trim();
  // DD/MM/AAAA
  const m1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
  // DD/MM/AA
  const m2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (m2) return `20${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`;
  // AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return null;
}

function converterParaJSON(rows) {
  if (rows.length < 2) return [];

  // Monta índice: campo_normalizado -> posição
  const headerRaw = rows[0].map(h => String(h || ''));
  const indice = {};
  headerRaw.forEach((h, i) => { indice[normalizarChave(h)] = i; });

  // Resolve qual índice usar para cada campo interno
  const resolucao = {};
  for (const [campo, aliases] of Object.entries(MAPA_COLUNAS)) {
    for (const alias of aliases) {
      const norm = normalizarChave(alias);
      if (indice[norm] !== undefined) {
        resolucao[campo] = indice[norm];
        break;
      }
    }
  }

  const dados = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => c === undefined || c === null || c === '')) continue;

    const get = (campo) => {
      const idx = resolucao[campo];
      if (idx === undefined) return '';
      const v = row[idx];
      return (v === undefined || v === null) ? '' : v;
    };

    const numero_os = String(get('numero_os')).trim();
    const cliente   = String(get('cliente')).trim();
    if (!numero_os && !cliente) continue;

    dados.push({
      numero_os,
      cliente,
      endereco:     String(get('endereco')).trim(),
      bairro:       String(get('bairro')).trim(),
      cidade:       String(get('cidade')).trim(),
      tipo_servico: String(get('tipo_servico')).trim() || 'Não informado',
      prioridade:   String(get('prioridade')).trim()   || 'Normal',
      status:       String(get('status')).trim()       || 'AC',
      data_abertura: converterData(get('data_abertura')),
      prazo:         converterData(get('prazo')),
    });
  }
  return dados;
}

function ImportarPlanilha() {
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState([]);
  const [erroArquivo, setErroArquivo] = useState('');
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const inputRef = useRef(null);

  const handleArquivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErroArquivo('Selecione um arquivo .xlsx ou .xls valido.');
      setArquivo(null);
      setPreview([]);
      return;
    }

    setErroArquivo('');
    setResultado(null);
    setArquivo(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const dados = converterParaJSON(rows);
        setPreview(dados);
        if (dados.length === 0) {
          setErroArquivo('Nenhum dado valido encontrado na planilha. Verifique as colunas.');
        }
      } catch (err) {
        console.error('Erro ao ler planilha:', err);
        setErroArquivo('Erro ao ler o arquivo. Verifique se e um arquivo Excel valido.');
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLimpar = () => {
    setArquivo(null);
    setPreview([]);
    setErroArquivo('');
    setResultado(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleImportar = async () => {
    if (preview.length === 0) return;
    setImportando(true);
    setResultado(null);
    try {
      const res = await importarPlanilha(preview);
      setResultado(res);
    } catch (error) {
      console.error('Erro ao importar planilha:', error);
      setResultado({
        erro: error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Erro ao importar planilha. Tente novamente.',
      });
    } finally {
      setImportando(false);
    }
  };

  const colunasSelecionadas = preview.length > 0
    ? COLUNAS_PREVIEW.filter(c => preview.some(row => row[c] !== undefined && row[c] !== ''))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet size={28} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-800">Importar Planilha</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-700">Selecionar arquivo</h2>
        <p className="text-sm text-gray-500">
          Compatível com a planilha padrão Vivo/Telesp. Colunas reconhecidas automaticamente.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
            <Upload size={18} />
            <span>Escolher arquivo</span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleArquivo}
              className="hidden"
            />
          </label>

          {arquivo && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">{arquivo.name}</span>
              <button
                onClick={handleLimpar}
                className="p-1 text-gray-400 hover:text-red-500 transition"
                title="Remover arquivo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {erroArquivo && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <XCircle size={16} className="mt-0.5 shrink-0" />
            <span>{erroArquivo}</span>
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={20} className="text-primary-600" />
              <h2 className="text-base font-semibold text-gray-700">
                Preview dos dados
              </h2>
              <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {preview.length} registro{preview.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  {colunasSelecionadas.map(col => (
                    <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    {colunasSelecionadas.map(col => (
                      <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[180px] truncate">
                        {row[col] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.length > 10 && (
            <p className="text-xs text-gray-400 text-right">
              Exibindo 10 de {preview.length} registros.
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleImportar}
              disabled={importando}
              className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {importando ? 'Importando...' : `Confirmar importacao (${preview.length} registros)`}
            </button>
          </div>
        </div>
      )}

      {resultado && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-700">Resultado da importacao</h2>

          {resultado.erro ? (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <XCircle size={16} className="mt-0.5 shrink-0" />
              <span>{resultado.erro}</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {resultado.sucesso !== undefined && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                    <CheckCircle size={18} />
                    <span>{resultado.sucesso} registro{resultado.sucesso !== 1 ? 's' : ''} importado{resultado.sucesso !== 1 ? 's' : ''} com sucesso</span>
                  </div>
                )}
                {resultado.erros !== undefined && resultado.erros.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                    <XCircle size={18} />
                    <span>{resultado.erros.length} erro{resultado.erros.length !== 1 ? 's' : ''} na importacao</span>
                  </div>
                )}
              </div>

              {resultado.erros && resultado.erros.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Detalhes dos erros:</p>
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {resultado.erros.map((detalhe, i) => (
                      <li key={i} className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded">
                        {typeof detalhe === 'string' ? detalhe : `OS ${detalhe.numero_os}: ${detalhe.erro}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resultado.message && (
                <p className="text-sm text-gray-600">{resultado.message}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImportarPlanilha;
