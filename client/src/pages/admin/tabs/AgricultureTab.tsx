import React, { useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Leaf } from 'lucide-react';
import { useAdminControlStore } from '../../../stores/adminControlStore';

export default function AgricultureTab() {
  const [editingAdvisory, setEditingAdvisory] = useState<string | null>(null);
  const [newActionText, setNewActionText] = useState('');
  const [newZoneName, setNewZoneName] = useState('');

  const agricultureAdvisories = useAdminControlStore((s) => s.agricultureAdvisories);
  const updateAdvisory = useAdminControlStore((s) => s.updateAdvisory);
  const agricultureActions = useAdminControlStore((s) => s.agricultureActions);
  const updateAction = useAdminControlStore((s) => s.updateAction);
  const agricultureZones = useAdminControlStore((s) => s.agricultureZones);
  const updateZone = useAdminControlStore((s) => s.updateZone);

  return (
    <div className="space-y-8">
      {/* Crop Advisories */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-green-400 mb-6 flex items-center gap-2">
          <Leaf size={18} /> Crop Advisories
        </h3>

        <div className="space-y-4">
          {agricultureAdvisories.map((advisory) => (
            <div
              key={advisory.id}
              className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-bold text-white">{advisory.cropName}</p>
                  {editingAdvisory === advisory.id ? (
                    <textarea
                      value={advisory.message}
                      onChange={(e) =>
                        updateAdvisory(advisory.id, { message: e.target.value })
                      }
                      className="w-full mt-2 bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-400"
                    />
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">{advisory.message}</p>
                  )}
                </div>
                <button
                  onClick={() =>
                    setEditingAdvisory(editingAdvisory === advisory.id ? null : advisory.id)
                  }
                  className="ml-3 p-2 text-gray-400 hover:text-green-400 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div
                className={`text-xs font-bold px-3 py-1 rounded w-fit ${advisory.statusColor}`}
              >
                {advisory.statusLabel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Action Plan */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-blue-400 mb-6">7-Day Action Plan</h3>

        <div className="space-y-3 mb-4">
          {[...agricultureActions]
            .sort((a, b) => a.order - b.order)
            .map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-bold text-blue-400 w-6">{action.order}.</span>
                  <input
                    type="text"
                    value={action.text}
                    onChange={(e) => updateAction(action.id, e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <button className="ml-2 p-1 text-gray-400 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New action"
            value={newActionText}
            onChange={(e) => setNewActionText(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={() => {
              setNewActionText('');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Risk Zones */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-orange-400 mb-6 flex items-center gap-2">
          <AlertTriangle size={18} /> Affected Risk Zones
        </h3>

        <div className="space-y-3 mb-4">
          {agricultureZones.map((zone) => (
            <div key={zone.id} className="p-4 bg-gray-900 border border-gray-700 rounded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <input
                    type="text"
                    value={zone.district}
                    onChange={(e) => updateZone(zone.id, { district: e.target.value })}
                    className="font-bold text-white bg-transparent border-b border-gray-600 focus:outline-none focus:border-orange-400 mb-1 w-full"
                  />
                  <textarea
                    value={zone.details}
                    onChange={(e) => updateZone(zone.id, { details: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-orange-400 mt-2"
                  />
                </div>
              </div>
              <select
                value={zone.accentColor}
                onChange={(e) =>
                  updateZone(zone.id, { accentColor: e.target.value as any })
                }
                className="bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-orange-400"
              >
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="safe">Safe</option>
              </select>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New zone district"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-orange-400"
          />
          <button
            onClick={() => {
              setNewZoneName('');
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add Zone
          </button>
        </div>
      </div>
    </div>
  );
}
