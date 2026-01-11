import React from 'react';
import { CheckCircle, Truck, Hammer, HeartHandshake } from 'lucide-react';
export function RecoveryTracker() {
  return <div className="min-h-screen pt-24 px-4 md:pl-72 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="inline-block bg-[#0000FF] text-white px-3 py-1 font-bold text-sm uppercase tracking-widest mb-2 border-2 border-black">
            Post-Disaster Phase
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-4">
            Recovery
            <br />
            Tracker
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="col-span-1 lg:col-span-2 space-y-8">
            {/* Progress Section */}
            <div className="bg-white border-4 border-black p-6">
              <h3 className="text-2xl font-black uppercase mb-6">
                Restoration Progress
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2 font-bold uppercase">
                    <span>Road Access</span>
                    <span>85%</span>
                  </div>
                  <div className="h-6 w-full bg-gray-200 border-2 border-black">
                    <div className="h-full bg-[#00CC00]" style={{
                    width: '85%'
                  }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2 font-bold uppercase">
                    <span>Power Supply</span>
                    <span>60%</span>
                  </div>
                  <div className="h-6 w-full bg-gray-200 border-2 border-black">
                    <div className="h-full bg-[#FFCC00]" style={{
                    width: '60%'
                  }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2 font-bold uppercase">
                    <span>Water Safety</span>
                    <span>40%</span>
                  </div>
                  <div className="h-6 w-full bg-gray-200 border-2 border-black">
                    <div className="h-full bg-[#FF0000]" style={{
                    width: '40%'
                  }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Relief Map Placeholder */}
            <div className="bg-gray-100 border-4 border-black h-80 flex items-center justify-center">
              <p className="font-bold uppercase text-gray-400">
                Relief Camp Map Visualization
              </p>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-black text-white p-6 border-4 border-black">
              <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                <HeartHandshake /> Needs
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <span className="font-bold">Drinking Water</span>
                  <span className="text-[#FF0000] font-black uppercase">
                    Critical
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <span className="font-bold">Dry Rations</span>
                  <span className="text-[#FFCC00] font-black uppercase">
                    High
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <span className="font-bold">Clothing</span>
                  <span className="text-[#00CC00] font-black uppercase">
                    Met
                  </span>
                </li>
              </ul>
              <button className="w-full mt-6 bg-white text-black py-3 font-black uppercase hover:bg-gray-200">
                Donate Now
              </button>
            </div>

            <div className="bg-white border-4 border-black p-6">
              <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                <Hammer /> Repairs
              </h3>
              <p className="font-bold text-sm mb-4">
                Report damage to your property to get government assistance.
              </p>
              <button className="w-full bg-black text-white py-3 font-black uppercase hover:bg-gray-800">
                File Damage Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>;
}