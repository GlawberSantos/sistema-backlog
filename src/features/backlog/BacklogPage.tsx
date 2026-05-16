// src/features/backlog/BacklogPage.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, BacklogItem } from '../../store/useAppStore';
import { Badge } from '../../components/ui/Badge';
import { TypePill } from '../../components/ui/TypePill';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ── Definição de todas as colunas disponíveis ─────────────────────────────
type ColDef = { key: keyof BacklogItem | 'ID'; label: string; defaultVisible: boolean; width?: number };

const ALL_COLS: ColDef[] = [
  { key: 'Pedido',                  label: 'Pedido',              defaultVisible: true,  width: 120 },
  { key: 'Cliente',                 label: 'Cliente',             defaultVisible: true,  width: 240 },
  { key: 'Cidade',                  label: 'Cidade',              defaultVisible: true,  width: 110 },
  { key: 'UF',                      label: 'UF',                  defaultVisible: true,  width: 52  },
  { key: 'Produto',                 label: 'Produto',             defaultVisible: true,  width: 140 },
  { key: 'Carteira',                label: 'Carteira',            defaultVisible: true,  width: 120 },
  { key: 'Dias_CarteiraAtual',      label: 'Dias Carteira',       defaultVisible: true,  width: 90  },
  { key: 'DataTecnica',             label: 'Data Técnica',        defaultVisible: true,  width: 100 },
  { key: 'Data_RFS',                label: 'Data RFS',            defaultVisible: true,  width: 100 },
  { key: 'DataRede',                label: 'Data Rede',           defaultVisible: false, width: 100 },
  { key: 'Ofensor_Tecnico_Vivo_2',  label: 'Ofensor Técnico',     defaultVisible: true,  width: 140 },
  { key: 'OS_SCD',                  label: 'OS_SCD',              defaultVisible: true,  width: 110 },
  { key: 'Tecnologia_Report',       label: 'Tecnologia',          defaultVisible: true,  width: 90  },
  { key: 'Capacitacao_ERB',         label: 'Capacitação ERB',     defaultVisible: false, width: 110 },
  { key: 'Data_Planejada_Status',   label: 'Data Planejada',      defaultVisible: false, width: 110 },
  { key: 'Classificacao_rede',      label: 'Class. Rede',         defaultVisible: false, width: 120 },
  { key: 'ConfigStatus',            label: 'Config Status',       defaultVisible: false, width: 110 },
  { key: 'GRUPO_BSC',               label: 'Grupo BSC',           defaultVisible: false, width: 100 },
  { key: 'PRAZO_BSC',               label: 'Prazo BSC',           defaultVisible: false, width: 100 },
  { key: 'Efika_GIS',               label: 'Efika GIS',           defaultVisible: false, width: 100 },
  { key: 'TM_Regional',             label: 'TM Regional',         defaultVisible: false, width: 110 },
  { key: 'Status',                  label: 'Status',              defaultVisible: true,  width: 120 },
  { key: 'Tipo',                    label: 'Tipo',                defaultVisible: true,  width: 100 },
];

function tecLabel(val?: string) {
  if (!val) return '—';
  const v = val.toUpperCase().trim();
  if (v === 'ERB') return 'SITE';
  return v;
}

const DATE_COLS = new Set(['DataTecnica','Data_RFS','DataRede','Data_Planejada_Status','PRAZO_BSC','Prazo','Data de Abertura']);

function formatDateVal(v: unknown): string {
  if (v == null || v === '' || v === '0' || v === 0) return '';
  const s = String(v).trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    if (Number(y) < 1971) return '';
    return `${d}/${m}/${y}`;
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime()) && dt.getFullYear() >= 1971) {
    const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,'0'), d = String(dt.getDate()).padStart(2,'0');
    return `${d}/${m}/${y}`;
  }
  return '';
}

function cellValue(item: BacklogItem, key: keyof BacklogItem | 'ID'): string {
  if (key === 'Pedido') return item.Pedido || item.ID || '';
  const v = item[key as keyof BacklogItem];
  if (v == null) return '';
  if (DATE_COLS.has(key as string)) return formatDateVal(v);
  return String(v);
}

// ── Componente de filtro de coluna estilo Excel ───────────────────────────
type ColFilterDropdownProps = {
  colKey: string;
  label: string;
  allValues: string[];
  selected: Set<string>;
  onChange: (key: string, selected: Set<string>) => void;
};

function ColFilterDropdown({ colKey, label, allValues, selected, onChange }: ColFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    allValues.filter(v => v.toLowerCase().includes(search.toLowerCase())),
    [allValues, search]
  );

  const isActive = selected.size > 0;
  const allChecked = filtered.length > 0 && filtered.every(v => selected.has(v));
  const someChecked = filtered.some(v => selected.has(v));

  const toggle = (val: string) => {
    const next = new Set(selected);
    next.has(val) ? next.delete(val) : next.add(val);
    onChange(colKey, next);
  };

  const toggleAll = () => {
    if (allChecked) {
      const next = new Set(selected);
      filtered.forEach(v => next.delete(v));
      onChange(colKey, next);
    } else {
      const next = new Set(selected);
      filtered.forEach(v => next.add(v));
      onChange(colKey, next);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(colKey, new Set());
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <button
        onClick={() => setOpen(p => !p)}
        title={isActive ? `${selected.size} filtro(s) ativo(s)` : label}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '0 2px', gap: 2,
          color: isActive ? '#2d7ef0' : '#8a9bbf',
        }}
      >
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left',
          color: isActive ? '#2d7ef0' : undefined,
        }}>
          {label}
          {isActive && <span style={{ marginLeft: 4, fontSize: 10, background: '#2d7ef0', color: '#fff', borderRadius: 8, padding: '1px 5px' }}>{selected.size}</span>}
        </span>
        <span style={{ fontSize: 9, flexShrink: 0, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'fixed', zIndex: 1000,
          background: '#0d1525', border: '1px solid #1e2e4a', borderRadius: 8,
          boxShadow: '0 8px 32px #000000aa', minWidth: 200, maxWidth: 280,
          padding: '8px 0',
        }}
          ref={el => {
            if (!el) return;
            // Position below the button
            const btn = ref.current?.querySelector('button');
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            el.style.top = `${rect.bottom + 4}px`;
            // Try to fit on screen horizontally
            const right = rect.left + 280;
            if (right > window.innerWidth) {
              el.style.left = `${Math.max(4, window.innerWidth - 284)}px`;
            } else {
              el.style.left = `${rect.left}px`;
            }
          }}
        >
          {/* Search */}
          <div style={{ padding: '0 8px 6px' }}>
            <input
              autoFocus
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: '#1a2540', border: '1px solid #1e2e4a',
                borderRadius: 5, color: '#e8edf5', fontSize: 12, padding: '5px 8px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Select all / Clear */}
          <div style={{ display: 'flex', gap: 4, padding: '2px 8px 6px', borderBottom: '1px solid #1e2e4a' }}>
            <button onClick={toggleAll} style={{ flex: 1, fontSize: 11, padding: '3px 6px', borderRadius: 5, cursor: 'pointer', background: '#1a2540', border: '1px solid #1e2e4a', color: '#8a9bbf' }}>
              {allChecked ? 'Desmarcar tudo' : 'Marcar tudo'}
            </button>
            {isActive && (
              <button onClick={clear} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', background: '#e8555518', border: '1px solid #e8555530', color: '#e85555' }}>
                Limpar
              </button>
            )}
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: '#4a5a7a' }}>Nenhum resultado</div>
            )}
            {filtered.map(val => (
              <label key={val} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px',
                cursor: 'pointer', fontSize: 12,
                color: selected.has(val) ? '#e8edf5' : '#8a9bbf',
                background: selected.has(val) ? '#2d7ef012' : 'transparent',
                userSelect: 'none',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = selected.has(val) ? '#2d7ef020' : '#ffffff08')}
                onMouseLeave={e => (e.currentTarget.style.background = selected.has(val) ? '#2d7ef012' : 'transparent')}
              >
                <input
                  type="checkbox"
                  checked={selected.has(val)}
                  onChange={() => toggle(val)}
                  style={{ accentColor: '#2d7ef0', width: 13, height: 13, flexShrink: 0 }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {val || <em style={{ color: '#4a5a7a' }}>(vazio)</em>}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
export default function BacklogPage() {
  const { data, updateBacklogItem } = useAppStore();
  const navigate = useNavigate();

  const [search, setSearch]         = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showColPicker, setShowColPicker] = useState(false);
  // colFilters: key → Set de valores selecionados (vazio = sem filtro)
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});

  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(ALL_COLS.filter(c => c.defaultVisible).map(c => c.key))
  );

  const itemsPerPage = 15;

  const handleColFilter = useCallback((key: string, selected: Set<string>) => {
    setColFilters(prev => ({ ...prev, [key]: selected }));
    setCurrentPage(1);
  }, []);

  // ── valores únicos por coluna (sobre dados completos) ─────────────────
  const colUniqueValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    ALL_COLS.forEach(c => {
      const key = c.key as string;
      const vals = new Set<string>();
      data.forEach(item => {
        let v = item[key as keyof BacklogItem];
        if (key === 'Tecnologia_Report') v = tecLabel(v as string);
        const s = v != null ? String(v).trim() : '';
        vals.add(s);
      });
      map[key] = [...vals].filter(v => v !== '').sort((a, b) => a.localeCompare(b, 'pt-BR'));
    });
    return map;
  }, [data]);

  // ── filtros ───────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = [...data];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(item =>
        (item.Pedido || '').toLowerCase().includes(s) ||
        (item.Cliente || '').toLowerCase().includes(s) ||
        (item.Cidade || '').toLowerCase().includes(s) ||
        (item.OS_SCD || '').toLowerCase().includes(s) ||
        (item.Produto || '').toLowerCase().includes(s)
      );
    }

    Object.entries(colFilters).forEach(([key, selected]) => {
      if (!selected || selected.size === 0) return;
      result = result.filter(item => {
        let v = item[key as keyof BacklogItem];
        if (key === 'Tecnologia_Report') v = tecLabel(v as string);
        const s = v != null ? String(v).trim() : '';
        return selected.has(s);
      });
    });

    return result;
  }, [data, search, colFilters]);

  const totalPages    = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeFilterCount = Object.values(colFilters).filter(s => s.size > 0).length;

  // ── seleção ───────────────────────────────────────────────────────────
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(i => selectedItems.includes(i.ID));
  const toggleSelectItem = (id: string) =>
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () =>
    isAllSelected
      ? setSelectedItems(prev => prev.filter(id => !paginatedData.some(i => i.ID === id)))
      : setSelectedItems(prev => [...new Set([...prev, ...paginatedData.map(i => i.ID)])]);

  const toggleCol = (key: string) =>
    setVisibleCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── agendar ───────────────────────────────────────────────────────────
  const handleSchedule = () => {
    const sel = data.filter(i => selectedItems.includes(i.ID));
    if (!sel.length) { alert('Selecione ao menos um pedido'); return; }
    sel.forEach(i => updateBacklogItem(i.ID, { Status: 'Pendente Agendamento' }));
    navigate('/agenda');
  };

  // ── exports ───────────────────────────────────────────────────────────
  const activeCols = ALL_COLS.filter(c => visibleCols.has(c.key));

  const exportToExcel = () => {
    const cols = ALL_COLS.filter(c => visibleCols.has(c.key));
    const rows = filteredData.map(item => {
      const obj: Record<string, string> = {};
      cols.forEach(c => { obj[c.label] = c.key === 'Tecnologia_Report' ? tecLabel(item.Tecnologia_Report) : cellValue(item, c.key); });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Backlog');
    XLSX.writeFile(wb, `backlog_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredData.length) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text('Backlog Geral', 14, 15);
    const cols = ALL_COLS.filter(c => visibleCols.has(c.key));
    (doc as any).autoTable({
      head: [cols.map(c => c.label)],
      body: filteredData.map(item => cols.map(c => c.key === 'Tecnologia_Report' ? tecLabel(item.Tecnologia_Report) : cellValue(item, c.key))),
      styles: { fontSize: 7 },
    });
    doc.save('backlog.pdf');
  };

  return (
    <div>
      {/* ── Barra de ferramentas ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Buscar pedido, cliente, cidade, OS, produto..."
          value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="form-input" style={{ flex: 1, minWidth: 220 }}
        />

        {activeFilterCount > 0 && (
          <button
            onClick={() => { setColFilters({}); setCurrentPage(1); }}
            className="btn btn-ghost btn-sm"
            style={{ color: '#e85555', borderColor: '#e8555530', whiteSpace: 'nowrap' }}
          >
            ✕ Limpar filtros ({activeFilterCount})
          </button>
        )}

        <button onClick={exportToExcel} className="btn btn-ghost btn-sm">Excel</button>
        <button onClick={exportToPDF}   className="btn btn-ghost btn-sm">PDF</button>
        <button onClick={() => setShowColPicker(p => !p)} className="btn btn-ghost btn-sm" title="Escolher colunas">
          ⚙ Colunas
        </button>
      </div>

      {/* ── Seletor de colunas ── */}
      {showColPicker && (
        <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 10, padding: '14px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ width: '100%', fontSize: 11, fontWeight: 700, color: '#4a5a7a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Colunas visíveis</div>
          {ALL_COLS.map(c => (
            <label key={c.key as string} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: visibleCols.has(c.key as string) ? '#e8edf5' : '#4a5a7a', userSelect: 'none' }}>
              <input type="checkbox" checked={visibleCols.has(c.key as string)} onChange={() => toggleCol(c.key as string)} style={{ accentColor: '#2d7ef0' }} />
              {c.label}
            </label>
          ))}
        </div>
      )}

      {/* ── Cabeçalho da lista ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontSize: 15 }}>
          Backlog Geral
          <span style={{ marginLeft: 8, fontSize: 12, color: '#4a5a7a', fontWeight: 400 }}>
            {filteredData.length} {filteredData.length !== data.length ? `de ${data.length}` : ''} registros
          </span>
        </h2>
        <button className="btn btn-primary btn-sm" onClick={handleSchedule}>
          Agendar ({selectedItems.length})
        </button>
      </div>

      {/* ── Tabela ── */}
      <div className="panel">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: activeCols.length * 110 }}>
            <thead>
              <tr>
                <th style={{ width: 36, verticalAlign: 'middle' }}>
                  <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                {activeCols.map(c => {
                  const key = c.key as string;
                  const selected = colFilters[key] || new Set<string>();
                  return (
                    <th key={key} style={{ minWidth: c.width, padding: '6px 8px', verticalAlign: 'middle' }}>
                      <ColFilterDropdown
                        colKey={key}
                        label={c.label}
                        allValues={colUniqueValues[key] || []}
                        selected={selected}
                        onChange={handleColFilter}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(item => (
                <tr key={item.ID} style={{ background: selectedItems.includes(item.ID) ? '#2d7ef010' : 'transparent' }}>
                  <td>
                    <input type="checkbox" checked={selectedItems.includes(item.ID)} onChange={() => toggleSelectItem(item.ID)} />
                  </td>
                  {activeCols.map(c => {
                    if (c.key === 'Status') return (
                      <td key="Status"><Badge status={item.Status}>{item.Status}</Badge></td>
                    );
                    if (c.key === 'Tipo') return (
                      <td key="Tipo"><TypePill tipo={item.Tipo} /></td>
                    );
                    if (c.key === 'Tecnologia_Report') {
                      const tec = tecLabel(item.Tecnologia_Report);
                      const isGpon = tec === 'GPON';
                      const isSite = tec === 'SITE';
                      return (
                        <td key="Tecnologia_Report">
                          {tec === '—' ? <span style={{ color: '#2a3a5a' }}>—</span> : (
                            <span style={{ background: isGpon ? '#0eb88a18' : isSite ? '#2d7ef018' : '#ffffff10', color: isGpon ? '#0eb88a' : isSite ? '#2d7ef0' : '#8a9bbf', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                              {tec}
                            </span>
                          )}
                        </td>
                      );
                    }
                    if (c.key === 'Dias_CarteiraAtual') {
                      const raw = item.Dias_CarteiraAtual;
                      let dias = 0;
                      if (typeof raw === 'number') {
                        dias = Math.round(raw);
                      } else if (raw != null) {
                        const asDate = new Date(String(raw));
                        if (!isNaN(asDate.getTime())) {
                          dias = Math.round((asDate.getTime() - Date.UTC(1899, 11, 30)) / 86400000);
                        } else {
                          dias = parseInt(String(raw), 10) || 0;
                        }
                      }
                      const color = dias > 90 ? '#e85555' : dias > 30 ? '#f5882a' : '#0eb88a';
                      return (
                        <td key="Dias_CarteiraAtual">
                          {raw !== undefined && raw !== null
                            ? <span style={{ color, fontWeight: 700 }}>{dias}</span>
                            : <span style={{ color: '#2a3a5a' }}>—</span>}
                        </td>
                      );
                    }
                    const val = cellValue(item, c.key);
                    return (
                      <td key={c.key as string} style={{ maxWidth: c.width, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                        {val || <span style={{ color: '#2a3a5a' }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={activeCols.length + 1} style={{ textAlign: 'center', padding: 40, color: '#4a5a7a' }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginação ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '14px 0 4px', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const half = 3;
              let start = Math.max(1, currentPage - half);
              const end = Math.min(totalPages, start + 6);
              start = Math.max(1, end - 6);
              return start + i;
            }).filter(p => p >= 1 && p <= totalPages).map(p => (
              <button key={p} className="btn btn-ghost btn-sm"
                onClick={() => setCurrentPage(p)}
                style={{ fontWeight: p === currentPage ? 700 : 400, color: p === currentPage ? '#2d7ef0' : undefined, borderColor: p === currentPage ? '#2d7ef0' : undefined }}>
                {p}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
            <span style={{ fontSize: 11, color: '#4a5a7a', marginLeft: 6 }}>
              Página {currentPage} de {totalPages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}