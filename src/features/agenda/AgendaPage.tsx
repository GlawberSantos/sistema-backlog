// src/features/agenda/AgendaPage.tsx
import { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { useAppStore } from '../../store/useAppStore';
import { TypePill } from '../../components/ui/TypePill';

const tipoColor: Record<string, string> = {
  Construção: '#2d7ef0',
  Ativação: '#0eb88a',
  Vistoria: '#f5882a',
  Reparo: '#e85555',
};

const EMPRESAS = ['VIVO', 'R2T', 'ICOMON', 'TECNOMULT'];
const TIPOS = ['Construção', 'Ativação', 'Reparo'];

function DayEventsModal({
  date,
  events,
  onClose,
  onRemove,
}: {
  date: string;
  events: { id: string; title: string; tipo: string; tecnico: string }[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="day-modal-overlay" onClick={onClose}>
      <div className="day-modal" onClick={(e) => e.stopPropagation()}>
        <div className="day-modal-header">
          <span className="day-modal-title">📅 {date}</span>
          <button className="day-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="day-modal-body">
          {events.map((ev) => (
            <div key={ev.id} className="day-modal-event" style={{ borderLeft: `3px solid ${tipoColor[ev.tipo] || '#2d7ef0'}` }}>
              <div className="day-modal-event-info">
                <span className="day-modal-event-title">{ev.title}</span>
                <span className="day-modal-event-meta">
                  <span style={{ color: tipoColor[ev.tipo] || '#2d7ef0', fontSize: 10, fontWeight: 600 }}>{ev.tipo}</span>
                  {ev.tecnico && <span style={{ color: '#8a9bbf', fontSize: 10, marginLeft: 6 }}>👤 {ev.tecnico}</span>}
                </span>
              </div>
              <button className="day-modal-remove" onClick={() => onRemove(ev.id)} title="Remover">🗑</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PendingCard({
  item,
  tecnicos,
  onAgendar,
  onUpdateItem,
}: {
  item: { ID: string; Pedido?: string; Cliente: string; Tipo: 'Construção' | 'Ativação' | 'Vistoria'; Cidade?: string; UF?: string; Bucle_Contratada?: string };
  tecnicos: { id: number; nome: string }[];
  onAgendar: (item: { ID: string; Pedido?: string; Cliente: string; Tipo: 'Construção' | 'Ativação' | 'Vistoria' }, tecnico: string, date: string) => void;
  onUpdateItem: (id: string, updates: { Bucle_Contratada?: string; Tipo?: 'Construção' | 'Ativação' | 'Vistoria' }) => void;
}) {
  const [tecnico, setTecnico] = useState('');
  const [date, setDate] = useState('');
  const [empresa, setEmpresa] = useState(item.Bucle_Contratada || '');
  const [tipo, setTipo] = useState<'Construção' | 'Ativação' | 'Vistoria' | ''>(item.Tipo || '');

  const handleSaveChanges = () => {
    const updates: { Bucle_Contratada?: string; Tipo?: 'Construção' | 'Ativação' | 'Vistoria' } = {
      Bucle_Contratada: empresa,
    };
    if (tipo) {
      updates.Tipo = tipo as 'Construção' | 'Ativação' | 'Vistoria';
    }
    onUpdateItem(item.ID, updates);
  };

  return (
    <div className="pending-card">
      <div className="pending-card-header">
        <span className="pending-card-id">{item.Pedido || item.ID}</span>
        <TypePill tipo={tipo} />
      </div>
      <div className="pending-card-title">{item.Cliente}</div>
      <div className="pending-card-sub">
        <div>{item.Cidade} / {item.UF}</div>
      </div>

      {/* Seção de edição de empresa e tipo */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
        <select 
          className="form-input form-select" 
          style={{ fontSize: 11, flex: 1 }} 
          value={empresa} 
          onChange={(e) => setEmpresa(e.target.value)}
          title="Editar empresa"
        >
          <option value="">🏢 Empresa</option>
          {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <select 
          className="form-input form-select" 
          style={{ fontSize: 11, flex: 1 }} 
          value={tipo} 
          onChange={(e) => setTipo(e.target.value as 'Construção' | 'Ativação' | 'Vistoria' | '')}
          title="Editar tipo"
        >
          <option value="">🔧 Tipo</option>
          {['Construção', 'Ativação', 'Vistoria'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {(empresa !== (item.Bucle_Contratada || '') || (tipo && tipo !== item.Tipo)) && (
          <button 
            type="button" 
            className="btn btn-primary btn-sm" 
            onClick={handleSaveChanges}
            style={{ padding: '5px 8px', fontSize: 11 }}
          >💾</button>
        )}
      </div>

      <div className="pending-card-form">
        <select className="form-input form-select" style={{ fontSize: 11 }} value={tecnico} onChange={(e) => setTecnico(e.target.value)}>
          <option value="">Selecione Técnico</option>
          {tecnicos.map((t) => <option key={t.id} value={t.nome}>{t.nome}</option>)}
        </select>
        <input type="date" className="form-input" style={{ fontSize: 11 }} value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAgendar({ ...item, Tipo: (tipo as 'Construção' | 'Ativação' | 'Vistoria') || item.Tipo }, tecnico, date)}>Agendar</button>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const { data, schedule, addScheduleEvent, removeScheduleEvent, updateBacklogItem, users } = useAppStore();

  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterTecnico, setFilterTecnico] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
  const [modalDay, setModalDay] = useState<{ date: string; ids: string[] } | null>(null);
  const calRef = useRef<FullCalendar>(null);

  const today = new Date();
  const todayStr = today.toDateString();
  const totalAgendado = schedule.length;
  const hojeCount = schedule.filter((e) => new Date(e.start).toDateString() === todayStr).length;
  const pendentesCount = data.filter((d) => d.Status === 'Pendente Agendamento').length;
  const planejado = schedule.filter((e) => e.extendedProps?.status === 'Planejado').length;

  useEffect(() => {
    const api = calRef.current?.getApi?.();
    if (api) api.changeView(calendarView);
  }, [calendarView]);

  // Agrupa eventos por dia para o calendário
  const eventsByDay: Record<string, typeof schedule> = {};
  schedule.forEach((ev) => {
    const day = ev.start.slice(0, 10);
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(ev);
  });

  const calendarEvents = Object.entries(eventsByDay).flatMap(([day, evs]): any[] => {
    if (evs.length === 1) {
      const ev = evs[0];
      return [{
        id: ev.id.toString(),
        title: ev.title,
        start: ev.start,
        end: ev.end,
        backgroundColor: tipoColor[ev.extendedProps.tipo] || '#2d7ef0',
        borderColor: 'transparent',
        extendedProps: { ...ev.extendedProps, _singleId: ev.id.toString() },
      }];
    }
    const byTipo: Record<string, typeof schedule> = {};
    evs.forEach((ev) => {
      const t = ev.extendedProps.tipo || 'Outros';
      if (!byTipo[t]) byTipo[t] = [];
      byTipo[t].push(ev);
    });
    return Object.entries(byTipo).map(([tipo, group]) => ({
      id: `group-${day}-${tipo}`,
      title: group.length === 1 ? group[0].title : `${group.length} · ${tipo}`,
      start: day,
      backgroundColor: tipoColor[tipo] || '#2d7ef0',
      borderColor: 'transparent',
      extendedProps: {
        tipo,
        _grouped: true,
        _day: day,
        _ids: group.map((e) => e.id.toString()),
      },
    }));
  });

  const tecnicos = users.filter((u) => u.nivel === 'Técnico' && u.status === 'Ativo');

  const pendentes = data
    .filter((d) => d.Status === 'Pendente Agendamento')
    .filter((d) => {
      if (filterEmpresa && (d.Bucle_Contratada || '').toUpperCase() !== filterEmpresa.toUpperCase()) return false;
      if (filterTipo && d.Tipo !== filterTipo) return false;
      if (filterTecnico && (d.Responsavel || '') !== filterTecnico) return false;
      if (pendingSearch) {
        const q = pendingSearch.toLowerCase();
        if (!d.Cliente.toLowerCase().includes(q) && !(d.Pedido || '').toLowerCase().includes(q) && !(d.Cidade || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });

  const handleAgendar = (
    item: { ID: string; Pedido?: string; Cliente: string; Tipo: string },
    tecnico: string,
    date: string
  ) => {
    if (!tecnico || !date) { alert('Selecione técnico e data'); return; }
    addScheduleEvent({
      id: Date.now(),
      title: `${item.Pedido || item.ID} - ${item.Cliente}`,
      start: `${date}T08:00:00`,
      extendedProps: { tipo: item.Tipo || 'Ativação', tecnico, cliente: item.Cliente, status: 'Agendado', pon: item.Pedido || item.ID, itemID: item.ID },
    });
    updateBacklogItem(item.ID, { Status: 'Planejado' });
  };

  const handleRemoveFromModal = (rawId: string) => {
    if (!confirm('Remover este agendamento?')) return;
    const id = Number(rawId);
    const original = schedule.find((s) => s.id === id);
    removeScheduleEvent(id);
    if (original?.extendedProps.itemID) updateBacklogItem(original.extendedProps.itemID, { Status: 'Pendente Agendamento' });
    if (modalDay) {
      const remaining = modalDay.ids.filter((i) => i !== rawId);
      if (remaining.length === 0) setModalDay(null);
      else setModalDay({ ...modalDay, ids: remaining });
    }
  };

  const modalEvents = modalDay
    ? modalDay.ids.map((rawId) => {
        const ev = schedule.find((s) => s.id === Number(rawId));
        return { id: rawId, title: ev?.title || rawId, tipo: ev?.extendedProps.tipo || '', tecnico: ev?.extendedProps.tecnico || '' };
      })
    : [];

  const kpis = [
    { icon: '📅', label: 'Total Agendado', value: totalAgendado, color: 'rgba(45,126,240,0.15)', iconBg: 'rgba(45,126,240,0.2)' },
    { icon: '⚡', label: 'Hoje', value: hojeCount, color: 'rgba(13,216,216,0.1)', iconBg: 'rgba(13,216,216,0.2)' },
    { icon: '🕐', label: 'Pendentes', value: pendentesCount, color: 'rgba(245,136,42,0.1)', iconBg: 'rgba(245,136,42,0.2)' },
    { icon: '📋', label: 'Planejados', value: planejado, color: 'rgba(139,92,246,0.1)', iconBg: 'rgba(139,92,246,0.2)' },
  ];

  const viewBtns: { id: typeof calendarView; label: string }[] = [
    { id: 'dayGridMonth', label: 'Mês' },
    { id: 'timeGridWeek', label: 'Semana' },
    { id: 'listWeek', label: 'Lista' },
  ];

  return (
    <div id="agenda-view">
      <div className="agenda-layout">
        <div className="agenda-left">
          <div className="agenda-kpis">
            {kpis.map((k) => (
              <div key={k.label} className="agenda-kpi" style={{ borderColor: k.color, background: k.color }}>
                <div className="agenda-kpi-icon" style={{ background: k.iconBg }}>{k.icon}</div>
                <div>
                  <div className="agenda-kpi-label">{k.label}</div>
                  <div className="agenda-kpi-value">{k.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="agenda-calendar-panel">
            <div className="panel-header">
              <span className="panel-title">📅 Calendário de Atividades</span>
              <div className="view-toggle">
                {viewBtns.map((v) => (
                  <button key={v.id} type="button" className={`view-toggle-btn ${calendarView === v.id ? 'active' : ''}`} onClick={() => setCalendarView(v.id)}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="agenda-calendar-body">
              <FullCalendar
                ref={calRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                initialView={calendarView}
                locale="pt-br"
                events={calendarEvents}
                height="100%"
                headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                dayMaxEvents={3}
                moreLinkContent={(args: any) => `+${args.num} mais`}
                moreLinkClick={(args: any) => {
                  const day = args.date.toISOString().slice(0, 10);
                  const ids = schedule.filter((s) => s.start.slice(0, 10) === day).map((s) => s.id.toString());
                  const label = args.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                  setModalDay({ date: label, ids });
                  return 'prevent';
                }}
                eventContent={(arg: any) => {
                  const grouped = arg.event.extendedProps._grouped;
                  const tipo = arg.event.extendedProps.tipo || '';
                  const color = tipoColor[tipo] || '#2d7ef0';
                  const count = grouped ? arg.event.extendedProps._ids?.length : null;
                  return (
                    <div className={grouped ? 'cal-event-grouped' : 'cal-event-single'} style={{ background: color }}>
                      {grouped ? (
                        <>
                          <span className="cal-event-count">{count}</span>
                          <span className="cal-event-label">{tipo}</span>
                        </>
                      ) : (
                        <>
                          <span className="cal-event-dot" />
                          <span className="cal-event-text">{arg.event.title}</span>
                        </>
                      )}
                    </div>
                  );
                }}
                eventClick={(info: any) => {
                  if (info.event.extendedProps._grouped) {
                    const ids: string[] = info.event.extendedProps._ids || [];
                    const day = info.event.extendedProps._day || '';
                    const label = new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                    setModalDay({ date: label, ids });
                    return;
                  }
                  const singleId = info.event.extendedProps._singleId;
                  if (!confirm(`Remover "${info.event.title}" da agenda?`)) return;
                  const id = Number(singleId || info.event.id);
                  const original = schedule.find((s) => s.id === id);
                  removeScheduleEvent(id);
                  if (original?.extendedProps.itemID) updateBacklogItem(original.extendedProps.itemID, { Status: 'Pendente Agendamento' });
                }}
              />
            </div>
          </div>
        </div>

        <div className="agenda-right">
          <div className="agenda-right-panel grow">
            <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="panel-title">
                  Pendentes de Agendamento{' '}
                  <span style={{ color: 'var(--accent-orange)' }}>({pendentes.length})</span>
                </span>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="form-input"
                  style={{ width: 120, fontSize: 12, padding: '5px 10px' }}
                />
              </div>

              {/* Filtros em cascata */}
              <div className="cascade-filters">


                {filterEmpresa && (
                  <select
                    className="form-input form-select cascade-select"
                    value={filterTipo}
                    onChange={(e) => { setFilterTipo(e.target.value); setFilterTecnico(''); }}
                  >
                    <option value="">🔧 Tipo...</option>
                    {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}

                {filterEmpresa && filterTipo && (
                  <select
                    className="form-input form-select cascade-select"
                    value={filterTecnico}
                    onChange={(e) => setFilterTecnico(e.target.value)}
                  >
                    <option value="">👤 Técnico...</option>
                    {tecnicos.map((t) => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                  </select>
                )}

                {filterEmpresa && (
                  <button
                    type="button"
                    className="cascade-clear"
                    onClick={() => { setFilterEmpresa(''); setFilterTipo(''); setFilterTecnico(''); }}
                    title="Limpar filtros"
                  >✕</button>
                )}
              </div>

              {/* Tags dos filtros ativos */}
              {(filterEmpresa || filterTipo || filterTecnico) && (
                <div className="cascade-tags">
                  {filterEmpresa && <span className="cascade-tag">{filterEmpresa}</span>}
                  {filterTipo && (
                    <span className="cascade-tag" style={{ background: `${tipoColor[filterTipo]}22`, color: tipoColor[filterTipo], borderColor: `${tipoColor[filterTipo]}44` }}>
                      {filterTipo}
                    </span>
                  )}
                  {filterTecnico && <span className="cascade-tag cascade-tag-tec">👤 {filterTecnico}</span>}
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {pendentes.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>✓ Nenhuma ordem pendente</div>
              ) : (
                pendentes.map((item) => (
                  <PendingCard 
                    key={item.ID} 
                    item={item} 
                    tecnicos={tecnicos} 
                    onAgendar={handleAgendar}
                    onUpdateItem={(id, updates) => updateBacklogItem(id, updates)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {modalDay && (
        <DayEventsModal
          date={modalDay.date}
          events={modalEvents}
          onClose={() => setModalDay(null)}
          onRemove={handleRemoveFromModal}
        />
      )}
    </div>
  );
}
