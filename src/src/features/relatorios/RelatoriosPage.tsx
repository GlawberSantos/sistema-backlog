// src/features/relatorios/RelatoriosPage.tsx
import { useAppStore } from '../../store/useAppStore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function RelatoriosPage() {
  const { schedule, data } = useAppStore();
  const today = new Date();

  const atividadesHoje = schedule.filter(e => 
    new Date(e.start).toDateString() === today.toDateString()
  );

  const atividadesMes = schedule.filter(e => {
    const d = new Date(e.start);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const atrasadas = data.filter(
    (item) => new Date(item.Prazo) < today && item.Status !== 'Concluído'
  );
  const emExecucao = schedule.filter((e) => e.extendedProps.status === 'Em Execução').length;

  const exportExcel = (tipo: string) => {
    let dados;
    let nomeArquivo;

    if (tipo === 'hoje') {
      dados = atividadesHoje.map(e => ({
        Cliente: e.extendedProps.cliente,
        Tipo: e.extendedProps.tipo,
        Técnico: e.extendedProps.tecnico,
        Status: e.extendedProps.status,
        Data: new Date(e.start).toLocaleDateString('pt-BR')
      }));
      nomeArquivo = 'atividades_hoje.xlsx';
    } else {
      dados = atividadesMes.map(e => ({
        Cliente: e.extendedProps.cliente,
        Tipo: e.extendedProps.tipo,
        Técnico: e.extendedProps.tecnico,
        Data: new Date(e.start).toLocaleDateString('pt-BR'),
        Status: e.extendedProps.status
      }));
      nomeArquivo = 'agenda_mes.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, nomeArquivo);
  };

  const exportPDF = (tipo: string) => {
    const doc = new jsPDF();
    doc.text(tipo === 'hoje' ? "Atividades do Dia" : "Agenda do Mês", 14, 15);

    const dados = tipo === 'hoje' ? atividadesHoje : atividadesMes;

    const tableData = dados.map(e => [
      e.extendedProps.cliente,
      e.extendedProps.tipo,
      e.extendedProps.tecnico,
      new Date(e.start).toLocaleDateString('pt-BR'),
      e.extendedProps.status
    ]);

    (doc as any).autoTable({
      head: [['Cliente', 'Tipo', 'Técnico', 'Data', 'Status']],
      body: tableData,
      startY: 25,
      styles: { fontSize: 10 }
    });

    doc.save(tipo === 'hoje' ? 'atividades_hoje.pdf' : 'agenda_mes.pdf');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 0 }}>
        {/* Hoje */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">📅 Atividades do Dia</span>
          </div>
          <div className="panel-body">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Exportar relatório das atividades agendadas para hoje.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => exportExcel('hoje')} className="btn btn-success">
              ↓ Excel
              </button>
              <button onClick={() => exportPDF('hoje')} className="btn btn-danger">
              ↓ PDF
              </button>
            </div>
          </div>
        </div>

        {/* Mês */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">📊 Agenda do Mês</span>
          </div>
          <div className="panel-body">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Exportar relatório completo do mês com filtros.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => exportExcel('mes')} className="btn btn-success">
              ↓ Excel
              </button>
              <button onClick={() => exportPDF('mes')} className="btn btn-danger">
              ↓ PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Resumo do Mês</span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-panel)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: "'JetBrains Mono', monospace" }}>{schedule.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Atividades Agendadas</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-panel)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>{emExecucao}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Em Execução</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-panel)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-orange)', fontFamily: "'JetBrains Mono', monospace" }}>{atrasadas.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Atrasadas</div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
            Resumo referente a {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}