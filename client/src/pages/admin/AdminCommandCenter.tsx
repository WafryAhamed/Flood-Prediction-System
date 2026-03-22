import React, { useState, Suspense } from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Building2,
  Settings,
  AlertTriangle,
  Activity,
  Sprout,
  Wrench,
  MapPin,
  BookOpen,
  History,
} from 'lucide-react';
import { useAdminCentralStore } from '../../stores/adminCentralStore';

// Lazy load tab components
const SituationRoomTab = React.lazy(() => import('./tabs/SituationRoomTab'));
const UsersTab = React.lazy(() => import('./tabs/UsersTab'));
const ReportsTab = React.lazy(() => import('./tabs/ReportsTab'));
const ResourcesTab = React.lazy(() => import('./tabs/ResourcesTab'));
const WeatherTab = React.lazy(() => import('./tabs/WeatherTab'));
const SettingsTab = React.lazy(() => import('./tabs/SettingsTab'));
const AgricultureTab = React.lazy(() => import('./tabs/AgricultureTab'));
const RecoveryTab = React.lazy(() => import('./tabs/RecoveryTab'));
const RoutesTab = React.lazy(() => import('./tabs/RoutesTab'));
const EducationTab = React.lazy(() => import('./tabs/EducationTab'));
const HistoryTab = React.lazy(() => import('./tabs/HistoryTab'));

type TabId = 'situation' | 'users' | 'reports' | 'resources' | 'weather' | 'settings' | 'agriculture' | 'recovery' | 'routes' | 'education' | 'history';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: boolean;
}

const TABS: TabConfig[] = [
  { id: 'situation', label: 'Situation Room', icon: LayoutDashboard, badge: true },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: MessageSquare, badge: true },
  { id: 'resources', label: 'Resources', icon: Building2 },
  { id: 'weather', label: 'Weather', icon: AlertTriangle },
  { id: 'agriculture', label: 'Agriculture', icon: Sprout },
  { id: 'recovery', label: 'Recovery', icon: Wrench },
  { id: 'routes', label: 'Routes', icon: MapPin },
  { id: 'education', label: 'Education', icon: BookOpen },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function TabIcon({
  icon: Icon,
  label,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={18} />
      <span className="hidden md:inline text-sm font-bold uppercase">{label}</span>
      {badge && (
        <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin">
        <Activity size={32} className="text-blue-400" />
      </div>
    </div>
  );
}

export function AdminCommandCenter() {
  const activeTab = useAdminCentralStore((s) => s.activeTab);
  const setActiveTab = useAdminCentralStore((s) => s.setActiveTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'situation':
        return <SituationRoomTab />;
      case 'users':
        return <UsersTab />;
      case 'reports':
        return <ReportsTab />;
      case 'resources':
        return <ResourcesTab />;
      case 'weather':
        return <WeatherTab />;
      case 'agriculture':
        return <AgricultureTab />;
      case 'recovery':
        return <RecoveryTab />;
      case 'routes':
        return <RoutesTab />;
      case 'education':
        return <EducationTab />;
      case 'history':
        return <HistoryTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <SituationRoomTab />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-blue-400">
              Command Center
            </h1>
            <p className="text-xs font-semibold text-gray-400 mt-1">
              Unified admin control dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-green-400 animate-pulse" />
            <span className="text-xs font-bold text-green-400">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-20 z-10 bg-gray-800 border-b border-gray-700 px-6 overflow-x-auto">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-400 text-blue-400'
                  : 'border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <TabIcon icon={tab.icon} label={tab.label} badge={tab.badge} />
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Suspense fallback={<LoadingSpinner />}>
            {renderTabContent()}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
