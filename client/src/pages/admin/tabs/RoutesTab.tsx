import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Navigation } from 'lucide-react';
import { useMaintenanceStore } from '../../../stores/maintenanceStore';

export default function RoutesTab() {
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [newRouteName, setNewRouteName] = useState('');

  const evacuationRoutes = useMaintenanceStore((s) => s.evacuationRoutes);
  const updateEvacuationRoute = useMaintenanceStore((s) => s.updateEvacuationRoute || (() => {}));

  return (
    <div className="space-y-8">
      {/* Active Routes */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-green-400 mb-6 flex items-center gap-2">
          <Navigation size={18} /> Evacuation Routes
        </h3>

        <div className="space-y-4 mb-6">
          {evacuationRoutes.map((route) => (
            <div
              key={route.id}
              className={`p-4 border rounded-lg transition-colors ${
                route.status === 'active'
                  ? 'bg-green-900/20 border-green-600'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {editingRouteId === route.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={route.from}
                        placeholder="From location"
                        className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-400"
                      />
                      <input
                        type="text"
                        value={route.to}
                        placeholder="To location"
                        className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-400"
                      />
                      <input
                        type="text"
                        value={route.distance}
                        placeholder="Distance (e.g., 12.4 km)"
                        className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-400"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-white">
                        {route.from} → {route.to}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{route.distance}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 cursor-pointer flex-1">
                  <input
                    type="radio"
                    checked={route.status === 'active'}
                    onChange={() => {
                      /* Update route status to active */
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span>Active Route</span>
                </label>

                <button
                  onClick={() =>
                    setEditingRouteId(editingRouteId === route.id ? null : route.id)
                  }
                  className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                >
                  <Edit2 size={16} />
                </button>

                <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg text-sm text-blue-300">
          ℹ️ Active route is displayed in the Evacuation Planner on user pages. Users see the active
          route immediately when they visit.
        </div>
      </div>

      {/* Add New Route */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-blue-400 mb-4">Add New Route</h3>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="From location (e.g., Downtown)"
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            type="text"
            placeholder="To location (e.g., Shelter A)"
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            type="text"
            placeholder="Distance (e.g., 8.5 km)"
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            type="text"
            placeholder="Estimated time (e.g., 22 mins)"
            className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-blue-400"
          />

          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> Create Route
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3 italic">
          Routes can be edited by clicking the edit icon. Switch the active route to show a different evacuation path to users.
        </p>
      </div>

      {/* Route Tips */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
        <h3 className="text-sm font-bold uppercase text-yellow-400 mb-4">Best Practices</h3>

        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Create multiple routes to allow user choice</li>
          <li>• Include high-elevation and infrastructure routes</li>
          <li>• Test routes on your own maps for accuracy</li>
          <li>• Update distances if roads are flooded</li>
          <li>• Mark which shelters can accommodate wheelchairs/elderly</li>
          <li>• Activate the safest route during actual emergencies</li>
        </ul>
      </div>
    </div>
  );
}
