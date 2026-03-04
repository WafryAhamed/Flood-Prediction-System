import React from 'react';
import { Upload, Database, FileText, CheckCircle } from 'lucide-react';
export function DataUpload() {
  return <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white mb-2">
            Data Ingestion
          </h2>
          <p className="text-sm font-semibold text-gray-400">
            PIPELINE STATUS: IDLE • STORAGE: 45% USED
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
          <h3 className="text-sm font-bold uppercase text-blue-400 mb-6 flex items-center gap-2">
            <Database size={18} /> Dataset Upload
          </h3>
          <div className="border-2 border-gray-700 border-dashed h-48 flex flex-col items-center justify-center bg-gray-900 hover:bg-gray-900/50 hover:border-blue-400 cursor-pointer transition-colors group rounded">
            <Upload size={32} className="mb-2 text-gray-500 group-hover:text-blue-400" />
            <span className="font-bold uppercase text-gray-500 text-sm group-hover:text-white">
              Drag & Drop CSV/GeoJSON
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <span className="font-bold text-sm text-gray-300">
                  rainfall_data_2023.csv
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-green-500 flex items-center gap-1">
                <CheckCircle size={10} /> Processed
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-6 flex items-center gap-2">
            <Database size={18} /> Model Registry
          </h3>
          <div className="space-y-4">
            <div className="p-6 bg-blue-400/5 border border-blue-400/30 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black uppercase text-lg text-white">
                  FloodNet v2.1
                </span>
                <span className="bg-green-500 text-black text-[10px] font-black px-3 py-1.5 uppercase rounded">
                  Active
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 font-semibold">
                Last updated: 2 days ago
              </p>
              <p className="text-xs font-bold text-blue-400 font-semibold">
                Accuracy: 94.2%
              </p>
            </div>

            <div className="p-6 bg-gray-900 border border-gray-700 opacity-60 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black uppercase text-lg text-gray-500">
                  FloodNet v2.0
                </span>
                <span className="bg-gray-700 text-gray-300 text-[10px] font-black px-3 py-1.5 uppercase rounded">
                  Archived
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}