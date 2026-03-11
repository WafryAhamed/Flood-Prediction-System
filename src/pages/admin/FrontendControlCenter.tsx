import React, { useState } from 'react';
import {
  Monitor, ToggleLeft, ToggleRight, Radio, Building2, Sprout, RefreshCw, BookOpen, Settings, Eye, EyeOff,
  Trash2, Plus
} from 'lucide-react';
import { useAdminControlStore } from '../../stores/adminControlStore';
import type { PageVisibilityConfig } from '../../types/admin';
import type { FloodMode } from '../../contexts/ModeContextDef';

type Tab = 'settings' | 'broadcast' | 'resources' | 'agriculture' | 'recovery' | 'learn' | 'pages';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'settings', label: 'Global Settings', icon: Settings },
  { id: 'broadcast', label: 'Broadcast Feed', icon: Radio },
  { id: 'resources', label: 'Resources', icon: Building2 },
  { id: 'agriculture', label: 'Agriculture', icon: Sprout },
  { id: 'recovery', label: 'Recovery', icon: RefreshCw },
  { id: 'learn', label: 'Learn Hub', icon: BookOpen },
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
      <div className="flex flex-wrap gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        {activeTab === 'settings' && <GlobalSettingsPanel />}
        {activeTab === 'broadcast' && <BroadcastPanel />}
        {activeTab === 'resources' && <ResourcesPanel />}
        {activeTab === 'agriculture' && <AgriculturePanel />}
        {activeTab === 'recovery' && <RecoveryPanel />}
        {activeTab === 'learn' && <LearnHubPanel />}
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

// ═══ Broadcast Feed ═══
function BroadcastPanel() {
  const { broadcastFeed, addBroadcastItem, removeBroadcastItem, toggleBroadcastItem } = useAdminControlStore();
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<'critical' | 'warning' | 'info'>('info');

  const handleAdd = () => {
    if (!newText.trim()) return;
    const now = new Date();
    addBroadcastItem({
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      text: newText.trim(),
      type: newType,
      active: true,
    });
    setNewText('');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
        <Radio size={16} /> Dashboard Broadcast Feed
      </h3>

      {/* Add new */}
      <div className="flex gap-2">
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as 'critical' | 'info' | 'warning')}
          className="bg-gray-900 border border-gray-700 text-white p-2 text-xs rounded-lg"
        >
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 text-white p-2 text-sm rounded-lg focus:border-blue-400 outline-none"
          placeholder="New broadcast message..."
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {broadcastFeed.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 p-3 bg-gray-900 border rounded-lg ${item.active ? 'border-gray-700' : 'border-gray-800 opacity-50'}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'critical' ? 'bg-red-600' : item.type === 'warning' ? 'bg-orange-500' : 'bg-blue-400'}`}></span>
            <span className="text-xs font-mono text-gray-500">{item.time}</span>
            <span className="text-sm text-white flex-1">{item.text}</span>
            <button onClick={() => toggleBroadcastItem(item.id)} className="text-gray-500 hover:text-white transition-colors">
              {item.active ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button onClick={() => removeBroadcastItem(item.id)} className="text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ Resources ═══
function ResourcesPanel() {
  const { dashboardResources, updateResource } = useAdminControlStore();
  const statusOptions = ['OPEN', 'FULL', 'BUSY', 'AVAILABLE', 'CLOSED'] as const;
  const colorMap: Record<string, string> = {
    OPEN: 'bg-green-600', FULL: 'bg-red-600', BUSY: 'bg-yellow-500', AVAILABLE: 'bg-green-600', CLOSED: 'bg-gray-600',
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
        <Building2 size={16} /> Dashboard Resources
      </h3>
      <div className="space-y-3">
        {dashboardResources.map((res) => (
          <div key={res.id} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <span className="text-sm text-white font-semibold flex-1">{res.name}</span>
            <select
              value={res.status}
              onChange={(e) => {
                const status = e.target.value as 'OPEN' | 'FULL' | 'BUSY' | 'AVAILABLE' | 'CLOSED';
                updateResource(res.id, { status, statusColor: colorMap[status] });
              }}
              className="bg-gray-800 border border-gray-700 text-white p-1.5 text-xs rounded-lg"
            >
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => updateResource(res.id, { visible: !res.visible })}
              className="text-gray-500 hover:text-white transition-colors"
            >
              {res.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ Agriculture ═══
function AgriculturePanel() {
  const { agricultureAdvisories, updateAdvisory, agricultureActions, updateAction } = useAdminControlStore();

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
        <Sprout size={16} /> Public Agriculture Content
      </h3>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase">Crop Advisories</p>
        {agricultureAdvisories.map((adv) => (
          <div key={adv.id} className="p-3 bg-gray-900 border border-gray-700 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{adv.cropName}</span>
              <input
                value={adv.statusLabel}
                onChange={(e) => updateAdvisory(adv.id, { statusLabel: e.target.value })}
                className="bg-gray-800 border border-gray-700 text-white p-1 text-xs rounded w-24 text-center"
              />
            </div>
            <textarea
              value={adv.message}
              onChange={(e) => updateAdvisory(adv.id, { message: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white p-2 text-xs rounded-lg h-16 resize-none focus:border-blue-400 outline-none"
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase">Action Plan Items</p>
        {agricultureActions.sort((a, b) => a.order - b.order).map((action) => (
          <div key={action.id} className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-600 text-white flex items-center justify-center font-bold text-xs rounded shrink-0">
              {action.order}
            </span>
            <input
              value={action.text}
              onChange={(e) => updateAction(action.id, e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 text-white p-2 text-sm rounded-lg focus:border-blue-400 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ Recovery ═══
function RecoveryPanel() {
  const { recoveryProgress, updateRecoveryProgress, recoveryUpdates, addRecoveryUpdate, recoveryNeeds, updateRecoveryNeed } = useAdminControlStore();
  const [newTitle, setNewTitle] = useState('');

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
        <RefreshCw size={16} /> Public Recovery Content
      </h3>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase">Restoration Progress</p>
        {recoveryProgress.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <span className="text-sm text-white font-semibold w-32">{item.label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={item.percent}
              onChange={(e) => updateRecoveryProgress(item.id, Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm font-bold text-blue-400 w-12 text-right">{item.percent}%</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase">Critical Needs</p>
        {recoveryNeeds.map((need) => (
          <div key={need.id} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <span className="text-sm text-white font-semibold flex-1">{need.name}</span>
            <select
              value={need.urgency}
              onChange={(e) => updateRecoveryNeed(need.id, { urgency: e.target.value as 'CRITICAL' | 'HIGH' | 'LOW' })}
              className="bg-gray-800 border border-gray-700 text-white p-1.5 text-xs rounded-lg"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Met</option>
            </select>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase">Add Recovery Update</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 text-white p-2 text-sm rounded-lg focus:border-blue-400 outline-none"
            placeholder="Update title..."
          />
          <button
            onClick={() => {
              if (!newTitle.trim()) return;
              addRecoveryUpdate({ iconName: 'CheckCircle', title: newTitle.trim(), time: 'Just now' });
              setNewTitle('');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {recoveryUpdates.map((u) => (
            <div key={u.id} className="flex items-center gap-2 p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300">
              <span className="flex-1">{u.title}</span>
              <span className="text-xs text-gray-500">{u.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ Learn Hub ═══
function LearnHubPanel() {
  const { learnGuides, updateLearnGuide, featuredWisdom, updateFeaturedWisdom } = useAdminControlStore();

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase text-red-500 flex items-center gap-2">
        <BookOpen size={16} /> Public Learn Hub Content
      </h3>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase">Guide Cards</p>
        {learnGuides.map((guide) => (
          <div key={guide.id} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex-1 space-y-1">
              <input
                value={guide.title}
                onChange={(e) => updateLearnGuide(guide.id, { title: e.target.value })}
                className="bg-transparent text-white font-bold text-sm focus:outline-none w-full"
              />
              <textarea
                value={guide.description}
                onChange={(e) => updateLearnGuide(guide.id, { description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 p-2 text-xs rounded-lg h-12 resize-none focus:border-blue-400 outline-none"
              />
            </div>
            <button
              onClick={() => updateLearnGuide(guide.id, { visible: !guide.visible })}
              className="text-gray-500 hover:text-white transition-colors"
            >
              {guide.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase">Featured Wisdom</p>
          <button
            onClick={() => updateFeaturedWisdom({ visible: !featuredWisdom.visible })}
            className="text-gray-500 hover:text-white transition-colors"
          >
            {featuredWisdom.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
        <textarea
          value={featuredWisdom.quote}
          onChange={(e) => updateFeaturedWisdom({ quote: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 text-white p-3 text-sm rounded-lg h-24 resize-none focus:border-blue-400 outline-none"
        />
        <input
          value={featuredWisdom.source}
          onChange={(e) => updateFeaturedWisdom({ source: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 text-white p-2 text-xs rounded-lg focus:border-blue-400 outline-none"
          placeholder="Source attribution..."
        />
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
          <div key={key} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <span className="text-sm font-semibold text-white">{label}</span>
            <button onClick={() => setPageVisibility(key, !pages[key])}>
              {pages[key] ? (
                <ToggleRight size={28} className="text-green-500" />
              ) : (
                <ToggleLeft size={28} className="text-gray-600" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
