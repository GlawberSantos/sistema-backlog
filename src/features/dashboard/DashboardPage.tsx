// src/features/dashboard/DashboardPage.tsx
import { useEffect, useRef, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import Chart from 'chart.js/auto';

const UFS_ORDER = ['AL', 'BA', 'CE', 'PB', 'PE', 'PI', 'RN', 'SE'];

type Item = ReturnType<typeof useAppStore.getState>['data'][0];

// ── helpers ───────────────────────────────────────────────────────────────────
function getTarefaDraft(item: Item): string {
  const v = String(item.TarefaAtualDraft ?? '').trim();
  return v === '' ? '(vazio)' : v;
}
function isRedeOk(item: Item) {
  const c = String(item.Classificacao_rede ?? '').trim().toUpperCase();
  return c === 'REDE OK';
}
function isRedePendente(item: Item) {
  const c = String(item.Classificacao_rede ?? '').trim().toUpperCase();
  return c === 'REDE PENDENTE';
}
function isPCC(item: Item) {
  return (item.Carteira || '').toUpperCase() === 'PCC';
}
function diasCarteira(item: Item): number {
  return parseInt(String(item.Dias_CarteiraAtual || '0')) || 0;
}

// ── sub-components ────────────────────────────────────────────────────────────
const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#4a5a7a', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap', background: '#0a0f1a', borderBottom: '1px solid #1e2e4a' }}>
    {children}
  </th>
);
const TD = ({ children, right, bold, color }: { children: React.ReactNode; right?: boolean; bold?: boolean; color?: string }) => (
  <td style={{ padding: '5px 10px', fontSize: 12, textAlign: right ? 'right' : 'left', fontWeight: bold ? 700 : 400, color: color || '#e8edf5', borderBottom: '1px solid #0f1829', whiteSpace: 'nowrap' }}>
    {children}
  </td>
);
const SectionTitle = ({ children, accent }: { children: React.ReactNode; accent: string }) => (
  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: accent, marginBottom: 0, paddingBottom: 0 }}>
    {children}
  </div>
);
const KPI = ({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) => (
  <div style={{ background: '#0f1829', border: `1px solid ${color}30`, borderRadius: 10, padding: '14px 16px', flex: 1, minWidth: 100 }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5a7a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: '#4a5a7a', marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function DashboardPage() {
  const { data, currentUser } = useAppStore();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartInst = useRef<Chart | null>(null);
  const pieChartInst = useRef<Chart | null>(null);

  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  // ── cálculos principais ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = data.length;
    const pcc = data.filter(isPCC);
    const redeOk = data.filter(isRedeOk);
    const redePend = data.filter(isRedePendente);

    const ufsPresentes = [...new Set(data.map(d => d.UF).filter(Boolean))].sort((a, b) => {
      const ia = UFS_ORDER.indexOf(a), ib = UFS_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1; if (ib === -1) return -1;
      return ia - ib;
    });

    const buildTarefaDraftTable = (subset: Item[]) => {
      const filas = [...new Set(subset.map(d => getTarefaDraft(d)))].sort((a, b) => {
        if (a === '(vazio)') return -1;
        if (b === '(vazio)') return 1;
        return a.localeCompare(b);
      });
      return filas.map(fila => {
        const row: Record<string, number | string> = { fila, total: 0 };
        ufsPresentes.forEach(uf => {
          const cnt = subset.filter(d => getTarefaDraft(d) === fila && d.UF === uf).length;
          row[uf] = cnt;
          (row.total as number) += cnt;
        });
        return row;
      });
    };

    const tarefaOkTable = buildTarefaDraftTable(redeOk);
    const tarefaPendTable = buildTarefaDraftTable(redePend);

    const totaisOkPorUF   = Object.fromEntries(ufsPresentes.map(uf => [uf, redeOk.filter(d => d.UF === uf).length]));
    const totaisPendPorUF = Object.fromEntries(ufsPresentes.map(uf => [uf, redePend.filter(d => d.UF === uf).length]));
    const totaisGeraisPorUF = Object.fromEntries(ufsPresentes.map(uf => [uf, data.filter(d => d.UF === uf).length]));

    const pccOk   = pcc.filter(isRedeOk);
    const pccPend = pcc.filter(isRedePendente);
    const pccOkPorUF   = Object.fromEntries(ufsPresentes.map(uf => [uf, pccOk.filter(d => d.UF === uf).length]));
    const pccPendPorUF = Object.fromEntries(ufsPresentes.map(uf => [uf, pccPend.filter(d => d.UF === uf).length]));

    const aging = (subset: Item[]) => ({
      a15:  subset.filter(d => diasCarteira(d) <= 15).length,
      a45:  subset.filter(d => diasCarteira(d) > 15 && diasCarteira(d) <= 45).length,
      a60:  subset.filter(d => diasCarteira(d) > 45 && diasCarteira(d) <= 60).length,
      gt60: subset.filter(d => diasCarteira(d) > 60).length,
    });
    const agingOk   = aging(pccOk);
    const agingPend = aging(pccPend);

    return {
      total, ufsPresentes,
      redeOk: redeOk.length, redePend: redePend.length,
      tarefaOkTable, tarefaPendTable,
      totaisOkPorUF, totaisPendPorUF, totaisGeraisPorUF,
      pcc: pcc.length, pccOk: pccOk.length, pccPend: pccPend.length,
      pccOkPorUF, pccPendPorUF,
      agingOk, agingPend,
    };
  }, [data]);

  // ── gráficos ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (barChartRef.current) {
      if (barChartInst.current) barChartInst.current.destroy();
      barChartInst.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: stats.ufsPresentes,
          datasets: [{
            label: 'Total',
            data: stats.ufsPresentes.map(uf => stats.totaisGeraisPorUF[uf] || 0),
            backgroundColor: 'rgba(99,60,180,0.75)',
            borderColor: '#6b3cb4',
            borderWidth: 1,
            borderRadius: 4,
          }],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, title: { display: true, text: 'Total Geral por UF', color: '#e8edf5', font: { size: 13, weight: 'bold' } } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#1e2e4a' }, ticks: { color: '#8a9bbf' } },
            x: { grid: { color: '#1e2e4a' }, ticks: { color: '#8a9bbf' } },
          },
        },
      });
    }

    if (pieChartRef.current) {
      if (pieChartInst.current) pieChartInst.current.destroy();
      pieChartInst.current = new Chart(pieChartRef.current, {
        type: 'pie',
        data: {
          labels: ['REDE OK', 'REDE PENDENTE'],
          datasets: [{
            data: [stats.redeOk, stats.redePend],
            backgroundColor: ['#4472c4', '#c0504d'],
            borderWidth: 2,
            borderColor: '#0a0f1a',
          }],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Status Rede', color: '#e8edf5', font: { size: 13, weight: 'bold' } },
            legend: { position: 'right', labels: { color: '#8a9bbf', padding: 14, font: { size: 11 } } },
          },
        },
      });
    }

    return () => {
      if (barChartInst.current) barChartInst.current.destroy();
      if (pieChartInst.current) pieChartInst.current.destroy();
    };
  }, [stats]);

  // ── exportar Excel (Tabelas Dinâmicas reais via OOXML) ────────────────────
  const exportExcel = async () => {
    setExporting('excel');
    try {
      const { exportDashboardExcel } = await import('../../utils/exportDashboardExcel');
      const dateStr = new Date().toISOString().slice(0, 10);
      await exportDashboardExcel({
        data: data as Record<string, string | number | null | undefined>[],
        stats: {
          total: stats.total,
          redeOk: stats.redeOk,
          redePend: stats.redePend,
          pcc: stats.pcc,
          pccOk: stats.pccOk,
          pccPend: stats.pccPend,
        },
        filename: `SMRA_Dashboard_${dateStr}.xlsx`,
      });
    } finally {
      setExporting(null);
    }
  };

  // ── exportar PDF ───────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    setExporting('pdf');
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#07101f',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pageW = 297; // A4 landscape mm
      const pageH = 210;
      const imgW = pageW;
      const imgH = (canvas.height * pageW) / canvas.width;

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      let yOffset = 0;
      let pageCount = 0;
      while (yOffset < imgH) {
        if (pageCount > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, imgW, imgH);
        yOffset += pageH;
        pageCount++;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`SMRA_Dashboard_${dateStr}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  const ufs = stats.ufsPresentes;

  // ── estilos dos botões de exportação ──────────────────────────────────────
  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 8,
    fontSize: 12, fontWeight: 600,
    cursor: exporting ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s',
    opacity: exporting ? 0.65 : 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Barra superior: banner usuário + botões export ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {currentUser && (
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
            background: currentUser.nivel === 'Administrador' ? '#e8555512' : currentUser.nivel === 'Supervisor' ? '#2d7ef012' : '#0eb88a12',
            border: `1px solid ${currentUser.nivel === 'Administrador' ? '#e8555530' : currentUser.nivel === 'Supervisor' ? '#2d7ef030' : '#0eb88a30'}`,
            borderRadius: 8, fontSize: 12,
            color: currentUser.nivel === 'Administrador' ? '#e85555' : currentUser.nivel === 'Supervisor' ? '#4d9ef8' : '#0eb88a',
          }}>
            <span>{currentUser.nivel === 'Administrador' ? '🔑' : currentUser.nivel === 'Supervisor' ? '👁' : '🔧'}</span>
            <span><strong>{currentUser.nome}</strong> — {currentUser.nivel} · UF(s): {currentUser.uf}</span>
          </div>
        )}

        {/* ── Botões de exportação ── */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={exportExcel}
            disabled={exporting !== null}
            title="Exportar dashboard para Excel (.xlsx)"
            style={{
              ...btnBase,
              border: '1px solid #1a7a3c',
              background: exporting === 'excel' ? '#0d3a1e' : '#0f2a1a',
              color: exporting === 'excel' ? '#4a8a5a' : '#22c55e',
            }}
          >
            {/* ícone planilha */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="16" y2="17"/>
              <line x1="8" y1="9" x2="10" y2="9"/>
            </svg>
            {exporting === 'excel' ? 'Gerando…' : 'Exportar Excel'}
          </button>

          <button
            onClick={exportPDF}
            disabled={exporting !== null}
            title="Exportar dashboard para PDF"
            style={{
              ...btnBase,
              border: '1px solid #7a2020',
              background: exporting === 'pdf' ? '#3a0d0d' : '#2a0f0f',
              color: exporting === 'pdf' ? '#8a4a4a' : '#ef4444',
            }}
          >
            {/* ícone PDF */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="M9 15v-4h3a2 2 0 0 1 0 4H9z"/>
              <line x1="14" y1="13" x2="17" y2="13"/>
              <line x1="14" y1="17" x2="17" y2="17"/>
            </svg>
            {exporting === 'pdf' ? 'Gerando…' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* ── Conteúdo capturado para PDF ── */}
      <div ref={dashboardRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── KPIs ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <KPI label="Total Backlog" value={stats.total}    color="#2d7ef0" />
          <KPI label="Rede OK"       value={stats.redeOk}   color="#0eb88a" />
          <KPI label="Rede Pendente" value={stats.redePend}  color="#e85555" />
          <KPI label="PCC Total"     value={stats.pcc}       color="#8b5cf6" />
          <KPI label="PCC OK"        value={stats.pccOk}     color="#0eb88a" />
          <KPI label="PCC Pendente"  value={stats.pccPend}   color="#f5882a" />
        </div>

        {/* ── STATUS REDE × TAREFA ATUAL DRAFT ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* REDE OK */}
          <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#0a3a28', borderBottom: '1px solid #0eb88a30', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0eb88a', flexShrink: 0 }} />
              <SectionTitle accent="#0eb88a">STATUS REDE × FILA DRAFT — REDE OK</SectionTitle>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>Fila Draft (TarefaAtualDraft)</TH>
                    {ufs.map(uf => <TH key={uf} right>{uf}</TH>)}
                    <TH right>Total</TH>
                  </tr>
                </thead>
                <tbody>
                  {stats.tarefaOkTable.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#0a0f1a' : '#0d1420' }}>
                      <TD>{String(row.fila)}</TD>
                      {ufs.map(uf => <TD key={uf} right>{Number(row[uf]) || 0}</TD>)}
                      <TD right bold color="#0eb88a">{Number(row.total)}</TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#0a3a28' }}>
                    <TD bold color="#0eb88a">Total Geral</TD>
                    {ufs.map(uf => <TD key={uf} right bold color="#0eb88a">{stats.totaisOkPorUF[uf] || 0}</TD>)}
                    <TD right bold color="#0eb88a">{stats.redeOk}</TD>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* REDE PENDENTE */}
          <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#3a1010', borderBottom: '1px solid #e8555530', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e85555', flexShrink: 0 }} />
              <SectionTitle accent="#e85555">STATUS REDE × FILA DRAFT — REDE PENDENTE</SectionTitle>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>Fila Draft (TarefaAtualDraft)</TH>
                    {ufs.map(uf => <TH key={uf} right>{uf}</TH>)}
                    <TH right>Total</TH>
                  </tr>
                </thead>
                <tbody>
                  {stats.tarefaPendTable.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#0a0f1a' : '#0d1420' }}>
                      <TD>{String(row.fila)}</TD>
                      {ufs.map(uf => <TD key={uf} right>{Number(row[uf]) || 0}</TD>)}
                      <TD right bold color="#e85555">{Number(row.total)}</TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#3a1a1a' }}>
                    <TD bold color="#e85555">Total Geral</TD>
                    {ufs.map(uf => <TD key={uf} right bold color="#e85555">{stats.totaisPendPorUF[uf] || 0}</TD>)}
                    <TD right bold color="#e85555">{stats.redePend}</TD>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ── Backlog PCC + Aging ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* Backlog PCC */}
          <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#1a1040', borderBottom: '1px solid #8b5cf630', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
              <SectionTitle accent="#8b5cf6">Backlog PCC: Dados + Voz</SectionTitle>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>Status Rede</TH>
                    {ufs.map(uf => <TH key={uf} right>{uf}</TH>)}
                    <TH right>Total</TH>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#0a0f1a' }}>
                    <TD>REDE OK</TD>
                    {ufs.map(uf => <TD key={uf} right>{stats.pccOkPorUF[uf] || 0}</TD>)}
                    <TD right bold color="#0eb88a">{stats.pccOk}</TD>
                  </tr>
                  <tr style={{ background: '#0d1420' }}>
                    <TD>REDE PENDENTE</TD>
                    {ufs.map(uf => <TD key={uf} right>{stats.pccPendPorUF[uf] || 0}</TD>)}
                    <TD right bold color="#e85555">{stats.pccPend}</TD>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: '#1a1040' }}>
                    <TD bold color="#8b5cf6">Total Geral</TD>
                    {ufs.map(uf => <TD key={uf} right bold color="#8b5cf6">{(stats.pccOkPorUF[uf] || 0) + (stats.pccPendPorUF[uf] || 0)}</TD>)}
                    <TD right bold color="#8b5cf6">{stats.pcc}</TD>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Aging PCC */}
          <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#1a200a', borderBottom: '1px solid #f5882a30', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5882a', flexShrink: 0 }} />
              <SectionTitle accent="#f5882a">Backlog PCC: Aging (Dias Carteira)</SectionTitle>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>Status Rede</TH>
                    <TH right>0–15</TH>
                    <TH right>16–45</TH>
                    <TH right>46–60</TH>
                    <TH right>&gt;60</TH>
                    <TH right>Total</TH>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#0a0f1a' }}>
                    <TD>REDE OK</TD>
                    <TD right color="#0eb88a">{stats.agingOk.a15}</TD>
                    <TD right color="#f5882a">{stats.agingOk.a45}</TD>
                    <TD right color="#e85555">{stats.agingOk.a60}</TD>
                    <TD right color="#e85555">{stats.agingOk.gt60}</TD>
                    <TD right bold color="#0eb88a">{stats.pccOk}</TD>
                  </tr>
                  <tr style={{ background: '#0d1420' }}>
                    <TD>REDE PENDENTE</TD>
                    <TD right color="#0eb88a">{stats.agingPend.a15}</TD>
                    <TD right color="#f5882a">{stats.agingPend.a45}</TD>
                    <TD right color="#e85555">{stats.agingPend.a60}</TD>
                    <TD right color="#e85555">{stats.agingPend.gt60}</TD>
                    <TD right bold color="#e85555">{stats.pccPend}</TD>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: '#1a200a' }}>
                    <TD bold color="#f5882a">Total Geral</TD>
                    <TD right bold color="#f5882a">{stats.agingOk.a15 + stats.agingPend.a15}</TD>
                    <TD right bold color="#f5882a">{stats.agingOk.a45 + stats.agingPend.a45}</TD>
                    <TD right bold color="#f5882a">{stats.agingOk.a60 + stats.agingPend.a60}</TD>
                    <TD right bold color="#f5882a">{stats.agingOk.gt60 + stats.agingPend.gt60}</TD>
                    <TD right bold color="#f5882a">{stats.pcc}</TD>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ── Gráficos ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, padding: 16 }}>
            <div style={{ height: 240 }}>
              <canvas ref={barChartRef} />
            </div>
          </div>
          <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, padding: 16 }}>
            <div style={{ height: 240 }}>
              <canvas ref={pieChartRef} />
            </div>
          </div>
        </div>

      </div>{/* fim dashboardRef */}
    </div>
  );
}