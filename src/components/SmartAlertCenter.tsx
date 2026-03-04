import { useState, useMemo, useEffect } from 'react';
import { Bell, AlertTriangle, Info, Volume2, Settings, X, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'all-clear';
  title: string;
  message: string;
  description: string;
  timestamp: Date;
  read: boolean;
  district?: string;
  priority: number; // 1-5, higher is more urgent
}

interface NotificationPreference {
  channel: 'push' | 'sms' | 'email';
  enabled: boolean;
  language: 'en' | 'en' | 'si' | 'ta';
  voiceEnabled: boolean;
}

interface SmartAlertCenterProps {
  alerts?: Alert[];
  onAlertDismiss?: (id: string) => void;
}

export function SmartAlertCenter({ alerts: initialAlerts = [], onAlertDismiss }: SmartAlertCenterProps) {

  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    { channel: 'push', enabled: true, language: 'en', voiceEnabled: true },
    { channel: 'sms', enabled: true, language: 'si', voiceEnabled: false },
    { channel: 'email', enabled: false, language: 'en', voiceEnabled: false },
  ]);

  // Memoize demoAlerts to prevent useEffect dependency issues
  const demoAlerts: Alert[] = useMemo(
    () => [
      {
        id: '1',
        type: 'critical',
        title: 'Flash Flood Warning - Colombo District',
        message: 'Heavy rainfall expected in next 2 hours',
        description: 'Flash flood alert for low-lying areas. Evacuation orders in effect for zones A1-A5.',
        timestamp: new Date(Date.now() - 5 * 60000),
        read: false,
        district: 'Colombo',
        priority: 5,
      },
      {
        id: '2',
        type: 'warning',
        title: 'Evacuation Route Update',
        message: 'Route to Evacuation Center B closed',
        description: 'Due to flooding, only Route A1 is available. Please use alternative routes.',
        timestamp: new Date(Date.now() - 15 * 60000),
        read: false,
        district: 'Colombo',
        priority: 4,
      },
      {
        id: '3',
        type: 'info',
        title: 'Relief Supplies Available',
        message: 'Food & water at Community Center, Galle Road',
        description: 'Emergency relief supplies are now available. Open 24/7 during crisis.',
        timestamp: new Date(Date.now() - 45 * 60000),
        read: true,
        district: 'Colombo',
        priority: 2,
      },
      {
        id: '4',
        type: 'all-clear',
        title: 'All Clear - Matara District',
        message: 'Flood situation normalized',
        description: 'Water levels have receded. It is now safe to return to affected areas.',
        timestamp: new Date(Date.now() - 120 * 60000),
        read: true,
        district: 'Matara',
        priority: 1,
      },
    ],
    []
  );

  // If no alerts passed, use demo
  useEffect(() => {
    if (initialAlerts.length === 0 && alerts.length === 0) {
      setAlerts(demoAlerts);
    }
  }, [demoAlerts, initialAlerts, alerts.length]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAsRead = (id: string) => {
    const updated = alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
    setAlerts(updated);
  };

  const deleteAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    onAlertDismiss?.(id);
  };

  const playVoiceAlert = () => {
    setIsPlaying(true);
    // Simulate voice playback
    setTimeout(() => setIsPlaying(false), 3000);

    // In real app: use Web Speech API or Web Audio API
    const criticalAlerts = alerts.filter((a) => a.type === 'critical' && !a.read);
    if (criticalAlerts.length > 0) {
      const message = `Alert: ${criticalAlerts[0].title}. ${criticalAlerts[0].message}`;
      console.log('🔊 Speaking:', message);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'critical':
        return <AlertTriangle className={iconClass + ' text-red-600'} />;
      case 'warning':
        return <AlertTriangle className={iconClass + ' text-orange-600'} />;
      case 'info':
        return <Info className={iconClass + ' text-blue-600'} />;
      case 'all-clear':
        return <Info className={iconClass + ' text-green-600'} />;
    }
  };

  const getAlertBgColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-400';
      case 'warning':
        return 'bg-orange-50 border-orange-400';
      case 'info':
        return 'bg-blue-50 border-blue-400';
      case 'all-clear':
        return 'bg-green-50 border-green-400';
    }
  };

  const getTimeSince = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const sortedAlerts = [...alerts].sort((a, b) => b.priority - a.priority);
  const recentAlerts = sortedAlerts.slice(0, 5);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Floating Alert Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAlerts(!showAlerts)}
          className="relative w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full shadow-lg flex items-center justify-center font-bold text-xs hover:shadow-xl transition-shadow"
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs"
            >
              {unreadCount}
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Alert Panel */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-6 w-96 max-h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">🔔 Alerts</h3>
                <p className="text-xs opacity-90">{unreadCount} unread</p>
              </div>
              <button onClick={() => setShowAlerts(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>

            {/* Alert List */}
            <div className="flex-1 overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  <Bell size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No alerts yet</p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {recentAlerts.map((alert, idx) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${getAlertBgColor(
                        alert.type
                      )} ${!alert.read ? 'ring-2 ring-yellow-300' : ''}`}
                      onClick={() => markAsRead(alert.id)}
                    >
                      <div className="flex gap-2 items-start">
                        <div className="mt-1">{getAlertIcon(alert.type)}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-700 mt-1">{alert.message}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} /> {getTimeSince(alert.timestamp)}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAlert(alert.id);
                              }}
                              className="text-gray-400 hover:text-red-600 p-0.5"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-gray-200 p-3 space-y-2 bg-gray-50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={playVoiceAlert}
                disabled={isPlaying}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <Volume2 size={16} /> {isPlaying ? 'Playing...' : 'Voice Alert'}
              </motion.button>
              <button
                onClick={() => setShowPreferences(true)}
                className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <Settings size={16} /> Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4"
            >
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings size={20} /> Alert Preferences
              </h3>

              <div className="space-y-3">
                {preferences.map((pref) => (
                  <div key={pref.channel} className="border border-gray-200 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900 capitalize">{pref.channel}</span>
                      <button
                        onClick={() => {
                          const updated = preferences.map((p) =>
                            p.channel === pref.channel ? { ...p, enabled: !p.enabled } : p
                          );
                          setPreferences(updated);
                        }}
                        className={`px-3 py-1 rounded-full font-semibold text-sm transition-colors ${
                          pref.enabled
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {pref.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {pref.enabled && (
                      <>
                        <select
                          value={pref.language}
                          onChange={(e) => {
                            const updated = preferences.map((p) =>
                              p.channel === pref.channel
                                ? { ...p, language: e.target.value as 'en' | 'si' | 'ta' }
                                : p
                            );
                            setPreferences(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="en">🇬🇧 English</option>
                          <option value="si">🇱🇰 Sinhala</option>
                          <option value="ta">🇮🇳 Tamil</option>
                        </select>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.voiceEnabled}
                            onChange={(e) => {
                              const updated = preferences.map((p) =>
                                p.channel === pref.channel
                                  ? { ...p, voiceEnabled: e.target.checked }
                                  : p
                              );
                              setPreferences(updated);
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">🔊 Voice Narration</span>
                        </label>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  ℹ️ You'll receive alerts in your preferred languages and delivery methods during emergencies.
                </p>
              </div>

              <button
                onClick={() => setShowPreferences(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Alert Timeline View */}
      <div className="space-y-4 mt-8">
        <h2 className="font-bold text-xl">📋 Alert Timeline</h2>
        <div className="space-y-3">
          {sortedAlerts.slice(0, 8).map((alert, idx) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-lg border-2 border-l-4 ${getAlertBgColor(alert.type)}`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3 flex-1">
                  <div className="mt-1">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                    <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <Clock size={12} /> {getTimeSince(alert.timestamp)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-gray-400 hover:text-red-600 p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
