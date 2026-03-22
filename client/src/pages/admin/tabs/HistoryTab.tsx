import React, { useState } from 'react';
import { Plus, Edit2, Upload, Trash2, TrendingUp } from 'lucide-react';
import { useMaintenanceStore } from '../../../stores/maintenanceStore';

export default function HistoryTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csvInput, setCsvInput] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);

  const historyData = useMaintenanceStore((s) => s.historyData);
  const updateHistoryItem = useMaintenanceStore((s) => s.updateHistoryItem || (() => {}));

  return (
    <div className="space-y-8">
      {/* Historical Flood Records */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-orange-400 mb-6 flex items-center gap-2">
          <TrendingUp size={18} /> Historical Flood Events
        </h3>

        <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
          {[...historyData]
            .sort((a, b) => b.year - a.year)
            .map((item) => (
              <div
                key={item.id}
                className="p-4 bg-gray-900 border border-gray-700 rounded hover:border-orange-600 transition-colors"
              >
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1950"
                        max="2030"
                        value={item.year}
                        placeholder="Year"
                        className="w-24 bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-orange-400"
                      />
                      <input
                        type="number"
                        value={item.floods}
                        placeholder="# Floods"
                        className="flex-1 bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-orange-400"
                      />
                      <input
                        type="number"
                        value={item.rainfall}
                        placeholder="Rainfall (mm)"
                        className="flex-1 bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <textarea
                      value={item.description}
                      placeholder="Description"
                      className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-orange-400 resize-none"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-orange-400 text-sm">{item.year}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white text-sm">{item.floods} events</p>
                        <p className="text-xs text-gray-400">{item.rainfall}mm rain</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() =>
                      setEditingId(editingId === item.id ? null : item.id)
                    }
                    className="flex-1 px-2 py-1 text-xs font-bold text-orange-400 border border-orange-600 rounded hover:bg-orange-600/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button className="px-2 py-1 text-xs font-bold text-red-400 border border-red-600 rounded hover:bg-red-600/10 transition-colors flex items-center justify-center gap-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowImportForm(!showImportForm)}
          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
        >
          <Upload size={16} /> Import from CSV
        </button>
      </div>

      {/* CSV Import Form */}
      {showImportForm && (
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
          <h3 className="text-sm font-bold uppercase text-blue-400 mb-4">Import CSV Data</h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono">
              <p className="font-bold mb-2">Format:</p>
              <p>year,floods,rainfall,description</p>
              <p>2020,12,450,"Southwest monsoon with landslides"</p>
              <p>2019,8,320,"Two-week downpour in Colombo"</p>
            </div>

            <textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="Paste CSV data here (without headers)"
              rows={6}
              className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowImportForm(false);
                  setCsvInput('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Process CSV and import
                  setShowImportForm(false);
                  setCsvInput('');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} /> Import Data
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 italic">
            This will add new historical records and update the flood timeline chart visible to all users in real-time.
          </p>
        </div>
      )}

      {/* Single Record Creator */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-green-400 mb-4">Add Single Record</h3>

        <div className="space-y-3">
          <input
            type="number"
            placeholder="Year (e.g., 2025)"
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-400"
          />
          <input
            type="number"
            placeholder="Number of flood events"
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-400"
          />
          <input
            type="number"
            placeholder="Total rainfall (mm)"
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-400"
          />
          <textarea
            placeholder="Description or notes"
            rows={3}
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-400 resize-none"
          />

          <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Chart Preview */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-purple-400 mb-4">How It Appears to Users</h3>

        <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-2">Historical Flood Timeline Chart</p>
            <p className="text-gray-400 text-xs">
              Bar chart showing flood events per year will update when you import new data
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 italic">
          Users can filter by district and see annual flood patterns, which helps them understand local flood frequency and risk trends.
        </p>
      </div>

      {/* Tips */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-yellow-400 mb-4">Data Entry Tips</h3>

        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Collect data from government disaster records and news archives</li>
          <li>• Include at least 10 years of historical data for good trend analysis</li>
          <li>• Track both number of events AND rainfall depth</li>
          <li>• Add descriptions to note major flooding years or reasons</li>
          <li>• Update every year with new flood data for accurate trends</li>
          <li>
            • CSV import is faster for bulk historical uploads from
            databases
          </li>
        </ul>
      </div>
    </div>
  );
}
