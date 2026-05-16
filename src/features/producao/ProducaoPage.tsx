// src/features/producao/ProducaoPage.tsx
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../../components/ui/Badge';
import { TypePill } from '../../components/ui/TypePill';

const tipoBar: Record<string, string> = {
  Construção: '#2d7ef0',
  Ativação: '#0eb88a',
  Vistoria: '#f5882a',
};

export default function ProducaoPage() {
  const { schedule } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterTecnico, setFilterTecnico] = useState('');

  const today = new Date().toDateString();

  const atividadesHoje = useMemo(() => {
    return schedule
      .filter((event) => new Date(event.start).toDateString() === today)
      .filter((event) => {
        const matchSearch =
          !search ||
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.extendedProps.cliente.toLowerCase().includes(search.toLowerCase());
        const matchTipo = !filterTipo || event.extendedProps.tipo === filterTipo;
        const matchTecnico = !filterTecnico || event.extendedProps.tecnico === filterTecnico;
        return matchSearch && matchTipo && matchTecnico;
      });
  }, [schedule, search, filterTipo, filterTecnico, today]);

  const tecnicos = useMemo(() => {
    return [...new Set(schedule.map((e) => e.extendedProps.tecnico).filter(Boolean))].sort();
  }, [schedule]);

  const exportExcel = () => {
    const rows = atividadesHoje.map((ev) => ({
      Titulo: ev.title,
      Cliente: ev.extendedProps.cliente,
      Tipo: ev.extendedProps.tipo,
      Tecnico: ev.extendedProps.tecnico,
      Status: ev.extendedProps.status,
    }));
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Producao');
    XLSX.writeFile(wb, 'producao_diaria.xlsx');
  };

  return (
    <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 130px)' }}>
      <div className="panel" style={{ width: 220, flexShrink: 0, overflowY: 'auto' }}>
        <div className="panel-header">
          <span className="panel-title">Filtrar por Técnico</span>
        </div>
        <div style={{ padding: 8 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setFilterTecnico('')}
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}
          >
            Todos
          </button>
          {tecnicos.map((tec) => (
            <button
              key={tec}
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setFilterTecnico(tec)}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                marginBottom: 6,
                borderColor: filterTecnico === tec ? 'var(--accent-blue)' : undefined,
                color: filterTecnico === tec ? 'var(--accent-blue-light)' : undefined,
              }}
            >
              {tec}
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320, minWidth: 200 }}>
              <input
                type="text"
                placeholder="Buscar por cliente, título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 32 }}
              />
              <svg
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 14, height: 14 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="form-input form-select" style={{ width: 160 }}>
              <option value="">Todos os tipos</option>
              <option value="Construção">Construção</option>
              <option value="Ativação">Ativação</option>
              <option value="Vistoria">Vistoria</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{atividadesHoje.length}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportExcel}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
              </svg>
              Excel
            </button>
          </div>
        </div>

        <div className="activity-row header">
          <div />
          <div>Atividade</div>
          <div className="hide-mobile">Técnico</div>
          <div className="hide-mobile">Status</div>
          <div className="hide-mobile">Tipo</div>
          <div />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {atividadesHoje.map((event) => (
            <div key={event.id} className="activity-row fade-in">
              <div
                style={{
                  width: 4,
                  height: 36,
                  borderRadius: 2,
                  background: tipoBar[event.extendedProps.tipo] || 'var(--accent-blue)',
                  justifySelf: 'center',
                }}
              />
              <div className="activity-name">
                <div className="main">{event.title}</div>
                <div className="sub">{event.extendedProps.cliente}</div>
              </div>
              <div className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {event.extendedProps.tecnico}
              </div>
              <div className="hide-mobile">
                <Badge status={event.extendedProps.status}>{event.extendedProps.status}</Badge>
              </div>
              <div className="hide-mobile">
                <TypePill tipo={event.extendedProps.tipo} />
              </div>
              <div />
            </div>
          ))}

          {atividadesHoje.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma atividade agendada para hoje.</div>
          )}
        </div>
      </div>
    </div>
  );
}
