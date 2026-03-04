import { useState } from 'react';
import { RiskMap } from '../components/RiskMap';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { Layers, X } from 'lucide-react';

export function RiskMapPage() {
  const [activeLayers, setActiveLayers] = useState(['flood', 'reports']);
  const [showLayers, setShowLayers] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  
  const layers = [
    { id: 'flood', label: 'Flood Risk', color: 'bg-critical' },
    { id: 'reports', label: 'Community Reports', color: 'bg-warning' },
    { id: 'evac', label: 'Evacuation Centers', color: 'bg-safe' },
    { id: 'infra', label: 'Infrastructure', color: 'bg-info' },
    { id: 'agri', label: 'Agriculture', color: 'bg-caution' },
  ];

  const toggleLayer = (id: string) => {
    setActiveLayers(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-screen flex flex-col relative bg-bg-primary">
      {/* Map Layers Control - Top Left */}
      {showLayers && (
        <div className="absolute top-2 left-2 md:top-lg md:left-lg z-[1000] w-56 md:w-72">
          <UnifiedCard noPadding className="w-full">
            <div className="flex justify-between items-center mb-inner">
              <h3 className="font-bold uppercase text-sm flex items-center gap-md text-text-primary">
                <Layers size={18} /> Map Layers
              </h3>
              <button
                onClick={() => setShowLayers(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-sm">
              {layers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`
                    flex items-center gap-md px-md py-md text-xs font-semibold uppercase border border-border-light rounded-card transition-all
                    ${
                      activeLayers.includes(layer.id)
                        ? 'bg-critical/10 text-critical border-critical'
                        : 'bg-bg-primary text-text-primary hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`w-3 h-3 ${layer.color} rounded-full`}></div>
                  {layer.label}
                </button>
              ))}
            </div>
          </UnifiedCard>
        </div>
      )}

      {/* Main Map Container */}
      <div className="flex-1 w-full h-full bg-gray-100 relative overflow-hidden">
        <RiskMap />

        {/* Legend Panel - Bottom Right */}
        {showLegend && (
          <div className="absolute bottom-2 right-2 md:bottom-xl md:right-xl z-[1000] w-64 md:w-80">
            <UnifiedCard noPadding>
              <div className="flex justify-between items-center mb-inner">
                <div>
                  <h4 className="font-bold uppercase text-sm text-text-primary">Live Situation</h4>
                  <p className="text-xs text-text-secondary mt-xs">
                    Updated 5 mins ago • 12 Active Reports
                  </p>
                </div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Legend Items */}
              <div className="grid grid-cols-2 gap-md">
                <div className="flex items-center gap-md p-md bg-bg-primary rounded-card border border-border-light">
                  <span className="w-4 h-4 bg-critical rounded-full"></span>
                  <span className="text-xs font-bold uppercase text-text-primary">Critical</span>
                </div>
                <div className="flex items-center gap-md p-md bg-bg-primary rounded-card border border-border-light">
                  <span className="w-4 h-4 bg-warning rounded-full"></span>
                  <span className="text-xs font-bold uppercase text-text-primary">Warning</span>
                </div>
                <div className="flex items-center gap-md p-md bg-bg-primary rounded-card border border-border-light">
                  <span className="w-4 h-4 bg-safe rounded-full"></span>
                  <span className="text-xs font-bold uppercase text-text-primary">Safe</span>
                </div>
                <div className="flex items-center gap-md p-md bg-bg-primary rounded-card border border-border-light">
                  <span className="w-4 h-4 bg-caution rounded-full"></span>
                  <span className="text-xs font-bold uppercase text-text-primary">Caution</span>
                </div>
              </div>

              {/* Active Layers */}
              <div className="mt-inner pt-inner border-t border-border-light">
                <p className="text-xs font-semibold text-text-secondary uppercase mb-md">Active Layers:</p>
                <div className="flex flex-wrap gap-xs">
                  {activeLayers.map(layerId => {
                    const layer = layers.find(l => l.id === layerId);
                    return layer ? (
                      <span key={layer.id} className="inline-block bg-bg-primary text-text-primary text-xs font-semibold px-md py-xs rounded-card border border-border-light">
                        {layer.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </UnifiedCard>
          </div>
        )}
      </div>
    </div>
  );
}