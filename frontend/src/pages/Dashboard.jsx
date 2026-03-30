import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/apiService';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const cards = [
    {
      title: 'Total Backlog',
      value: stats?.totalBacklog || 0,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      title: 'Em Andamento',
      value: stats?.emAndamento || 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Tecnicas',
      value: stats?.concluidos || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Atrasados',
      value: stats?.atrasados || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição por Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.porStatus || []}
                dataKey="total"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(stats?.porStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Backlog por Cidade (Top 10)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.porCidade || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cidade" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Backlog por UF (Top 10)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.porUF || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="uf" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição por Tipo de Serviço</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.porTipoServico || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo_servico" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
