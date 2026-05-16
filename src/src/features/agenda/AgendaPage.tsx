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
};

export default function AgendaPage() {
  const { data, schedule, addScheduleEvent, removeScheduleEvent, updateBacklogItem, users } = useAppStore();
  const [pendingSearch, setPendingSearch] = useState('');
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
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

  const calendarEvents = schedule.map((event) => ({
    id: event.id.toString(),
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: tipoColor[event.extendedProps.tipo] || '#2d7ef0',
    borderColor: 'transparent',
  }));

  const pendentes = data
    .filter((d) => d.Status === 'Pendente Agendamento')
    .filter(
      (d) =>
        !pendingSearch ||
        d.Cliente.toLowerCase().includes(pendingSearch.toLowerCase()) ||
        (d.Pedido || '').toLowerCase().includes(pendingSearch.toLowerCase()) ||
        (d.Cidade || '').toLowerCase().includes(pendingSearch.toLowerCase())
    );

  const tecnicos = users.filter((u) => u.nivel === 'Técnico' && u.status === 'Ativo');

  const handleAgendar = (
    item: { ID: string; Pedido?: string; Cliente: string; Tipo: string },
    tecnico: string,
    date: string
  ) => {
    if (!tecnico || !date) {
      alert('Selecione técnico e data');
      return;
    }

    const newEvent = {
      id: Date.now(),
      title: `${item.Pedido || item.ID} - ${item.Cliente}`,
      start: `${date}T08:00:00`,
      extendedProps: {
        tipo: item.Tipo || 'Ativação',
        tecnico: tecnico,
        cliente: item.Cliente,
        status: 'Agendado',
        pon: item.Pedido || item.ID,
        itemID: item.ID,
      },
    };

    addScheduleEvent(newEvent);

    updateBacklogItem(item.ID, {
      Status: 'Planejado',
    });
  };

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
                <div className="agenda-kpi-icon" style={{ background: k.iconBg }}>
                  {k.icon}
                </div>
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
                  <button
                    key={v.id}
                    type="button"
                    className={`view-toggle-btn ${calendarView === v.id ? 'active' : ''}`}
                    onClick={() => setCalendarView(v.id)}
                  >
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
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: '',
                }}
                eventClick={(info) => {
                  if (!confirm(`Remover "${info.event.title}" da agenda?`)) return;
                  const id = Number(info.event.id);
                  const original = schedule.find((s) => s.id === id);
                  removeScheduleEvent(id);
                  if (original?.extendedProps.itemID) {
                    updateBacklogItem(original.extendedProps.itemID, { Status: 'Pendente Agendamento' });
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="agenda-right">
          <div className="agenda-right-panel grow">
            <div className="panel-header">
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
                style={{ width: 160, fontSize: 12, padding: '6px 10px' }}
              />
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {pendentes.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>✓ Nenhuma ordem pendente</div>
              ) : (
                pendentes.map((item) => (
                  <div key={item.ID} className="pending-card">
                    <div className="pending-card-header">
                      <span className="pending-card-id">{item.Pedido || item.ID}</span>
                      <TypePill tipo={item.Tipo} />
                    </div>
                    <div className="pending-card-title">{item.Cliente}</div>
                    <div className="pending-card-sub">
                      {item.Cidade} / {item.UF}
                    </div>
                    <div className="pending-card-form">
                      <select id={`tec-${item.ID}`} className="form-input form-select" style={{ fontSize: 11 }}>
                        <option value="">Selecione Técnico</option>
                        {tecnicos.map((t) => (
                          <option key={t.id} value={t.nome}>
                            {t.nome}
                          </option>
                        ))}
                      </select>
                      <input type="date" id={`date-${item.ID}`} className="form-input" style={{ fontSize: 11 }} />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const tecnico = (document.getElementById(`tec-${item.ID}`) as HTMLSelectElement).value;
                          const date = (document.getElementById(`date-${item.ID}`) as HTMLInputElement).value;
                          handleAgendar(item, tecnico, date);
                        }}
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
