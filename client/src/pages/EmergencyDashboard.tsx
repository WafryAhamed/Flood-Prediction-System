import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Radio, Wind, Droplets, MapPin, Navigation as NavIcon, X } from 'lucide-react';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { RiskMap } from '../components/RiskMap';
import { motion } from 'framer-motion';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useWeatherData } from '../hooks/useWeatherData';
import { useAdminControlStore } from '../stores/adminControlStore';
import { useMaintenanceStore } from '../stores/maintenanceStore';

export function EmergencyDashboard() {
  const [time, setTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const { weather } = useWeatherData();
  const broadcastFeed = useAdminControlStore((s) => s.broadcastFeed);
  const dashboardResources = useAdminControlStore((s) => s.dashboardResources);
  const dashboardOverrides = useMaintenanceStore((s) => s.dashboardOverrides);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const windSpeed = dashboardOverrides.windSpeed ?? weather?.windSpeed ?? null;
  const rainfall = dashboardOverrides.rainfall ?? weather?.rainfall ?? null;
  const computedRisk = rainfall === null
    ? 'MODERATE'
    : rainfall > 5
      ? 'CRITICAL'
      : rainfall > 2
        ? 'HIGH'
        : 'MODERATE';
  const riskLevel = dashboardOverrides.riskStatus || computedRisk;

  const metrics = [
    { icon: Wind, label: 'Wind Speed', value: windSpeed !== null ? `${windSpeed}` : '—', unit: 'km/h', color: 'bg-blue-100 text-blue-600', animation: 'animate-wind' },
    { icon: Droplets, label: 'Rainfall', value: rainfall !== null ? `${rainfall}` : '—', unit: 'mm', color: 'bg-red-100 text-red-600', animation: 'animate-water-ripple' },
    { icon: AlertTriangle, label: 'Risk Level', value: riskLevel, unit: '', color: 'bg-orange-100 text-orange-600', animation: 'animate-warning-flash' },
    { icon: CheckCircle, label: 'System Status', value: 'ACTIVE', unit: '', color: 'bg-green-100 text-green-600', animation: 'animate-pulse-green' }
  ];

  return (
    <div className="min-h-screen bg-bg-primary pb-20 md:pb-section flex flex-col gap-section">

      {isLoading ? (
        <div className="px-4 sm:px-6 md:px-8 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <LoadingSkeleton count={4} variant="metric" />
            <LoadingSkeleton count={1} variant="map" />
          </div>
        </div>
      ) : (
      <>
      {/* Hero Section */}
      <section className="px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <UnifiedCard noPadding>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-lg">
                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block bg-red-600 text-white px-lg py-sm font-bold text-xs uppercase tracking-widest mb-md rounded-lg"
                  >
                    ● Active Alert
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-headline-lg font-bold text-text-primary"
                  >
                    Emergency Response Center
                  </motion.h1>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-right"
                >
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold font-mono text-text-primary tracking-tighter">
                    {formatTime(time)}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-text-secondary mt-xs">
                    Local Time • Mihintale, Sri Lanka
                  </div>
                </motion.div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`flex flex-col items-center text-center p-md rounded-lg border-2 ${
                      metric.label === 'Wind Speed' ? 'bg-blue-700 border-blue-900 text-white' :
                      metric.label === 'Rainfall' ? 'bg-red-700 border-red-900 text-white' :
                      metric.label === 'Risk Level' ? 'bg-orange-700 border-orange-900 text-white' :
                      'bg-green-700 border-green-900 text-white'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${metric.color} flex items-center justify-center mb-md ${metric.animation}`}>
                      <metric.icon size={24} />
                    </div>
                    <div className="text-xs uppercase font-semibold mb-xs opacity-90">
                      {metric.label}
                    </div>
                    <div className="text-2xl font-bold">
                      {metric.value}
                    </div>
                    {metric.unit && (
                      <div className="text-xs font-medium opacity-75">
                        {metric.unit}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </UnifiedCard>

          {/* Awareness Ranges */}
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-md grid grid-cols-1 md:grid-cols-2 gap-md"
            >
              <div className="relative bg-green-950 border-2 border-green-600 rounded-lg p-md pr-12">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="absolute top-3 right-3 bg-green-600 text-white hover:bg-green-500 p-1.5 rounded-full transition-colors cursor-pointer z-10"
                  aria-label="Close notification"
                >
                  <X size={18} />
                </button>
                <h4 className="text-sm font-bold text-green-300 mb-md flex items-center gap-2">
                  ✓ NORMAL CONDITIONS
                </h4>
                <div className="space-y-sm text-xs text-green-100">
                  <div><span className="font-semibold">Wind Speed:</span> 0-20 km/h</div>
                  <div><span className="font-semibold">Rainfall:</span> 0-5 mm</div>
                  <div><span className="font-semibold">Risk Level:</span> LOW</div>
                  <div><span className="font-semibold">Status:</span> ACTIVE</div>
                </div>
              </div>

              <div className="relative bg-red-950 border-2 border-red-600 rounded-lg p-md pr-12">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="absolute top-3 right-3 bg-red-600 text-white hover:bg-red-500 p-1.5 rounded-full transition-colors cursor-pointer z-10"
                  aria-label="Close notification"
                >
                  <X size={18} />
                </button>
                <h4 className="text-sm font-bold text-red-300 mb-md flex items-center gap-2">
                  ⚠️ CRITICAL ALERT
                </h4>
                <div className="space-y-sm text-xs text-red-100">
                  <div><span className="font-semibold">Wind Speed:</span> 60+ km/h</div>
                  <div><span className="font-semibold">Rainfall:</span> 30+ mm</div>
                  <div><span className="font-semibold">Risk Level:</span> CRITICAL</div>
                  <div><span className="font-semibold">Status:</span> EMERGENCY</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Map Card Section */}
      <section className="px-4 sm:px-6 md:px-8 flex-1">
        <div className="max-w-7xl mx-auto">
          <UnifiedCard noPadding className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] min-h-[300px]">
            <div className="absolute inset-0 z-10">
              <RiskMap />
            </div>

            {/* Radar Indicator */}
            <div className="absolute top-3 left-3 md:top-6 md:left-6 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-2 py-1.5 border border-border-light">
              <svg width="20" height="20" viewBox="0 0 20 20" className="animate-radar" aria-hidden="true">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                <line x1="10" y1="10" x2="10" y2="2" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                <circle cx="10" cy="10" r="2" fill="#2563EB" />
              </svg>
              <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wide">Live</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-live-dot"></span>
            </div>

            {/* Map Controls - Floating Legend */}
            <div className="absolute top-3 right-3 md:top-6 md:right-6 z-20 bg-white rounded-lg shadow-lg p-2 md:p-md border border-border-light max-w-[160px] md:max-w-xs">
              <div className="text-sm font-bold text-text-primary mb-md">Risk Zones</div>
              <div className="space-y-xs">
                <div className="flex items-center gap-md">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span className="text-xs text-text-secondary">Critical</span>
                </div>
                <div className="flex items-center gap-md">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-text-secondary">High</span>
                </div>
                <div className="flex items-center gap-md">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span className="text-xs text-text-secondary">Medium</span>
                </div>
                <div className="flex items-center gap-md">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="text-xs text-text-secondary">Safe</span>
                </div>
              </div>
            </div>

            {/* My Location Button - Bottom Left */}
            <button className="absolute bottom-6 left-6 z-20 bg-white rounded-full shadow-lg p-3 border border-border-light hover:shadow-xl transition-shadow">
              <MapPin size={20} className="text-text-primary" />
            </button>
          </UnifiedCard>
        </div>
      </section>

      {/* Emergency Action Buttons */}
      <section className="px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-md">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => console.log('SOS')}
            className="h-14 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-md"
          >
            <AlertTriangle size={20} />
            <span>SOS</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-md"
          >
            <NavIcon size={20} />
            <span>Evacuate</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-14 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold uppercase text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-md"
          >
            <Radio size={20} />
            <span>Report</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-14 bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-md"
          >
            <CheckCircle size={20} />
            <span>Safe Zone</span>
          </motion.button>
        </div>
      </section>

      {/* Information Cards Grid */}
      <section className="px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-md">
          <UnifiedCard title="Broadcast Feed" subtitle="Latest emergency updates" accentColor="critical">
            <div className="space-y-md max-h-96 overflow-y-auto">
              {broadcastFeed.filter(b => b.active).map((item) => (
                <div key={item.id} className="p-md bg-gray-50 rounded-lg border border-border-light hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-xs">
                    <span className="font-bold text-xs text-text-secondary font-mono">{item.time}</span>
                    <Radio size={14} className="text-red-600" />
                  </div>
                  <p className="text-sm text-text-primary leading-snug">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </UnifiedCard>

          <UnifiedCard title="Resources" subtitle="Availability status" accentColor="safe">
            <div className="space-y-md">
              {dashboardResources.filter(r => r.visible).map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-md bg-gray-50 rounded-lg border border-border-light hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-sm text-text-primary uppercase">{resource.name}</span>
                  <span className={`${resource.statusColor} text-white text-xs font-bold px-md py-xs rounded-lg`}>
                    {resource.status}
                  </span>
                </div>
              ))}
            </div>
          </UnifiedCard>
        </div>
      </section>
      </>
      )}
    </div>
  );
}