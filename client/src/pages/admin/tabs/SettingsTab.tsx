import React, { useEffect } from 'react';
import { Settings, Eye, EyeOff, Sliders, Phone } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useVisibilityStore } from '../../../stores/visibilityStore';
import { useContactsStore } from '../../../stores/contactsStore';
import {
  syncDatabaseAction,
  generateReportAction,
  clearCacheAction,
  resetSystemAction,
  SystemSettingsPayload
} from '../../../services/integrationApi';

export default function SettingsTab() {
  const { contacts, loadContacts } = useContactsStore();
  const { visibility, loadVisibility, toggleVisibility } = useVisibilityStore();
  const { settings, loadSettings, updateSetting } = useSettingsStore();

  useEffect(() => {
    loadContacts();
    loadVisibility();
    loadSettings();
  }, []);

  const pageOptions = [
    { key: 'whatIfLab', label: 'What-If Lab (Simulation)' },
    { key: 'learnHub', label: 'Learn Hub (Educational)' },
    { key: 'historicalTimeline', label: 'Historical Timeline (Data)' },
    { key: 'recoveryTracker', label: 'Recovery Tracker (Post-Disaster)' },
    { key: 'evacuationPlanner', label: 'Evacuation Planner' },
    { key: 'communityReports', label: 'Community Reports' },
    { key: 'agricultureAdvisor', label: 'Agriculture Advisor' },
    { key: 'safetyProfile', label: 'Safety Profile Management' },
  ];

  const handlePageToggle = (key: string) => {
    const current = visibility[key] ?? true;
    toggleVisibility(key, !current);
  };

  const handleSettingToggle = (key: keyof SystemSettingsPayload) => {
    if (!settings) return;
    updateSetting(key, !settings[key]);
  };

  const visibleCount = Object.values(visibility).filter(Boolean).length || 0;
  const activeSettingsCount = settings ? Object.values(settings).filter(v => v === true).length : 0;
  
  const handleMaintenance = async (action: 'sync' | 'report' | 'cache' | 'reset') => {
    try {
      if (action === 'sync') await syncDatabaseAction();
      if (action === 'report') await generateReportAction();
      if (action === 'cache') await clearCacheAction();
      if (action === 'reset') {
        const confirmed = window.confirm("Are you sure you want to reset all system defaults? This cannot be undone.");
        if (confirmed) {
          await resetSystemAction();
          loadVisibility();
          loadSettings();
        }
      } else {
        alert(`${action.charAt(0).toUpperCase() + action.slice(1)} completed successfully!`);
      }
    } catch (err) {
      alert(`Failed to perform ${action} action.`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Visibility */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-blue-400 mb-2 flex items-center gap-2">
          <Eye size={18} /> Page Visibility
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          Control which pages are visible to end users. {visibleCount} of {pageOptions.length}{' '}
          pages active.
        </p>

        <div className="space-y-3">
          {pageOptions.map((page) => (
            <div
              key={page.key}
              className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={visibility[page.key] ?? true}
                  onChange={() => handlePageToggle(page.key)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">{page.label}</span>
              </label>
              {visibility[page.key] !== false ? (
                <Eye size={16} className="text-green-400" />
              ) : (
                <EyeOff size={16} className="text-gray-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-purple-400 mb-2 flex items-center gap-2">
          <Sliders size={18} /> System Settings
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          Configure system-wide behavior and user preferences. {activeSettingsCount} of 5 features enabled.
        </p>

        {settings && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-300">Dark Mode</p>
              <p className="text-xs text-gray-500">Force dark theme for all users</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dark_mode}
                onChange={() => handleSettingToggle('dark_mode')}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-300">Sound Alerts</p>
              <p className="text-xs text-gray-500">Play audio when critical alerts trigger</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sound_alerts}
                onChange={() => handleSettingToggle('sound_alerts')}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-300">Push Notifications</p>
              <p className="text-xs text-gray-500">Enable browser notifications for alerts</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.push_notifications}
                onChange={() => handleSettingToggle('push_notifications')}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-300">Data Collection</p>
              <p className="text-xs text-gray-500">Allow analytics to improve platform</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.data_collection}
                onChange={() => handleSettingToggle('data_collection')}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-300">Anonymous Reporting</p>
              <p className="text-xs text-gray-500">Allow users to submit reports anonymously</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.anonymous_reporting}
                onChange={() => handleSettingToggle('anonymous_reporting')}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </label>
          </div>
        </div>
        )}
      </div>

      {/* Emergency Contact Speed Dial */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-orange-400 mb-2 flex items-center gap-2">
          <Phone size={18} /> Emergency Contacts
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          These contacts appear in the emergency quick dial for all users. {contacts.length}{' '}
          contacts configured.
        </p>

        {contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{contact.label}</p>
                  <p className="text-xs text-gray-400">{contact.number}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {contact.type} • {contact.active ? '🟢 Active' : '🔴 Inactive'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-900 border border-dashed border-gray-600 rounded text-center text-gray-400 text-sm">
            No emergency contacts configured. Manage in Emergency Contacts tab.
          </div>
        )}
      </div>

      {/* System Maintenance */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-red-400 mb-2 flex items-center gap-2">
          <Settings size={18} /> System Maintenance
        </h3>
        <p className="text-xs text-gray-400 mb-6">Advanced administration tasks</p>

        <div className="space-y-3">
          <button onClick={() => handleMaintenance('sync')} className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-850 border border-gray-700 text-gray-300 font-medium text-sm rounded-lg transition-colors">
            🔄 Sync Database
          </button>
          <button onClick={() => handleMaintenance('report')} className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-850 border border-gray-700 text-gray-300 font-medium text-sm rounded-lg transition-colors">
            📊 Generate System Report
          </button>
          <button onClick={() => handleMaintenance('cache')} className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-850 border border-gray-700 text-gray-300 font-medium text-sm rounded-lg transition-colors">
            🗑️ Clear Cache
          </button>
          <button onClick={() => handleMaintenance('reset')} className="w-full px-4 py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 font-medium text-sm rounded-lg transition-colors">
            ⚠️ Reset System to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
