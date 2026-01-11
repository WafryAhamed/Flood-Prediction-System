import React from 'react';
import { Upload, Database, FileText, CheckCircle } from 'lucide-react';
export function DataUpload() {
  return <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
            Data Ingestion
          </h2>
          <p className="text-xs font-mono-cmd text-gray-400">
            PIPELINE STATUS: IDLE • STORAGE: 45% USED
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#132F4C] border border-[#1E4976] p-6">
          <h3 className="text-xs font-bold uppercase text-[#00E5FF] mb-6 flex items-center gap-2">
            <Database size={14} /> Dataset Upload
          </h3>
          <div className="border-2 border-[#1E4976] border-dashed h-48 flex flex-col items-center justify-center bg-[#0A1929] hover:bg-[#0A1929]/50 hover:border-[#00E5FF] cursor-pointer transition-colors group">
            <Upload size={32} className="mb-2 text-gray-500 group-hover:text-[#00E5FF]" />
            <span className="font-bold uppercase text-gray-500 text-xs group-hover:text-white">
              Drag & Drop CSV/GeoJSON
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between p-3 bg-[#0A1929] border border-[#1E4976]">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <span className="font-bold text-sm text-gray-300">
                  rainfall_data_2023.csv
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-[#00E676] flex items-center gap-1">
                <CheckCircle size={10} /> Processed
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#132F4C] border border-[#1E4976] p-6">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-6 flex items-center gap-2">
            <Database size={14} /> Model Registry
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-[#00E5FF]/5 border border-[#00E5FF]/30">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black uppercase text-lg text-white">
                  FloodNet v2.1
                </span>
                <span className="bg-[#00E676] text-black text-[10px] font-black px-2 py-1 uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 font-mono-cmd">
                Last updated: 2 days ago
              </p>
              <p className="text-xs font-bold text-[#00E5FF] font-mono-cmd">
                Accuracy: 94.2%
              </p>
            </div>

            <div className="p-4 bg-[#0A1929] border border-[#1E4976] opacity-60">
              <div className="flex justify-between items-start mb-2">
                <span className="font-black uppercase text-lg text-gray-500">
                  FloodNet v2.0
                </span>
                <span className="bg-gray-700 text-gray-300 text-[10px] font-black px-2 py-1 uppercase">
                  Archived
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}