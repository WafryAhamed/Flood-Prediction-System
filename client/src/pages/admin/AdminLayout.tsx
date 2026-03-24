import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquare, Building2, Radio, Database, BarChart3, ShieldAlert, Sprout, RefreshCw, Activity, FileText, LogOut, Monitor, Wrench, Users, Bot } from 'lucide-react';
import { AIAssistant } from '../../components/admin/AIAssistant';
export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    navigate('/admin/login', { replace: true });
  };
  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };
  const navItems = [
    { path: '/admin', label: 'Command Center', icon: LayoutDashboard },
    { path: '/admin/situation-room', label: 'Situation Room', icon: Activity },
    { path: '/admin/model-control', label: 'Model Control', icon: ShieldAlert },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
    { path: '/admin/districts', label: 'Districts', icon: Map },
    { path: '/admin/facilities', label: 'Facilities', icon: Building2 },
    { path: '/admin/infrastructure', label: 'Infrastructure', icon: Activity },
    { path: '/admin/agriculture', label: 'Agriculture', icon: Sprout },
    { path: '/admin/recovery', label: 'Recovery', icon: RefreshCw },
    { path: '/admin/broadcast', label: 'Broadcast', icon: Radio },
    { path: '/admin/data', label: 'Data Upload', icon: Database },
    { path: '/admin/audit', label: 'Audit Logs', icon: BarChart3 },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  ];
  return <div className="min-h-screen bg-bg-dark text-gray-200 font-sans admin-theme flex flex-col">
      {/* Top Bar */}
      <header className="bg-bg-sidebar h-16 flex items-center justify-between px-8 border-b border-gray-700 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#DC2626]"></div>
            <h1 className="font-bold uppercase tracking-widest text-blue-400 text-base">
              National Flood Ops Center
            </h1>
          </div>
          <div className="h-5 w-[1px] bg-gray-700"></div>
          <div className="text-xs font-semibold text-gray-400">
            DEFCON 4 • MONITORING
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-white">CMD. PERERA</div>
            <div className="text-[10px] font-semibold text-green-400">
              SUPER_ADMIN
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-700 border border-gray-600 flex items-center justify-center rounded-lg">
            <span className="font-bold text-xs text-white">CP</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
            <span className="hidden xl:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-bg-sidebar border-r border-gray-700 hidden lg:flex flex-col z-10">
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {navItems.map(item => <Link key={item.path} to={item.path} className={`
                  flex items-center gap-3 px-4 py-3 border-l-4 transition-colors rounded-lg text-sm font-semibold uppercase tracking-wide
                  ${isActive(item.path) ? 'bg-blue-600/20 border-l-blue-400 text-blue-400' : 'border-l-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white'}
                `}>
                <item.icon size={20} />
                <span>
                  {item.label}
                </span>
              </Link>)}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 font-semibold space-y-1">
              <div>SYS: v2.4.1-STABLE</div>
              <div>LAT: 5ms</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-900 relative">
          {/* Grid Background Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-5" style={{
          backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

          <div className="p-8 relative z-0">
            <Outlet />
          </div>
        </main>
      </div>

      <AIAssistant />
    </div>;
}