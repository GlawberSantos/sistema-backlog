import { useState, useEffect } from 'react';
import { 
  getRelatorioTecnico, 
  getRelatorioRegiao, 
  getRelatorioTempoMedio,
  getRelatorioConcluidos
} from '../services/apiService';
import { Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to get titles and headers for reports
const getReportConfig = (relatorioAtivo, dados) => {
  switch (relatorioAtivo) {
    case 'tecnico':
      return {
        title: 'Backlog por UF',
        headers: [['UF', 'AC', 'Falta RFB', 'Pend. Comercial', 'Pend. Material', 'Tecnica', 'Total']],
        body: dados.map(item => [item.uf || 'Não informado', item.ac || 0, item.em_execucao || 0, item.pendente_comercial || 0, item.pendente_material || 0, item.concluido || 0, item.total || 0]),
      };
    case 'regiao':
      return {
        title: 'Backlog por Região',
        headers: [['Cidade', 'AC', 'Falta RFB', 'Pend. Comercial', 'Pend. Material', 'Tecnica', 'Total']],
        body: dados.map(item => [item.cidade, item.ac || 0, item.em_execucao || 0, item.pendente_comercial || 0, item.pendente_material || 0, item.concluido || 0, item.total || 0]),
      };
    case 'tempo':
       return {
        title: 'Tempo Médio de Atendimento',
        headers: [['Tipo de Serviço', 'Tempo Médio (dias)']],
        body: dados.map(item => [item.tipo_servico, parseFloat(item.tempo_medio_dias || 0).toFixed(1)]),
      };
    case 'concluidos':
      return {
        title: 'Serviços Tecnicas por Período',
        headers: [['Data', 'Total']],
        body: dados.map(item => [new Date(item.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}), item.total]),
      };
    default:
      return { title: 'Relatório', headers: [], body: [] };
  }
};


function Relatorios() {
  const [relatorioAtivo, setRelatorioAtivo] = useState('tecnico');
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [dateRange, setDateRange] = useState({
    inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    carregarRelatorio();
  }, [relatorioAtivo]);

  const carregarRelatorio = async () => {
    setCarregando(true);
    try {
      let data;
      switch (relatorioAtivo) {
        case 'tecnico':
          data = await getRelatorioTecnico();
          break;
        case 'regiao':
          data = await getRelatorioRegiao();
          break;
        case 'tempo':
          data = await getRelatorioTempoMedio();
          break;
        case 'concluidos':
          if (dateRange.inicio && dateRange.fim) {
            data = await getRelatorioConcluidos(dateRange.inicio, dateRange.fim);
          } else {
            data = [];
          }
          break;
        default:
          data = [];
      }
      setDados(data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarConcluidos = () => {
    if (relatorioAtivo === 'concluidos') {
      carregarRelatorio();
    }
  }

  const exportarExcel = () => {
    const { title } = getReportConfig(relatorioAtivo, dados);
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportarPDF = () => {
    const { title, headers, body } = getReportConfig(relatorioAtivo, dados);
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    doc.autoTable({
      startY: 20,
      head: headers,
      body: body,
    });
    doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderTabela = () => {
    if (dados.length === 0) return <div className="p-8 text-center text-gray-600">Nenhum dado disponível para este relatório.</div>;
    const { headers, body } = getReportConfig(relatorioAtivo, dados);
    
    return (
       <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            {headers[0].map((header, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {body.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-sm text-gray-800">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText size={24}/>Relatórios</h1>
        <div className="flex gap-2">
           <button onClick={exportarExcel} disabled={dados.length === 0} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
            <Download size={20} /><span>Exportar Excel</span>
          </button>
          <button onClick={exportarPDF} disabled={dados.length === 0} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
            <Download size={20} /><span>Exportar PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRelatorioAtivo('tecnico')} className={`px-4 py-2 rounded-lg transition ${relatorioAtivo === 'tecnico' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Backlog por UF</button>
          <button onClick={() => setRelatorioAtivo('regiao')} className={`px-4 py-2 rounded-lg transition ${relatorioAtivo === 'regiao' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Backlog por Região</button>
          <button onClick={() => setRelatorioAtivo('tempo')} className={`px-4 py-2 rounded-lg transition ${relatorioAtivo === 'tempo' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Tempo Médio</button>
          <button onClick={() => setRelatorioAtivo('concluidos')} className={`px-4 py-2 rounded-lg transition ${relatorioAtivo === 'concluidos' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Tecnicas por Período</button>
        </div>
        {relatorioAtivo === 'concluidos' && (
          <div className="flex flex-wrap items-end gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input type="date" value={dateRange.inicio} onChange={e => setDateRange(prev => ({...prev, inicio: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input type="date" value={dateRange.fim} onChange={e => setDateRange(prev => ({...prev, fim: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
            </div>
            <button onClick={handleGerarConcluidos} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">Gerar</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {carregando ? <div className="p-8 text-center text-gray-600">Carregando...</div> : renderTabela()}
      </div>
    </div>
  );
}

export default Relatorios;
