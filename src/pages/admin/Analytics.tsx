import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Download, Filter, Database } from 'lucide-react';
const trendData = [{
  year: '2018',
  events: 12,
  damage: 450
}, {
  year: '2019',
  events: 15,
  damage: 520
}, {
  year: '2020',
  events: 18,
  damage: 610
}, {
  year: '2021',
  events: 22,
  damage: 780
}, {
  year: '2022',
  events: 25,
  damage: 890
}, {
  year: '2023',
  events: 28,
  damage: 950
}];
const scatterData = [{
  x: 10,
  y: 30,
  z: 200
}, {
  x: 30,
  y: 200,
  z: 260
}, {
  x: 45,
  y: 100,
  z: 400
}, {
  x: 50,
  y: 400,
  z: 280
}, {
  x: 70,
  y: 150,
  z: 100
}, {
  x: 100,
  y: 250,
  z: 500
}];
export function Analytics() {
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Research & Policy Lab
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            DATA EXPLORER • CLIMATE MODELING
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#132F4C] border border-[#1E4976] text-white font-bold uppercase text-xs hover:bg-[#1E4976] flex items-center gap-2">
            <Database size={14} /> Connect Data Source
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#132F4C] border border-[#1E4976] p-6 h-[400px]">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">
            Long-term Flood Trend Analysis
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E4976" />
              <XAxis dataKey="year" stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <YAxis stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <Tooltip contentStyle={{
              backgroundColor: '#0A1929',
              borderColor: '#1E4976',
              color: '#E0E0E0'
            }} cursor={{
              fill: '#1E4976',
              opacity: 0.2
            }} />
              <Bar dataKey="events" fill="#00E5FF" />
              <Bar dataKey="damage" fill="#FF1744" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#132F4C] border border-[#1E4976] p-6 h-[400px]">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">
            Infrastructure vs Risk Correlation
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E4976" />
              <XAxis type="number" dataKey="x" name="Rainfall" stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <YAxis type="number" dataKey="y" name="Damage" stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <ZAxis type="number" dataKey="z" range={[60, 400]} />
              <Tooltip cursor={{
              strokeDasharray: '3 3'
            }} contentStyle={{
              backgroundColor: '#0A1929',
              borderColor: '#1E4976',
              color: '#E0E0E0'
            }} />
              <Scatter name="Districts" data={scatterData} fill="#FFC107" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#132F4C] border border-[#1E4976] p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase text-[#00E5FF]">
            Data Export Portal
          </h3>
          <div className="flex gap-2">
            <input type="text" placeholder="Filter datasets..." className="bg-[#0A1929] border border-[#1E4976] text-white px-3 py-1 text-xs focus:border-[#00E5FF] outline-none" />
            <button className="p-1 bg-[#1E4976] text-white">
              <Filter size={14} />
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-[#050B14] text-gray-500 text-[10px] uppercase font-bold">
            <tr>
              <th className="p-3 border-b border-[#1E4976]">Dataset Name</th>
              <th className="p-3 border-b border-[#1E4976]">Type</th>
              <th className="p-3 border-b border-[#1E4976]">Size</th>
              <th className="p-3 border-b border-[#1E4976]">Last Updated</th>
              <th className="p-3 border-b border-[#1E4976]">Action</th>
            </tr>
          </thead>
          <tbody className="text-xs font-mono-cmd text-gray-300">
            {[{
            name: 'National_Rainfall_2023_Q4.csv',
            type: 'CSV',
            size: '45 MB',
            date: 'Yesterday'
          }, {
            name: 'Flood_Risk_Model_v2.1.json',
            type: 'JSON',
            size: '12 MB',
            date: '2 days ago'
          }, {
            name: 'Infrastructure_Audit_Log.pdf',
            type: 'PDF',
            size: '2.4 MB',
            date: '1 week ago'
          }].map((file, i) => <tr key={i} className="hover:bg-[#0A1929] border-b border-[#1E4976]/50">
                <td className="p-3 font-bold text-white">{file.name}</td>
                <td className="p-3">{file.type}</td>
                <td className="p-3">{file.size}</td>
                <td className="p-3 text-gray-500">{file.date}</td>
                <td className="p-3">
                  <button className="text-[#00E5FF] hover:text-white flex items-center gap-1">
                    <Download size={14} /> Download
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}