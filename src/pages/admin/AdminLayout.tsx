import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquare, Building2, Radio, Database, BarChart3, ShieldAlert, Sprout, RefreshCw, Activity, FileText } from 'lucide-react';
import { AIAssistant } from '../../components/admin/AIAssistant';
export function AdminLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const navItems = [{
    path: '/admin',
    label: 'Situation Room',
    icon: LayoutDashboard
  }, {
    path: '/admin/model-control',
    label: 'Model Ops',
    icon: Activity
  }, {
    path: '/admin/reports',
    label: 'Intel Hub',
    icon: MessageSquare
  }, {
    path: '/admin/districts',
    label: 'District Cmd',
    icon: Map
  }, {
    path: '/admin/facilities',
    label: 'Evac Ops',
    icon: Building2
  }, {
    path: '/admin/infrastructure',
    label: 'Infra Monitor',
    icon: ShieldAlert
  }, {
    path: '/admin/agriculture',
    label: 'Agri Console',
    icon: Sprout
  }, {
    path: '/admin/recovery',
    label: 'Recovery',
    icon: RefreshCw
  }, {
    path: '/admin/broadcast',
    label: 'Comms',
    icon: Radio
  }, {
    path: '/admin/data',
    label: 'Data',
    icon: Database
  }, {
    path: '/admin/audit',
    label: 'Audit',
    icon: FileText
  }, {
    path: '/admin/analytics',
    label: 'Research',
    icon: BarChart3
  }];
  return <div className="min-h-screen bg-[#0A1929] text-[#E0E0E0] font-sans admin-theme flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#050B14] h-14 flex items-center justify-between px-6 border-b border-[#1E4976] z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF1744] rounded-full animate-pulse shadow-[0_0_8px_#FF1744]"></div>
            <h1 className="font-bold uppercase tracking-widest text-[#00E5FF] text-sm">
              National Flood Ops Center
            </h1>
          </div>
          <div className="h-4 w-[1px] bg-[#1E4976]"></div>
          <div className="text-xs font-mono-cmd text-gray-400">
            DEFCON 4 • MONITORING
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-white">CMD. PERERA</div>
            <div className="text-[10px] font-mono-cmd text-[#00E676]">
              SUPER_ADMIN
            </div>
          </div>
          <div className="w-8 h-8 bg-[#132F4C] border border-[#1E4976] flex items-center justify-center">
            <span className="font-bold text-xs">CP</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#050B14] border-r border-[#1E4976] hidden md:flex flex-col z-10">
          <nav className="flex-1 overflow-y-auto py-4">
            {navItems.map(item => <Link key={item.path} to={item.path} className={`
                  flex items-center gap-3 px-4 py-3 border-l-2 transition-colors
                  ${isActive(item.path) ? 'bg-[#132F4C] border-[#00E5FF] text-[#00E5FF]' : 'border-transparent text-gray-400 hover:bg-[#132F4C]/50 hover:text-white'}
                `}>
                <item.icon size={18} />
                <span className="font-medium text-xs uppercase tracking-wide">
                  {item.label}
                </span>
              </Link>)}
          </nav>

          <div className="p-4 border-t border-[#1E4976]">
            <div className="text-[10px] text-gray-500 font-mono-cmd">
              SYS: v2.4.1-STABLE
              <br />
              LAT: 5ms
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#0A1929] relative">
          {/* Grid Background Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-5" style={{
          backgroundImage: 'linear-gradient(#1E4976 1px, transparent 1px), linear-gradient(90deg, #1E4976 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

          <div className="p-6 relative z-0">
            <Outlet />
          </div>
        </main>
      </div>

      <AIAssistant />
    </div>;
}