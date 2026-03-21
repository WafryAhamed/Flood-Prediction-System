import React, { useState } from 'react';
import {
  Monitor, ToggleLeft, ToggleRight, Settings, Eye
} from 'lucide-react';
import { useAdminControlStore } from '../../stores/adminControlStore';
import type { PageVisibilityConfig } from '../../types/admin';
import type { FloodMode } from '../../contexts/ModeContextDef';

type Tab = 'settings' | 'pages';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'settings', label: 'Global Settings', icon: Settings },
  { id: 'pages', label: 'Page Visibility', icon: Eye },
];

const FLOOD_MODES: FloodMode[] = ['normal', 'watch', 'emergency', 'recovery'];
const MODE_COLORS: Record<FloodMode, string> = {
  normal: 'bg-blue-600', watch: 'bg-orange-500', emergency: 'bg-red-600', recovery: 'bg-purple-600',
};

const PAGE_LABELS: Record<keyof PageVisibilityConfig, string> = {
  dashboard: 'Emergency Dashboard',
  riskMap: 'Risk Map',
  communityReports: 'Community Reports',
  evacuation: 'Evacuation Planner',
  history: 'Historical Timeline',
  whatIf: 'What-If Lab',
  agriculture: 'Agriculture Advisor',
  recovery: 'Recovery Tracker',
  learnHub: 'Learn Hub',
  safetyProfile: 'Safety Profile',
};

export function FrontendControlCenter() {
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-1">
            Frontend Control Center
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            Manage public-facing content, alerts, and page visibility
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Monitor size={18} className="text-blue-400" />
          <span className="text-xs font-bold text-blue-400 uppercase">Live Control</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700 overflow-x-auto md:overflow-visible">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        {activeTab === 'settings' && <GlobalSettingsPanel />}
        {activeTab === 'pages' && <PageVisibilityPanel />}
      </div>
    </div>
  );
}

// ═══ Global Settings ═══
function GlobalSettingsPanel() {
  const { frontendSettings, updateFrontendSettings, setSiteFloodMode } = useAdminControlStore();

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
        <Settings size={16} /> Global Frontend Settings
      </h3>

      {/* Site Flood Mode */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Site Flood Mode</label>
        <div className="flex gap-2">
          {FLOOD_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setSiteFloodMode(mode)}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                frontendSettings.siteFloodMode === mode
                  ? `${MODE_COLORS[mode]} text-white`
                  : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-400 uppercase">Emergency Banner</label>
          <button
            onClick={() => updateFrontendSettings({ emergencyBannerActive: !frontendSettings.emergencyBannerActive })}
            className="flex items-center gap-2"
          >
            {frontendSettings.emergencyBannerActive ? (
              <ToggleRight size={28} className="text-green-500" />
            ) : (
              <ToggleLeft size={28} className="text-gray-600" />
            )}
          </button>
        </div>
        <input
          type="text"
          value={frontendSettings.emergencyBannerMessage}
          onChange={(e) => updateFrontendSettings({ emergencyBannerMessage: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 text-white p-2 text-sm rounded-lg focus:border-blue-400 outline-none"
          placeholder="Banner message..."
        />
        <select
          value={frontendSettings.emergencyBannerRiskLevel}
          onChange={(e) => updateFrontendSettings({ emergencyBannerRiskLevel: e.target.value as 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' })}
          className="bg-gray-900 border border-gray-700 text-white p-2 text-sm rounded-lg focus:border-blue-400 outline-none"
        >
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MODERATE">Moderate</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Maintenance Mode */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">Maintenance Mode</label>
          <p className="text-xs text-gray-500 mt-1">Disables all user pages temporarily</p>
        </div>
        <button
          onClick={() => updateFrontendSettings({ maintenanceMode: !frontendSettings.maintenanceMode })}
        >
          {frontendSettings.maintenanceMode ? (
            <ToggleRight size={28} className="text-red-500" />
          ) : (
            <ToggleLeft size={28} className="text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
}

// ═══ Page Visibility ═══
function PageVisibilityPanel() {
  const { frontendSettings, setPageVisibility } = useAdminControlStore();
  const pages = frontendSettings.pageVisibility;

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
        <Eye size={16} /> User Page Visibility
      </h3>
      <p className="text-xs text-gray-500">Toggle which pages are accessible to public users.</p>

      <div className="space-y-2">
        {(Object.entries(PAGE_LABELS) as [keyof PageVisibilityConfig, string][]).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between p-2 md:p-3 bg-gray-900 border border-gray-700 rounded-lg gap-2">
            <span className="text-xs md:text-sm font-semibold text-white truncate">{label}</span>
            <button onClick={() => setPageVisibility(key, !pages[key])} className="flex-shrink-0">
              {pages[key] ? (
                <ToggleRight size={24} className="text-green-500 md:w-7 md:h-7" />
              ) : (
                <ToggleLeft size={24} className="text-gray-600 md:w-7 md:h-7" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
