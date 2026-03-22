import React, { useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { useAdminControlStore } from '../../../stores/adminControlStore';

export default function RecoveryTab() {
  const [newNeed, setNewNeed] = useState('');
  const [newUpdateText, setNewUpdateText] = useState('');

  const recoveryProgress = useAdminControlStore((s) => s.recoveryProgress);
  const updateRecoveryProgress = useAdminControlStore((s) => s.updateRecoveryProgress);
  const recoveryNeeds = useAdminControlStore((s) => s.recoveryNeeds);
  const updateRecoveryNeed = useAdminControlStore((s) => s.updateRecoveryNeed);
  const recoveryUpdates = useAdminControlStore((s) => s.recoveryUpdates);
  const addRecoveryUpdate = useAdminControlStore((s) => s.addRecoveryUpdate);

  return (
    <div className="space-y-8">
      {/* Restoration Progress */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-green-400 mb-6 flex items-center gap-2">
          <TrendingUp size={18} /> Restoration Progress
        </h3>

        <div className="space-y-4">
          {recoveryProgress.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-300">{item.label}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.percent}
                  onChange={(e) =>
                    updateRecoveryProgress(item.id, parseInt(e.target.value) || 0)
                  }
                  className="w-16 bg-gray-900 border border-gray-600 text-white px-2 py-1 rounded text-sm focus:outline-none focus:border-green-400"
                />
                <span className="text-sm font-bold text-green-400">{item.percent}%</span>
              </div>
              <div className="h-3 w-full bg-gray-900 border border-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all`}
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Needs */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-red-400 mb-6">Critical Needs</h3>

        <div className="space-y-3 mb-4">
          {recoveryNeeds.map((need) => (
            <div
              key={need.id}
              className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded"
            >
              <input
                type="text"
                value={need.name}
                onChange={(e) => updateRecoveryNeed(need.id, { name: e.target.value })}
                className="flex-1 bg-gray-800 border border-gray-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:border-red-400"
              />
              <select
                value={need.urgency}
                onChange={(e) =>
                  updateRecoveryNeed(need.id, { urgency: e.target.value as any })
                }
                className="ml-2 bg-gray-800 border border-gray-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:border-red-400"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="LOW">Low</option>
              </select>
              <button className="ml-2 p-1 text-gray-400 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New need (e.g., Blankets)"
            value={newNeed}
            onChange={(e) => setNewNeed(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-red-400"
          />
          <button
            onClick={() => {
              setNewNeed('');
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Recovery Updates Feed */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-blue-400 mb-6">Recovery Milestones</h3>

        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {recoveryUpdates.map((update) => (
            <div key={update.id} className="p-3 bg-gray-900 border border-gray-700 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{update.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{update.time}</p>
                </div>
                <button className="ml-2 p-1 text-gray-400 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="New milestone (e.g., 500 families relocated)"
            value={newUpdateText}
            onChange={(e) => setNewUpdateText(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={() => {
              if (newUpdateText.trim()) {
                addRecoveryUpdate({
                  iconName: 'CheckCircle',
                  title: newUpdateText,
                  time: 'Just now',
                });
                setNewUpdateText('');
              }
            }}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Post Update
          </button>
        </div>
      </div>

      {/* Relief Resources */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-purple-400 mb-6">Relief Contacts</h3>

        <div className="space-y-3">
          {/* Resources are read-only in this version */}
          <p className="text-xs text-gray-400 italic">
            Relief contact information is managed via emergency contacts in Settings tab.
          </p>
          <div className="p-3 bg-gray-900 border border-gray-700 rounded text-sm">
            <p className="font-bold text-white">Crisis Hotline</p>
            <p className="text-gray-400">+94-11-2-345-678</p>
          </div>
          <div className="p-3 bg-gray-900 border border-gray-700 rounded text-sm">
            <p className="font-bold text-white">Medical Support</p>
            <p className="text-gray-400">Red Cross Centers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
