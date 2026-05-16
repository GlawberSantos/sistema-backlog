// src/features/importar/ImportarPage.tsx
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../../store/useAppStore';

export default function ImportarPage() {
  const { importData } = useAppStore();
  const [preview, setPreview] = useState<any[]>([]);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = new Uint8Array(e.target?.result as ArrayBuffer);
      // cellDates: false keeps numeric cells (like Dias_CarteiraAtual) as plain numbers.
      // Date columns are handled manually via toDate() further below.
      const workbook = XLSX.read(raw, { type: 'array', cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as unknown[][];
      if (json.length > 1) {
        const headerRow = json[0] as string[];
        const dataRows = json.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          headerRow.forEach((header, i) => { obj[header] = row[i]; });
          return obj;
        });
        setHeaders(headerRow);
        setImportRows(dataRows);
        setPreview(dataRows.slice(0, 20));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetFile = () => {
    setPreview([]);
    setImportRows([]);
    setHeaders([]);
    setProgress(null);
  };

  const confirmImport = async () => {
    if (importRows.length === 0) return alert('Nenhum arquivo carregado');

    const today = new Date();
    const prazoBase = new Date(today);
    prazoBase.setDate(today.getDate() + 30);

    const toDate = (v: unknown): string => {
      if (!v && v !== 0) return '';
      try {
        if (typeof v === 'number') {
          const date = XLSX.SSF.parse_date_code(v);
          if (date) {
            const y = date.y, m = String(date.m).padStart(2, '0'), d = String(date.d).padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
        }
        return new Date(v as string).toISOString().split('T')[0];
      } catch { return String(v); }
    };

    const converted = importRows.map((row, index) => {
      const servico = String(row.Servico || row.Produto || '').toLowerCase();
      let tipo: 'Construção' | 'Ativação' | 'Vistoria' = 'Construção';
      if (servico.includes('sip') || servico.includes('voz')) tipo = 'Ativação';
      else if (servico.includes('altera') || servico.includes('mudança')) tipo = 'Vistoria';

      const classAtual = String(row['Classificacao_Resumo_Atual'] || '').toLowerCase();
      let status = 'Disponível';
      if (classAtual.includes('faturado') || classAtual.includes('conclu')) status = 'Concluído';
      else if (classAtual.includes('cancel')) status = 'Cancelado';
      else if (classAtual.includes('tecnica') || classAtual.includes('execu') || classAtual.includes('ativação')) status = 'Em Andamento';
      else if (classAtual.includes('pend')) status = 'Pendente';

      const dataAbertura = row['Data_Entrada']
        ? new Date(row['Data_Entrada'] as string).toISOString().split('T')[0]
        : today.toISOString().split('T')[0];
      const prazo = row['DATA_PRAZO']
        ? new Date(row['DATA_PRAZO'] as string).toISOString().split('T')[0]
        : prazoBase.toISOString().split('T')[0];

      return {
        ID: String(row.Pedido || row.ID_Vantive || row.OS_SCD || `IMP${Date.now()}-${index}`),
        Pedido:            String(row.Pedido || ''),
        DraftEncontrado:   String(row.DraftEncontrado || ''),
        Bucle_Contratada:  String(row.Bucle_Contratada || ''),
        OS_SCD:            String(row.OS_SCD || row.ID_Vantive || ''),
        OS_TBS:            String(row.OS_TBS || ''),
        Tecnologia_Report: String(row.Tecnologia_Report || ''),
        Capacitacao_ERB:   String(row.Capacitacao_ERB || ''),
        Cliente:  String(row.Cliente || 'Cliente Importado'),
        Endereco: String(row.Endereco_Completo || row.Endereco || ''),
        Numero:   String(row.Numero || row.Num || ''),
        CEP:      String(row.CEP || ''),
        Cidade:   String(row.Cidade || ''),
        UF:       String(row.UF || 'PE'),
        CNPJ:     String(row.CNPJ || ''),
        Produto:  String(row.Produto || ''),
        Servico:  String(row.Servico || row.Servico_Produto || ''),
        Carteira: String(row.Carteira || ''),
        'Data de Abertura':    dataAbertura,
        Prazo:                 prazo,
        DataTecnica:           toDate(row.DataTecnica),
        Data_RFS:              toDate(row.Data_RFS),
        DataRede:              toDate(row.DataRede),
        Data_Planejada_Status: toDate(row.Data_Planejada_Status),
        Dias_CarteiraAtual: (() => {
          const v = row.Dias_CarteiraAtual;
          if (v == null) return 0;
          // Se ainda vier como Date (fallback), calcular o serial do Excel a partir da data
          if (v instanceof Date) {
            // Excel serial: dias desde 30/dez/1899
            return Math.round((v.getTime() - Date.UTC(1899, 11, 30)) / 86400000);
          }
          // Se vier como número (serial Excel ou já dias reais)
          if (typeof v === 'number') return Math.round(v);
          // Se vier como string de data tipo "Tue Jan 16 1900...", converter para serial
          const asDate = new Date(v as string);
          if (!isNaN(asDate.getTime())) {
            return Math.round((asDate.getTime() - Date.UTC(1899, 11, 30)) / 86400000);
          }
          // Último recurso: tentar parseInt
          const n = parseInt(String(v), 10);
          return isNaN(n) ? 0 : n;
        })(),
        PRAZO_BSC:             toDate(row.PRAZO_BSC),
        TarefaAtualDraft:     String(row.TarefaAtualDraft || ''),
        Status:      status,
        Responsavel: String(row.Parceiro || row.ResponsavelPE || ''),
        Tipo:        tipo,
        Classificacao_rede:        String(row.Classificacao_rede || row['GD - Classificacao_rede'] || ''),
        'GD - Classificacao_rede': String(row['GD - Classificacao_rede'] || row.Classificacao_rede || ''),
        ConfigStatus:              String(row.ConfigStatus || ''),
        Ofensor_Tecnico_Vivo_2:    String(row.Ofensor_Tecnico_Vivo_2 || ''),
        GRUPO_BSC:   String(row.GRUPO_BSC || ''),
        Efika_GIS:   String(row.Efika_GIS || ''),
        TM_Regional: String(row.TM_Regional || ''),
        PON:         String(row.OS_SCD || row.ID_Vantive || ''),
      };
    });

    setImporting(true);
    setProgress({ done: 0, total: converted.length });

    try {
      await importData(converted, (done, total) => {
        setProgress({ done, total });
      });
      resetFile();
      alert(`${converted.length} registros importados com sucesso!`);
    } catch {
      alert('Erro durante a importação. Verifique o servidor e tente novamente.');
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  const colunasAuditoria = headers.length > 0 ? [
    { col: 'Pedido',                 label: 'Pedido',                 ok: headers.includes('Pedido') },
    { col: 'DraftEncontrado',        label: 'DraftEncontrado',        ok: headers.includes('DraftEncontrado') },
    { col: 'Bucle_Contratada',       label: 'Bucle_Contratada',       ok: headers.includes('Bucle_Contratada') },
    { col: 'Tecnologia_Report',      label: 'Tecnologia_Report',      ok: headers.includes('Tecnologia_Report') },
    { col: 'OS_SCD',                 label: 'OS_SCD',                 ok: headers.includes('OS_SCD') },
    { col: 'Capacitacao_ERB',        label: 'Capacitacao_ERB',        ok: headers.includes('Capacitacao_ERB') },
    { col: 'Produto',                label: 'Produto',                ok: headers.includes('Produto') },
    { col: 'Carteira',               label: 'Carteira',               ok: headers.includes('Carteira') },
    { col: 'Dias_CarteiraAtual',     label: 'Dias_CarteiraAtual',     ok: headers.includes('Dias_CarteiraAtual') },
    { col: 'DataTecnica',            label: 'DataTecnica',            ok: headers.includes('DataTecnica') },
    { col: 'Data_RFS',               label: 'Data_RFS',               ok: headers.includes('Data_RFS') },
    { col: 'DataRede',               label: 'DataRede',               ok: headers.includes('DataRede') },
    { col: 'Ofensor_Tecnico_Vivo_2', label: 'Ofensor_Tecnico_Vivo_2', ok: headers.includes('Ofensor_Tecnico_Vivo_2') },
    { col: 'Data_Planejada_Status',  label: 'Data_Planejada_Status',  ok: headers.includes('Data_Planejada_Status') },
    { col: 'Classificacao_rede',     label: 'Classificacao_rede',     ok: headers.includes('Classificacao_rede') },
    { col: 'ConfigStatus',           label: 'ConfigStatus',           ok: headers.includes('ConfigStatus') },
    { col: 'GRUPO_BSC',              label: 'GRUPO_BSC',              ok: headers.includes('GRUPO_BSC') },
    { col: 'BSC',              label: 'BSC',              ok: headers.includes('PRAZO_BSC') },
    { col: 'Efika_GIS',              label: 'Efika_GIS',              ok: headers.includes('Efika_GIS') },
    { col: 'TM_Regional',            label: 'TM_Regional',            ok: headers.includes('TM_Regional') },
    { col: 'TarefaAtualDraft',       label: 'TarefaAtualDraft',       ok: headers.includes('TarefaAtualDraft') },
  ] : [];
  const colunasFaltando = colunasAuditoria.filter(c => !c.ok);
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="panel" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="panel-header">
        <span className="panel-title">Importar Planilha (.xlsx / .xls)</span>
      </div>
      <div className="panel-body">
        <input
          type="file" id="file-input-import" accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />

        {/* Tela de progresso */}
        {importing && progress && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', marginBottom: 8 }}>
              Importando registros...
            </div>
            <div style={{ fontSize: 13, color: '#4a5a7a', marginBottom: 20 }}>
              {progress.done} de {progress.total} registros salvos
            </div>
            <div style={{ background: '#1e2e4a', borderRadius: 999, height: 10, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #2d7ef0, #0dd8d8)',
                borderRadius: 999,
                transition: 'width 0.2s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: '#2d7ef0', fontWeight: 700 }}>{pct}%</div>
            <div style={{ marginTop: 20, fontSize: 11, color: '#2a3a5a' }}>
              Não feche esta janela durante a importação.
            </div>
          </div>
        )}

        {/* Drop zone */}
        {!importing && preview.length === 0 && (
          <div
            className="drop-zone"
            onClick={() => document.getElementById('file-input-import')?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('over'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('over')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('over');
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
          >
            <svg style={{ width: 40, height: 40, margin: '0 auto 12px', color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
            </svg>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Arraste e solte o arquivo aqui</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>ou clique para selecionar — .xlsx, .xls</p>
          </div>
        )}

        {/* Pré-visualização */}
        {!importing && preview.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Pré-visualização (primeiras 20 linhas)
              </h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetFile}>
                ↩ Trocar arquivo
              </button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 300, border: '1px solid var(--border)', borderRadius: 8 }}>
              <table className="data-table">
                <thead>
                  <tr>{headers.map((h, i) => <th key={i}>{h || ''}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {headers.map((h, j) => (
                        <td key={j}>
                          {row[h] instanceof Date
                            ? (row[h] as Date).toLocaleDateString('pt-BR')
                            : String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {colunasFaltando.length > 0 && (
              <div style={{ marginTop: 14, background: '#f5882a10', border: '1px solid #f5882a40', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f5882a', marginBottom: 10 }}>
                  ⚠️ {colunasFaltando.length} coluna(s) não encontrada(s) — esses campos ficarão vazios no formulário do técnico:
                </div>
                {colunasFaltando.map(c => (
                  <div key={c.col} style={{ fontSize: 11, color: '#8a9bbf', marginBottom: 4, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#e85555', fontWeight: 700 }}>✗</span>
                    <strong style={{ color: '#e8edf5' }}>{c.label}</strong>
                  </div>
                ))}
              </div>
            )}

            {colunasFaltando.length === 0 && colunasAuditoria.length > 0 && (
              <div style={{ marginTop: 14, background: '#0eb88a10', border: '1px solid #0eb88a40', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: '#0eb88a', fontWeight: 600 }}>
                ✓ Todas as colunas críticas encontradas na planilha.
              </div>
            )}

            <div style={{ marginTop: 12, background: '#2d7ef010', border: '1px solid #2d7ef030', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#4a5a7a' }}>
              ℹ️ <strong style={{ color: '#8a9bbf' }}>{importRows.length} registros</strong> serão importados em lotes para maior velocidade.
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
              onClick={confirmImport}
            >
              ✓ Confirmar Importação ({importRows.length} registros)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}