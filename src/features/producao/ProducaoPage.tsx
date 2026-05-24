// src/features/producao/ProducaoPage.tsx
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAppStore, type ScheduleEvent } from '../../store/useAppStore';
import { Badge } from '../../components/ui/Badge';
import { TypePill } from '../../components/ui/TypePill';

const tipoBar: Record<string, string> = {
  Construção: '#2d7ef0',
  Ativação: '#0eb88a',
  Vistoria: '#f5882a',
};

function FotosModal({ event, onClose }: { event: ScheduleEvent; onClose: () => void }) {
  const fotos = event.extendedProps.fotos ?? [];
  const ep = event.extendedProps;

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-panel, #0f1829)',
          border: '1px solid var(--border, #1e2e4a)',
          borderRadius: 14,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{event.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {ep.cliente} · {ep.tecnico} · <Badge status={ep.status}>{ep.status}</Badge>
            </div>
            {ep.concluidoEm && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Concluída em {new Date(ep.concluidoEm).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar
          </button>
        </div>

        {fotos.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma foto anexada nesta atividade.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {fotos.map((src, idx) => (
              <a
                key={idx}
                href={src}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1' }}
                title={`Abrir foto ${idx + 1} em tamanho real`}
              >
                <img src={src} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </a>
            ))}
          </div>
        )}

        {ep.carimbo && (
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Ver carimbo / texto do encerramento</summary>
            <pre
              style={{
                marginTop: 8,
                padding: 12,
                background: 'var(--bg-input, #0a0f1a)',
                borderRadius: 8,
                fontSize: 11,
                whiteSpace: 'pre-wrap',
                color: 'var(--text-secondary)',
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {ep.carimbo}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default function ProducaoPage() {
  const { schedule } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterTecnico, setFilterTecnico] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [fotosEvent, setFotosEvent] = useState<ScheduleEvent | null>(null);

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
        const matchStatus = !filterStatus || event.extendedProps.status === filterStatus;
        return matchSearch && matchTipo && matchTecnico && matchStatus;
      });
  }, [schedule, search, filterTipo, filterTecnico, filterStatus, today]);

  const stats = useMemo(() => {
    const base = schedule.filter((e) => new Date(e.start).toDateString() === today);
    return {
      total: base.length,
      agendado: base.filter((e) => e.extendedProps.status === 'Agendado').length,
      concluida: base.filter((e) => e.extendedProps.status === 'Concluída').length,
      naoConcluida: base.filter((e) => e.extendedProps.status === 'Não Concluída').length,
    };
  }, [schedule, today]);

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
      Fotos: ev.extendedProps.fotos?.length ?? 0,
      ConcluidoEm: ev.extendedProps.concluidoEm
        ? new Date(ev.extendedProps.concluidoEm).toLocaleString('pt-BR')
        : '',
    }));
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Producao');
    XLSX.writeFile(wb, 'producao_diaria.xlsx');
  };

  return (
    <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 130px)' }}>
      {fotosEvent && <FotosModal event={fotosEvent} onClose={() => setFotosEvent(null)} />}

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
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px 0', flexWrap: 'wrap' }}>
          {[
            { key: '', label: 'Todas', count: stats.total },
            { key: 'Agendado', label: 'Agendadas', count: stats.agendado },
            { key: 'Concluída', label: 'Concluídas', count: stats.concluida },
            { key: 'Não Concluída', label: 'Não concluídas', count: stats.naoConcluida },
          ].map((s) => (
            <button
              key={s.key || 'all'}
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setFilterStatus(s.key)}
              style={{
                borderColor: filterStatus === s.key ? 'var(--accent-blue)' : undefined,
                color: filterStatus === s.key ? 'var(--accent-blue-light)' : undefined,
              }}
            >
              {s.label} ({s.count})
            </button>
          ))}
        </div>

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
          <div>Fotos</div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {atividadesHoje.map((event) => {
            const fotosCount = event.extendedProps.fotos?.length ?? 0;
            const isConcluida = event.extendedProps.status === 'Concluída';

            return (
              <div
                key={event.id}
                className="activity-row fade-in"
                style={isConcluida ? { background: 'color-mix(in oklab, var(--accent-green, #0eb88a) 6%, transparent)' } : undefined}
              >
                <div
                  style={{
                    width: 4,
                    height: 36,
                    borderRadius: 2,
                    background: isConcluida ? '#0eb88a' : tipoBar[event.extendedProps.tipo] || 'var(--accent-blue)',
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
                <div>
                  {fotosCount > 0 || isConcluida || event.extendedProps.status === 'Não Concluída' ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setFotosEvent(event)}
                      title={fotosCount > 0 ? 'Ver fotos do técnico' : 'Ver detalhes do encerramento'}
                    >
                      📷 {fotosCount > 0 ? `${fotosCount} foto${fotosCount > 1 ? 's' : ''}` : 'Detalhes'}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>
              </div>
            );
          })}

          {atividadesHoje.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhuma atividade para os filtros selecionados hoje.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
