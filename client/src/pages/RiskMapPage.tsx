import { useState, useEffect } from 'react';
import { RiskMap } from '../components/RiskMap';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { Layers, X } from 'lucide-react';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export function RiskMapPage() {
  const [activeLayers, setActiveLayers] = useState(['flood', 'reports']);
  const [showLayers, setShowLayers] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);
  
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
      {/* Map Layers Control - REMOVED */}

      {/* Main Map Container */}
      <div className="flex-1 w-full h-full bg-gray-100 relative overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <LoadingSkeleton variant="map" />
          </div>
        ) : (
        <>
        <RiskMap />

        {/* Legend Panel - REMOVED */}
        </>
        )}
      </div>
    </div>
  );
}