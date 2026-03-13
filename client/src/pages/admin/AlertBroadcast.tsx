import React, { useState } from 'react';
import { Radio, Send, Clock, BarChart2, CheckCircle } from 'lucide-react';
import { useAdminControlStore } from '../../stores/adminControlStore';
export function AlertBroadcast() {
  const [lang, setLang] = useState('en');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('critical');
  const [message, setMessage] = useState('');
  const addBroadcastItem = useAdminControlStore((s) => s.addBroadcastItem);
  const broadcastFeed = useAdminControlStore((s) => s.broadcastFeed);

  const publishBroadcast = () => {
    if (!message.trim()) return;
    const now = new Date();
    addBroadcastItem({
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      text: message.trim(),
      type: severity,
      active: true,
    });
    setMessage('');
  };

  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Alert & Comms Center
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            GATEWAY STATUS: ONLINE • SMS QUOTA: 85%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Composer */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase text-red-500 mb-6 flex items-center gap-2">
            <Radio size={18} /> New Emergency Broadcast
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Target Area
                </label>
                <select className="w-full bg-gray-900 border border-gray-700 text-white p-2 text-sm focus:border-blue-400 outline-none rounded-lg">
                  <option>All Districts</option>
                  <option>Colombo</option>
                  <option>Gampaha</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Severity
                </label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as 'critical' | 'warning' | 'info')} className="w-full bg-gray-900 border border-gray-700 text-white p-2 text-sm focus:border-blue-400 outline-none rounded-lg">
                  <option value="critical">Critical (Red)</option>
                  <option value="warning">Warning (Orange)</option>
                  <option value="info">Info (Blue)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase">
                  Message Content
                </label>
                <div className="flex gap-1">
                  {['en', 'si', 'ta'].map(l => <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 text-xs font-bold uppercase rounded-lg ${lang === l ? 'bg-blue-400 text-white' : 'bg-gray-900 text-gray-400 border border-gray-700'}`}>
                      {l === 'en' ? 'English' : l === 'si' ? 'Sinhala' : 'Tamil'}
                    </button>)}
                </div>
              </div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white p-3 text-sm h-32 focus:border-blue-400 outline-none rounded-lg font-mono" placeholder="Type alert message here..."></textarea>
            </div>

            <div className="flex gap-4 pt-2 border-t border-gray-700">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-blue-400 rounded" defaultChecked />{' '}
                SMS
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-blue-400 rounded" defaultChecked />{' '}
                Push
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-blue-400 rounded" /> TV/Radio
                API
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button onClick={publishBroadcast} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-sm flex items-center justify-center gap-2 rounded-lg transition-colors">
                <Send size={18} /> Broadcast Now
              </button>
              <button className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold uppercase text-sm flex items-center justify-center gap-2 rounded-lg transition-colors">
                <Clock size={18} /> Schedule
              </button>
            </div>
          </div>
        </div>

        {/* History & Analytics */}
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-80">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <BarChart2 size={18} /> Reach Analytics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900 p-4 text-center rounded-lg">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  98%
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  Delivery Rate
                </div>
              </div>
              <div className="bg-gray-900 p-4 text-center rounded-lg">
                <div className="text-3xl font-bold text-green-500 mb-1">
                  2.1M
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  People Reached
                </div>
              </div>
              <div className="bg-gray-900 p-4 text-center rounded-lg">
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  45s
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  Avg. Latency
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex-1">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
              Recent Broadcasts
            </h3>
            <div className="space-y-2">
              {broadcastFeed.slice(0, 6).map((alert) => <div key={alert.id} className="p-3 bg-gray-900 border border-gray-700 flex justify-between items-center rounded-lg hover:bg-gray-800 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${alert.type === 'critical' ? 'bg-red-600' : alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-400'}`}></span>
                      <span className="text-sm font-bold text-white">
                        {alert.text}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {alert.time} • SMS, Push
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-500 font-bold uppercase">
                    <CheckCircle size={14} /> Sent
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
}