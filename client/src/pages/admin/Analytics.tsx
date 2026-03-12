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
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Research & Policy Lab
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            DATA EXPLORER • CLIMATE MODELING
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-gray-800 border border-gray-700 text-white font-bold uppercase text-sm hover:bg-gray-700 flex items-center gap-2 rounded transition-colors">
            <Database size={18} /> Connect Data Source
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 p-6 h-[400px] rounded-lg">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
            Long-term Flood Trend Analysis
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <YAxis stroke="#64748B" tick={{
              fill: '#64748B',
              fontSize: 10
            }} />
              <Tooltip contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              color: '#D1D5DB'
            }} cursor={{
              fill: '#374151',
              opacity: 0.2
            }} />
              <Bar dataKey="events" fill="#2563EB" />
              <Bar dataKey="damage" fill="#DC2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-6 h-[400px] rounded-lg">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">
            Infrastructure vs Risk Correlation
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
              backgroundColor: '#111827',
              borderColor: '#374151',
              color: '#D1D5DB'
            }} />
              <Scatter name="Districts" data={scatterData} fill="#F97316" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold uppercase text-blue-400">
            Data Export Portal
          </h3>
          <div className="flex gap-2">
            <input type="text" placeholder="Filter datasets..." className="bg-gray-900 border border-gray-700 text-white px-4 py-2 text-sm focus:border-blue-400 outline-none rounded" />
            <button className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-950 text-gray-500 text-[10px] uppercase font-bold">
            <tr>
              <th className="p-4 border-b border-gray-700">Dataset Name</th>
              <th className="p-4 border-b border-gray-700">Type</th>
              <th className="p-4 border-b border-gray-700">Size</th>
              <th className="p-4 border-b border-gray-700">Last Updated</th>
              <th className="p-4 border-b border-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm font-semibold text-gray-300">
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
          }].map((file, i) => <tr key={i} className="hover:bg-gray-900 border-b border-gray-700/50">
                <td className="p-4 font-bold text-white">{file.name}</td>
                <td className="p-4">{file.type}</td>
                <td className="p-4">{file.size}</td>
                <td className="p-4 text-gray-500">{file.date}</td>
                <td className="p-4">
                  <button className="text-blue-400 hover:text-white flex items-center gap-1 transition-colors">
                    <Download size={16} /> Download
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}