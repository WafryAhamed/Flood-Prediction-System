import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, AlertOctagon } from 'lucide-react';
const data = [{
  year: '2018',
  floods: 2,
  rainfall: 1200
}, {
  year: '2019',
  floods: 1,
  rainfall: 900
}, {
  year: '2020',
  floods: 3,
  rainfall: 1500
}, {
  year: '2021',
  floods: 4,
  rainfall: 1800
}, {
  year: '2022',
  floods: 2,
  rainfall: 1100
}, {
  year: '2023',
  floods: 5,
  rainfall: 2100
}];
export function HistoricalTimeline() {
  return <div className="min-h-screen pt-24 px-4 md:pl-72 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4">
            Flood
            <br />
            History
          </h1>
          <div className="flex flex-wrap gap-4">
            <select className="border-4 border-black p-3 font-bold uppercase bg-white text-xl">
              <option>Colombo District</option>
              <option>Gampaha District</option>
              <option>Kalutara District</option>
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-black text-white p-6 border-4 border-black">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-black uppercase">Total Events</h3>
              <AlertOctagon />
            </div>
            <p className="text-6xl font-black">17</p>
            <p className="text-sm font-bold uppercase text-gray-400 mt-2">
              Last 5 Years
            </p>
          </div>

          <div className="bg-white text-black p-6 border-4 border-black">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-black uppercase">Peak Month</h3>
              <Calendar />
            </div>
            <p className="text-6xl font-black">MAY</p>
            <p className="text-sm font-bold uppercase text-gray-500 mt-2">
              Monsoon Season
            </p>
          </div>

          <div className="bg-[#FFCC00] text-black p-6 border-4 border-black">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-black uppercase">Risk Trend</h3>
              <TrendingUp />
            </div>
            <p className="text-6xl font-black">+15%</p>
            <p className="text-sm font-bold uppercase text-black/60 mt-2">
              Year over Year
            </p>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 h-[400px]">
          <h3 className="text-xl font-black uppercase mb-6">
            Annual Flood Frequency
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="year" tick={{
              fontFamily: 'Inter',
              fontWeight: 'bold'
            }} />
              <YAxis tick={{
              fontFamily: 'Inter',
              fontWeight: 'bold'
            }} />
              <Tooltip contentStyle={{
              border: '4px solid black',
              borderRadius: 0,
              boxShadow: '4px 4px 0 0 black'
            }} itemStyle={{
              fontFamily: 'Inter',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }} />
              <Bar dataKey="floods" fill="#000000" />
              <Bar dataKey="rainfall" fill="#FFCC00" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>;
}