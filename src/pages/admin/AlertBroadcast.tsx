import React, { useState } from 'react';
import { Radio, Send, Globe, Clock, BarChart2, CheckCircle } from 'lucide-react';
export function AlertBroadcast() {
  const [lang, setLang] = useState('en');
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Alert & Comms Center
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            GATEWAY STATUS: ONLINE • SMS QUOTA: 85%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Composer */}
        <div className="bg-[#132F4C] border border-[#1E4976] p-6">
          <h3 className="text-xs font-bold uppercase text-[#FF1744] mb-6 flex items-center gap-2">
            <Radio size={14} /> New Emergency Broadcast
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Target Area
                </label>
                <select className="w-full bg-[#0A1929] border border-[#1E4976] text-white p-2 text-sm focus:border-[#00E5FF] outline-none">
                  <option>All Districts</option>
                  <option>Colombo</option>
                  <option>Gampaha</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Severity
                </label>
                <select className="w-full bg-[#0A1929] border border-[#1E4976] text-white p-2 text-sm focus:border-[#00E5FF] outline-none">
                  <option>Critical (Red)</option>
                  <option>Warning (Orange)</option>
                  <option>Info (Blue)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase">
                  Message Content
                </label>
                <div className="flex gap-1">
                  {['en', 'si', 'ta'].map(l => <button key={l} onClick={() => setLang(l)} className={`px-2 py-0.5 text-[10px] font-bold uppercase ${lang === l ? 'bg-[#00E5FF] text-black' : 'bg-[#0A1929] text-gray-400 border border-[#1E4976]'}`}>
                      {l === 'en' ? 'English' : l === 'si' ? 'Sinhala' : 'Tamil'}
                    </button>)}
                </div>
              </div>
              <textarea className="w-full bg-[#0A1929] border border-[#1E4976] text-white p-3 text-sm h-32 focus:border-[#00E5FF] outline-none font-mono-cmd" placeholder="Type alert message here..."></textarea>
            </div>

            <div className="flex gap-4 pt-2 border-t border-[#1E4976]">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-[#00E5FF]" defaultChecked />{' '}
                SMS
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-[#00E5FF]" defaultChecked />{' '}
                Push
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-[#00E5FF]" /> TV/Radio
                API
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button className="flex-1 py-3 bg-[#FF1744] text-white font-bold uppercase text-sm hover:bg-[#D50000] flex items-center justify-center gap-2">
                <Send size={16} /> Broadcast Now
              </button>
              <button className="px-4 py-3 bg-[#132F4C] border border-[#1E4976] text-gray-300 font-bold uppercase text-sm hover:bg-[#1E4976] flex items-center justify-center gap-2">
                <Clock size={16} /> Schedule
              </button>
            </div>
          </div>
        </div>

        {/* History & Analytics */}
        <div className="space-y-6">
          <div className="bg-[#132F4C] border border-[#1E4976] p-6 h-64">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
              <BarChart2 size={14} /> Reach Analytics
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-[#0A1929] p-3 text-center">
                <div className="text-2xl font-mono-cmd font-bold text-[#00E5FF]">
                  98%
                </div>
                <div className="text-[10px] text-gray-500 uppercase">
                  Delivery Rate
                </div>
              </div>
              <div className="bg-[#0A1929] p-3 text-center">
                <div className="text-2xl font-mono-cmd font-bold text-[#00E676]">
                  2.1M
                </div>
                <div className="text-[10px] text-gray-500 uppercase">
                  People Reached
                </div>
              </div>
              <div className="bg-[#0A1929] p-3 text-center">
                <div className="text-2xl font-mono-cmd font-bold text-[#FFC107]">
                  45s
                </div>
                <div className="text-[10px] text-gray-500 uppercase">
                  Avg. Latency
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#132F4C] border border-[#1E4976] p-6 flex-1">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">
              Recent Broadcasts
            </h3>
            <div className="space-y-3">
              {[{
              msg: 'Evacuation order for Sector 7',
              time: '2h ago',
              status: 'Sent',
              type: 'Critical'
            }, {
              msg: 'Heavy rain warning: Gampaha',
              time: '5h ago',
              status: 'Sent',
              type: 'Warning'
            }, {
              msg: 'Water levels receding in Kalutara',
              time: '1d ago',
              status: 'Sent',
              type: 'Info'
            }].map((alert, i) => <div key={i} className="p-3 bg-[#0A1929] border border-[#1E4976] flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${alert.type === 'Critical' ? 'bg-[#FF1744]' : alert.type === 'Warning' ? 'bg-[#FFC107]' : 'bg-[#00E5FF]'}`}></span>
                      <span className="text-xs font-bold text-white">
                        {alert.msg}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono-cmd">
                      {alert.time} • SMS, Push
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#00E676] font-bold uppercase">
                    <CheckCircle size={12} /> {alert.status}
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
}