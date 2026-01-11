import React, { useState } from 'react';
import { Camera, MapPin, Send, AlertTriangle } from 'lucide-react';
import { StatusCard } from '../components/ui/StatusCard';
export function CommunityReports() {
  const [reportType, setReportType] = useState('');
  return <div className="min-h-screen pt-24 px-4 md:pl-72 pb-20">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="inline-block bg-[#FF6600] text-black px-3 py-1 font-black uppercase text-sm mb-2 border-2 border-black">
            Crowdsourced Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4">
            Report
            <br />
            Flooding
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Report Form */}
          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
              <AlertTriangle className="text-red-600" strokeWidth={3} />
              New Report
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block font-bold uppercase text-sm mb-2">
                  1. Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'Critical'].map(level => <button key={level} onClick={() => setReportType(level)} className={`
                        py-3 border-4 border-black font-black uppercase text-sm hover:translate-y-1 transition-transform
                        ${reportType === level ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}
                      `}>
                      {level}
                    </button>)}
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-2">
                  2. Add Photo
                </label>
                <button className="w-full h-32 border-4 border-black border-dashed flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Camera size={32} strokeWidth={2} />
                  <span className="font-bold uppercase mt-2 text-sm text-gray-500">
                    Tap to take photo
                  </span>
                </button>
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-2">
                  3. Location
                </label>
                <div className="flex items-center gap-2 p-3 border-4 border-black bg-gray-100">
                  <MapPin size={20} />
                  <span className="font-mono font-bold text-sm">
                    6.9271° N, 79.8612° E
                  </span>
                  <span className="ml-auto text-xs font-black uppercase bg-[#00CC00] text-white px-2 py-1">
                    GPS Locked
                  </span>
                </div>
              </div>

              <button className="w-full bg-[#FF0000] text-white py-4 font-black uppercase text-xl border-4 border-black hover:bg-[#D00000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all flex items-center justify-center gap-2">
                <Send strokeWidth={3} /> Submit Report
              </button>
            </div>
          </div>

          {/* Recent Reports Feed */}
          <div className="space-y-4">
            <h3 className="font-black uppercase text-xl border-b-4 border-black pb-2">
              Recent Reports Nearby
            </h3>

            {[1, 2, 3].map(i => <StatusCard key={i} className="border-2" accentColor="orange">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 border-2 border-black shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-black text-white text-[10px] font-bold px-1 uppercase">
                        Verified
                      </span>
                      <span className="text-xs font-bold text-gray-500">
                        2 mins ago
                      </span>
                    </div>
                    <p className="font-bold text-sm leading-tight mb-2">
                      Water level rising rapidly near the bridge. Road
                      impassable.
                    </p>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                      <MapPin size={12} /> Colombo 07
                    </div>
                  </div>
                </div>
              </StatusCard>)}
          </div>
        </div>
      </div>
    </div>;
}