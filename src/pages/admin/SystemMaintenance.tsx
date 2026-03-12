import React, { useState } from 'react';
import {
  Phone, Map, Navigation, History, Sliders, Settings,
  Plus, Trash2, Eye, EyeOff, Save, Edit2, X, Check,
  Wrench, Wind, Droplets, AlertTriangle,
} from 'lucide-react';
import { useMaintenanceStore } from '../../stores/maintenanceStore';

// ═══ Tab definitions ═══
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Wind },
  { id: 'emergency', label: 'Emergency Contacts', icon: Phone },
  { id: 'map', label: 'Map Management', icon: Map },
  { id: 'evacuation', label: 'Evacuation Routes', icon: Navigation },
  { id: 'history', label: 'Flood History', icon: History },
  { id: 'simulation', label: 'Simulation Config', icon: Sliders },
  { id: 'settings', label: 'System Settings', icon: Settings },
] as const;
type TabId = typeof TABS[number]['id'];

// ═══ Reusable panel wrapper ═══
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
        <h3 className="text-sm font-bold uppercase text-blue-400">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ═══ Dashboard Overrides Tab ═══
function DashboardTab() {
  const overrides = useMaintenanceStore((s) => s.dashboardOverrides);
  const update = useMaintenanceStore((s) => s.updateDashboardOverrides);
  return (
    <div className="space-y-6">
      <Panel title="Weather Data Overrides">
        <p className="text-xs text-gray-400 mb-4">Set manual overrides for dashboard metrics. Leave empty to use live data.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Wind Speed (km/h)</label>
            <input
              type="number"
              placeholder="Auto"
              value={overrides.windSpeed ?? ''}
              onChange={(e) => update({ windSpeed: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Rainfall (mm)</label>
            <input
              type="number"
              placeholder="Auto"
              value={overrides.rainfall ?? ''}
              onChange={(e) => update({ rainfall: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Risk Status Override</label>
            <select
              value={overrides.riskStatus ?? ''}
              onChange={(e) => update({ riskStatus: e.target.value || null })}
              className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">Auto (from weather)</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MODERATE">MODERATE</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => update({ windSpeed: null, rainfall: null, riskStatus: null })}
          className="mt-4 px-4 py-2 bg-gray-700 text-gray-300 text-xs font-bold uppercase rounded-lg hover:bg-gray-600 transition-colors"
        >
          Reset to Auto
        </button>
      </Panel>
    </div>
  );
}

// ═══ Emergency Contacts Tab ═══
function EmergencyContactsTab() {
  const contacts = useMaintenanceStore((s) => s.emergencyContacts);
  const addContact = useMaintenanceStore((s) => s.addEmergencyContact);
  const updateContact = useMaintenanceStore((s) => s.updateEmergencyContact);
  const removeContact = useMaintenanceStore((s) => s.removeEmergencyContact);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newType, setNewType] = useState<'police' | 'ambulance' | 'fire' | 'disaster' | 'custom'>('custom');

  const handleAdd = () => {
    if (!newLabel.trim() || !newNumber.trim()) return;
    addContact({ label: newLabel.trim(), number: newNumber.trim(), type: newType, active: true });
    setNewLabel('');
    setNewNumber('');
    setAdding(false);
  };

  return (
    <Panel title="Emergency Contact Numbers">
      <div className="space-y-3">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
            <button onClick={() => updateContact(c.id, { active: !c.active })} className="shrink-0">
              {c.active ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-gray-500" />}
            </button>
            <div className="flex-1 min-w-0">
              <input
                value={c.label}
                onChange={(e) => updateContact(c.id, { label: e.target.value })}
                className="bg-transparent text-white text-sm font-semibold w-full focus:outline-none"
              />
            </div>
            <input
              value={c.number}
              onChange={(e) => updateContact(c.id, { number: e.target.value })}
              className="bg-gray-800 border border-gray-600 text-white text-sm px-3 py-1 rounded-lg w-32 focus:outline-none focus:border-blue-400"
            />
            <span className="text-[10px] font-bold uppercase text-gray-500 w-16 text-center">{c.type}</span>
            <button onClick={() => removeContact(c.id)} className="text-gray-500 hover:text-red-400 transition-colors shrink-0">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="mt-4 flex items-end gap-3 bg-gray-900 p-4 rounded-lg border border-blue-400/30">
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Label</label>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Service name" className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <div className="w-32">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Number</label>
            <input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="123" className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <div className="w-32">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Type</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value as typeof newType)} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-400">
              <option value="police">Police</option>
              <option value="ambulance">Ambulance</option>
              <option value="fire">Fire</option>
              <option value="disaster">Disaster</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-500 transition-colors"><Check size={16} /></button>
          <button onClick={() => setAdding(false)} className="px-4 py-2 bg-gray-700 text-gray-300 text-xs font-bold uppercase rounded-lg hover:bg-gray-600 transition-colors"><X size={16} /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-500 transition-colors">
          <Plus size={16} /> Add Contact
        </button>
      )}
    </Panel>
  );
}

// ═══ Map Management Tab ═══
function MapManagementTab() {
  const zones = useMaintenanceStore((s) => s.mapZones);
  const markers = useMaintenanceStore((s) => s.mapMarkers);
  const updateZone = useMaintenanceStore((s) => s.updateMapZone);
  const updateMarker = useMaintenanceStore((s) => s.updateMapMarker);
  const removeMarker = useMaintenanceStore((s) => s.removeMapMarker);
  const addMarker = useMaintenanceStore((s) => s.addMapMarker);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newType, setNewType] = useState<'shelter' | 'hospital' | 'report'>('shelter');

  const typeColors: Record<string, string> = {
    critical: 'text-red-400',
    'high-risk': 'text-orange-400',
    safe: 'text-green-400',
    evacuation: 'text-blue-400',
  };

  const handleAddMarker = () => {
    if (!newLabel.trim()) return;
    addMarker({ label: newLabel.trim(), markerType: newType, position: [7.0, 80.0], detail: newDetail.trim(), visible: true });
    setNewLabel('');
    setNewDetail('');
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <Panel title="Flood Zones">
        <div className="space-y-3">
          {zones.map((z) => (
            <div key={z.id} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
              <button onClick={() => updateZone(z.id, { visible: !z.visible })} className="shrink-0">
                {z.visible ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-gray-500" />}
              </button>
              <div className={`text-xs font-bold uppercase w-20 ${typeColors[z.zoneType] || 'text-gray-400'}`}>{z.zoneType}</div>
              <div className="flex-1 min-w-0">
                <input
                  value={z.name}
                  onChange={(e) => updateZone(z.id, { name: e.target.value })}
                  className="bg-transparent text-white text-sm font-semibold w-full focus:outline-none"
                />
              </div>
              <input
                value={z.description}
                onChange={(e) => updateZone(z.id, { description: e.target.value })}
                className="bg-gray-800 border border-gray-600 text-gray-300 text-xs px-3 py-1 rounded-lg w-48 focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Map Markers">
        <div className="space-y-3">
          {markers.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
              <button onClick={() => updateMarker(m.id, { visible: !m.visible })} className="shrink-0">
                {m.visible ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-gray-500" />}
              </button>
              <span className="text-[10px] font-bold uppercase text-gray-500 w-16">{m.markerType}</span>
              <div className="flex-1 min-w-0">
                <input
                  value={m.label}
                  onChange={(e) => updateMarker(m.id, { label: e.target.value })}
                  className="bg-transparent text-white text-sm font-semibold w-full focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-gray-500 font-mono">{m.position[0].toFixed(2)}, {m.position[1].toFixed(2)}</span>
              <button onClick={() => removeMarker(m.id)} className="text-gray-500 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        {adding ? (
          <div className="mt-4 flex items-end gap-3 bg-gray-900 p-4 rounded-lg border border-blue-400/30">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Label</label>
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div className="w-32">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value as typeof newType)} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none">
                <option value="shelter">Shelter</option>
                <option value="hospital">Hospital</option>
                <option value="report">Report</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Detail</label>
              <input value={newDetail} onChange={(e) => setNewDetail(e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <button onClick={handleAddMarker} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-500"><Check size={16} /></button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-600"><X size={16} /></button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-500 transition-colors">
            <Plus size={16} /> Add Marker
          </button>
        )}
      </Panel>
    </div>
  );
}

// ═══ Evacuation Tab ═══
function EvacuationTab() {
  const routes = useMaintenanceStore((s) => s.evacuationRoutes);
  const updateRoute = useMaintenanceStore((s) => s.updateEvacuationRoute);
  const addRoute = useMaintenanceStore((s) => s.addEvacuationRoute);
  const removeRoute = useMaintenanceStore((s) => s.removeEvacuationRoute);
  const [adding, setAdding] = useState(false);
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newDist, setNewDist] = useState('');

  const statusColors: Record<string, string> = { active: 'bg-green-600', blocked: 'bg-red-600', caution: 'bg-yellow-500' };

  const handleAdd = () => {
    if (!newFrom.trim() || !newTo.trim()) return;
    addRoute({ name: `${newFrom.trim()} → ${newTo.trim()}`, from: newFrom.trim(), to: newTo.trim(), distance: newDist.trim() || '—', status: 'active' });
    setNewFrom('');
    setNewTo('');
    setNewDist('');
    setAdding(false);
  };

  return (
    <Panel title="Evacuation Routes">
      <div className="space-y-3">
        {routes.map((r) => (
          <div key={r.id} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-white">{r.from}</span>
              <span className="text-gray-500 mx-2">→</span>
              <span className="text-sm font-semibold text-white">{r.to}</span>
            </div>
            <span className="text-xs text-gray-400 font-mono w-20 text-center">{r.distance}</span>
            <select
              value={r.status}
              onChange={(e) => updateRoute(r.id, { status: e.target.value as 'active' | 'blocked' | 'caution' })}
              className="bg-gray-800 border border-gray-600 text-white text-xs px-2 py-1 rounded-lg focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="caution">Caution</option>
            </select>
            <span className={`w-3 h-3 rounded-full ${statusColors[r.status]}`} />
            <button onClick={() => removeRoute(r.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="mt-4 flex items-end gap-3 bg-gray-900 p-4 rounded-lg border border-blue-400/30">
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">From</label>
            <input value={newFrom} onChange={(e) => setNewFrom(e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">To</label>
            <input value={newTo} onChange={(e) => setNewTo(e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <div className="w-24">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Distance</label>
            <input value={newDist} onChange={(e) => setNewDist(e.target.value)} placeholder="km" className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-500"><Check size={16} /></button>
          <button onClick={() => setAdding(false)} className="px-4 py-2 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-600"><X size={16} /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-500 transition-colors">
          <Plus size={16} /> Add Route
        </button>
      )}
    </Panel>
  );
}

// ═══ History Tab ═══
function HistoryTab() {
  const data = useMaintenanceStore((s) => s.historyData);
  const updateEntry = useMaintenanceStore((s) => s.updateHistoryEntry);
  const addEntry = useMaintenanceStore((s) => s.addHistoryEntry);
  const removeEntry = useMaintenanceStore((s) => s.removeHistoryEntry);
  const [adding, setAdding] = useState(false);
  const [newYear, setNewYear] = useState(2024);
  const [newFloods, setNewFloods] = useState(0);
  const [newRain, setNewRain] = useState(0);
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = () => {
    addEntry({ year: newYear, floods: newFloods, rainfall: newRain, description: newDesc.trim() || 'No description' });
    setAdding(false);
    setNewYear(2024);
    setNewFloods(0);
    setNewRain(0);
    setNewDesc('');
  };

  return (
    <Panel title="Flood History Data">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-xs font-bold uppercase text-gray-400">
              <th className="py-2 text-left">Year</th>
              <th className="py-2 text-left">Floods</th>
              <th className="py-2 text-left">Rainfall (mm)</th>
              <th className="py-2 text-left">Description</th>
              <th className="py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((h) => (
              <tr key={h.id} className="border-b border-gray-800">
                <td className="py-2 pr-2">
                  <input type="number" value={h.year} onChange={(e) => updateEntry(h.id, { year: Number(e.target.value) })} className="bg-transparent text-white w-20 focus:outline-none" />
                </td>
                <td className="py-2 pr-2">
                  <input type="number" value={h.floods} onChange={(e) => updateEntry(h.id, { floods: Number(e.target.value) })} className="bg-transparent text-white w-16 focus:outline-none" />
                </td>
                <td className="py-2 pr-2">
                  <input type="number" value={h.rainfall} onChange={(e) => updateEntry(h.id, { rainfall: Number(e.target.value) })} className="bg-transparent text-white w-20 focus:outline-none" />
                </td>
                <td className="py-2 pr-2">
                  <input value={h.description} onChange={(e) => updateEntry(h.id, { description: e.target.value })} className="bg-transparent text-gray-300 w-full focus:outline-none" />
                </td>
                <td className="py-2">
                  <button onClick={() => removeEntry(h.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding ? (
        <div className="mt-4 flex items-end gap-3 bg-gray-900 p-4 rounded-lg border border-blue-400/30">
          <div className="w-20"><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Year</label><input type="number" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-2 py-2 rounded-lg focus:outline-none" /></div>
          <div className="w-16"><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Floods</label><input type="number" value={newFloods} onChange={(e) => setNewFloods(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-2 py-2 rounded-lg focus:outline-none" /></div>
          <div className="w-20"><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Rainfall</label><input type="number" value={newRain} onChange={(e) => setNewRain(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-2 py-2 rounded-lg focus:outline-none" /></div>
          <div className="flex-1"><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Description</label><input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg focus:outline-none" /></div>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-500"><Check size={16} /></button>
          <button onClick={() => setAdding(false)} className="px-4 py-2 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-600"><X size={16} /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-500 transition-colors">
          <Plus size={16} /> Add Entry
        </button>
      )}
    </Panel>
  );
}

// ═══ Simulation Tab ═══
function SimulationTab() {
  const defaults = useMaintenanceStore((s) => s.simulationDefaults);
  const update = useMaintenanceStore((s) => s.updateSimulationDefaults);

  return (
    <Panel title="Default Simulation Variables">
      <p className="text-xs text-gray-400 mb-6">Configure default slider values for the public What-If Lab.</p>
      <div className="space-y-6">
        {[
          { key: 'rainfall' as const, label: 'Rainfall', color: '#E63946', value: defaults.rainfall },
          { key: 'drainage' as const, label: 'Drainage Capacity', color: '#2ECC71', value: defaults.drainage },
          { key: 'urbanization' as const, label: 'Urban Density', color: '#3A86FF', value: defaults.urbanization },
        ].map((s) => (
          <div key={s.key}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-bold uppercase text-white">{s.label}</span>
              <span className="font-mono text-sm text-gray-400">{s.value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={s.value}
              onChange={(e) => update({ [s.key]: Number(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${s.value}%, #374151 ${s.value}%, #374151 100%)` }}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ═══ System Settings Tab ═══
function SettingsTab() {
  const settings = useMaintenanceStore((s) => s.systemSettings);
  const update = useMaintenanceStore((s) => s.updateSystemSettings);

  return (
    <div className="space-y-6">
      <Panel title="Default Map Configuration">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Center Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={settings.defaultMapCenter[0]}
              onChange={(e) => update({ defaultMapCenter: [Number(e.target.value), settings.defaultMapCenter[1]] })}
              className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Center Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={settings.defaultMapCenter[1]}
              onChange={(e) => update({ defaultMapCenter: [settings.defaultMapCenter[0], Number(e.target.value)] })}
              className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Default Zoom</label>
            <input
              type="number"
              min="1"
              max="18"
              value={settings.defaultMapZoom}
              onChange={(e) => update({ defaultMapZoom: Number(e.target.value) })}
              className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </Panel>

      <Panel title="Risk Thresholds">
        <p className="text-xs text-gray-400 mb-4">Rainfall percentile thresholds that trigger each risk level.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'critical' as const, label: 'Critical', color: 'text-red-400' },
            { key: 'high' as const, label: 'High', color: 'text-orange-400' },
            { key: 'moderate' as const, label: 'Moderate', color: 'text-yellow-400' },
          ].map((t) => (
            <div key={t.key}>
              <label className={`block text-xs font-bold uppercase mb-2 ${t.color}`}>{t.label} ≥</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.riskThresholds[t.key]}
                onChange={(e) => update({ riskThresholds: { ...settings.riskThresholds, [t.key]: Number(e.target.value) } })}
                className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Alert Messages">
        <div className="space-y-4">
          {(['critical', 'high', 'moderate', 'safe'] as const).map((level) => (
            <div key={level}>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">{level}</label>
              <input
                value={settings.alertMessages[level]}
                onChange={(e) => update({ alertMessages: { ...settings.alertMessages, [level]: e.target.value } })}
                className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ═══ Main Page ═══
export function SystemMaintenance() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Wrench size={28} className="text-blue-400" />
          <h2 className="text-4xl font-bold uppercase tracking-tight text-white">
            System Maintenance
          </h2>
        </div>
        <p className="text-sm font-semibold text-gray-400">
          MAINTENANCE MODULE • FULL SYSTEM CONTROL
        </p>
      </div>

      <div className="flex gap-6 min-h-[600px]">
        {/* Sidebar tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold uppercase rounded-lg transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'emergency' && <EmergencyContactsTab />}
          {activeTab === 'map' && <MapManagementTab />}
          {activeTab === 'evacuation' && <EvacuationTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'simulation' && <SimulationTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
