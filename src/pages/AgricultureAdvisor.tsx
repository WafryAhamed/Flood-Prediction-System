import React from 'react';
import { Sprout, CloudRain, Droplets, ShieldCheck } from 'lucide-react';
export function AgricultureAdvisor() {
  return <div className="min-h-screen pt-24 px-4 md:pl-72 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="inline-block bg-[#00CC00] text-white px-3 py-1 font-bold text-sm uppercase tracking-widest mb-2 border-2 border-black">
            Livelihood Protection
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4">
            Agri
            <br />
            Advisor
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border-4 border-black p-6 hover:translate-y-[-4px] transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Sprout size={40} className="mb-4 text-[#00CC00]" strokeWidth={2.5} />
            <h3 className="text-xl font-black uppercase mb-2">Paddy</h3>
            <p className="font-bold text-sm text-gray-600">
              High risk of submersion in next 48h. Delay planting.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-6 hover:translate-y-[-4px] transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CloudRain size={40} className="mb-4 text-blue-500" strokeWidth={2.5} />
            <h3 className="text-xl font-black uppercase mb-2">Rainfall</h3>
            <p className="font-bold text-sm text-gray-600">
              Expected 120mm. Exceeds drainage capacity.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-6 hover:translate-y-[-4px] transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Droplets size={40} className="mb-4 text-cyan-500" strokeWidth={2.5} />
            <h3 className="text-xl font-black uppercase mb-2">Soil Moisture</h3>
            <p className="font-bold text-sm text-gray-600">
              Saturation at 95%. No irrigation needed.
            </p>
          </div>
          <div className="bg-white border-4 border-black p-6 hover:translate-y-[-4px] transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck size={40} className="mb-4 text-orange-500" strokeWidth={2.5} />
            <h3 className="text-xl font-black uppercase mb-2">Insurance</h3>
            <p className="font-bold text-sm text-gray-600">
              Active scheme available for your zone.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border-4 border-black bg-[#E8F5E9] p-8">
            <h3 className="text-2xl font-black uppercase mb-6">
              Action Plan: Next 7 Days
            </h3>
            <ul className="space-y-4">
              {['Clear field drainage channels immediately', 'Harvest mature crops if possible before Friday', 'Store seeds on elevated platforms', 'Move livestock to higher grazing grounds'].map((tip, i) => <li key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black shrink-0 rounded-full">
                    {i + 1}
                  </div>
                  <p className="font-bold text-lg">{tip}</p>
                </li>)}
            </ul>
          </div>

          <div className="border-4 border-black bg-white p-8">
            <h3 className="text-2xl font-black uppercase mb-6">
              Inundation Forecast
            </h3>
            <div className="h-64 bg-gray-100 border-2 border-black flex items-center justify-center">
              <p className="font-bold uppercase text-gray-400">
                Map Visualization Placeholder
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
}