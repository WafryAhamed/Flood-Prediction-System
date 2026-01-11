import React from 'react';
import { Phone, ArrowRightCircle, AlertTriangle, CheckCircle, Radio, Wind, Droplets, Thermometer } from 'lucide-react';
import { StatusCard } from '../components/ui/StatusCard';
import { EmergencyButton } from '../components/ui/EmergencyButton';
import { RiskIndicator } from '../components/ui/RiskIndicator';
import { AlertBanner } from '../components/ui/AlertBanner';
import { RiskMap } from '../components/RiskMap';
export function EmergencyDashboard() {
  return <div className="min-h-screen bg-white pb-12 pt-20">
      <AlertBanner message="FLASH FLOOD WARNING IN EFFECT - SECTOR 7" type="danger" />

      <main className="max-w-[1600px] mx-auto px-4 md:px-6">
        {/* Header Section */}
        <header className="mb-8 border-b-4 border-black pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm uppercase tracking-widest mb-2">
                System Status: Active
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                Emergency
                <br />
                Response
              </h1>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black font-mono">14:02:55</div>
              <div className="font-bold uppercase tracking-widest text-gray-600">
                Local Time • UTC-5
              </div>
            </div>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Risk & Actions (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <RiskIndicator level="CRITICAL" />

            <div className="grid grid-cols-2 gap-4">
              <StatusCard title="Wind" accentColor="black" className="h-full">
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Wind size={32} />
                  <span className="text-2xl font-black">
                    85 <span className="text-sm">km/h</span>
                  </span>
                  <span className="text-xs font-bold uppercase bg-gray-200 px-2 py-1">
                    Gusts 110
                  </span>
                </div>
              </StatusCard>
              <StatusCard title="Water" accentColor="black" className="h-full">
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Droplets size={32} />
                  <span className="text-2xl font-black">
                    +2.4 <span className="text-sm">m</span>
                  </span>
                  <span className="text-xs font-bold uppercase bg-red-100 text-red-600 px-2 py-1 border border-red-600">
                    Rising
                  </span>
                </div>
              </StatusCard>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-2xl uppercase border-l-8 border-black pl-3">
                Immediate Actions
              </h3>
              <EmergencyButton label="Quick Dial 911" icon={Phone} variant="critical" onClick={() => console.log('Dialing...')} />
              <EmergencyButton label="Evacuation Route" icon={ArrowRightCircle} variant="warning" />
              <div className="grid grid-cols-2 gap-4">
                <EmergencyButton label="Report" icon={AlertTriangle} variant="caution" className="min-h-[80px]" />
                <EmergencyButton label="Safe Zone" icon={CheckCircle} variant="safe" className="min-h-[80px]" />
              </div>
            </div>
          </div>

          {/* Middle/Right Column: Map & Feed (8 cols) */}
          <div className="md:col-span-8 flex flex-col gap-6">
            <StatusCard title="Live Risk Map" accentColor="red" className="h-[500px] p-0 overflow-hidden">
              <RiskMap />
            </StatusCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatusCard title="Broadcast Feed" accentColor="orange">
                <div className="space-y-4">
                  <div className="bg-black text-white p-3 border-l-4 border-[#FF6600]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-[#FF6600]">
                        13:55
                      </span>
                      <Radio size={16} className="text-[#FF6600]" />
                    </div>
                    <p className="font-bold text-sm uppercase leading-tight">
                      Sector 7 evacuation order issued. Proceed to high ground
                      immediately.
                    </p>
                  </div>
                  <div className="bg-gray-100 p-3 border-l-4 border-black">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs">13:42</span>
                    </div>
                    <p className="font-bold text-sm uppercase leading-tight">
                      Water levels exceeding critical threshold at North Bridge.
                    </p>
                  </div>
                  <div className="bg-gray-100 p-3 border-l-4 border-black">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs">13:30</span>
                    </div>
                    <p className="font-bold text-sm uppercase leading-tight">
                      Emergency services deployed to downtown area.
                    </p>
                  </div>
                </div>
              </StatusCard>

              <StatusCard title="Resources" accentColor="green">
                <ul className="space-y-2">
                  <li className="flex items-center justify-between p-2 border-2 border-black bg-white hover:bg-gray-50 cursor-pointer">
                    <span className="font-bold uppercase">Shelter A</span>
                    <span className="bg-[#00CC00] text-white text-xs font-black px-2 py-1">
                      OPEN
                    </span>
                  </li>
                  <li className="flex items-center justify-between p-2 border-2 border-black bg-white hover:bg-gray-50 cursor-pointer">
                    <span className="font-bold uppercase">Shelter B</span>
                    <span className="bg-[#FF0000] text-white text-xs font-black px-2 py-1">
                      FULL
                    </span>
                  </li>
                  <li className="flex items-center justify-between p-2 border-2 border-black bg-white hover:bg-gray-50 cursor-pointer">
                    <span className="font-bold uppercase">Medical Post</span>
                    <span className="bg-[#FFCC00] text-black text-xs font-black px-2 py-1">
                      BUSY
                    </span>
                  </li>
                  <li className="flex items-center justify-between p-2 border-2 border-black bg-white hover:bg-gray-50 cursor-pointer">
                    <span className="font-bold uppercase">Water Supply</span>
                    <span className="bg-[#00CC00] text-white text-xs font-black px-2 py-1">
                      AVAIL
                    </span>
                  </li>
                </ul>
              </StatusCard>
            </div>
          </div>
        </div>
      </main>
    </div>;
}