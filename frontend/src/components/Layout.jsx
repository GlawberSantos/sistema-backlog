import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  Users, 
  Upload, 
  LogOut,
  Menu,
  X,
  CalendarDays
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // Get user and logout from context
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout(); // Call logout from context
    navigate('/login');
  };

  const menuItems = useMemo(() => {
    const items = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/backlog', icon: ClipboardList, label: 'Backlog' },
      { path: '/agenda', icon: CalendarDays, label: 'Agenda Técnica' },
      { path: '/relatorios', icon: FileText, label: 'Relatórios' },
      { path: '/importar', icon: Upload, label: 'Importar Planilha' },
    ];
    if (user?.tipo_usuario === 'Administrador') {
      items.push({ path: '/usuarios', icon: Users, label: 'Usuários' });
    }
    return items;
  }, [user]);


  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`bg-primary-800 text-white w-64 fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30`}>
        <div className="p-6 flex items-center justify-between border-b border-primary-700">
          <h1 className="text-2xl font-bold">RedeX</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive 
                    ? 'bg-primary-700 text-white' 
                    : 'text-primary-100 hover:bg-primary-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-primary-700">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium">{user?.nome}</p>
            <p className="text-xs text-primary-300">{user?.tipo_usuario}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-primary-100 hover:bg-primary-700 transition"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-600"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              Sistema de Gestão Rede e Ativação
            </h2>
            <div className="w-10 md:hidden" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
