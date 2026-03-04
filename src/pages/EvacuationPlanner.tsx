import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { UnifiedCard } from '../components/ui/UnifiedCard';
import { Navigation, AlertTriangle, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function EvacuationPlanner() {
  const [routeActive, setRouteActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    avoidWater: true,
    wheelchairSafe: false,
    elderlyFriendly: true
  });

  const route = [[51.505, -0.09], [51.51, -0.1], [51.51, -0.12]];

  return (
    <div className="h-screen flex flex-col relative bg-bg-primary">
      {/* Header Bar */}
      <header className="md:hidden px-lg py-md border-b border-border-light bg-bg-card z-20">
        <h1 className="text-2xl font-bold uppercase text-text-primary mb-md">Evacuation Planner</h1>
        <p className="text-xs font-semibold text-text-secondary">Find the safest route to higher ground.</p>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {/* Map Container */}
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {routeActive && (
            <>
              <Polyline
                positions={route as any}
                pathOptions={{
                  color: '#1F2937',
                  weight: 6,
                  dashArray: '10, 10'
                }}
              />
              <Polyline
                positions={route as any}
                pathOptions={{
                  color: '#16A34A',
                  weight: 3
                }}
              />
              <Marker position={[51.505, -0.09]}>
                <Popup>Start</Popup>
              </Marker>
              <Marker position={[51.51, -0.12]}>
                <Popup>Safe Zone</Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        {/* Find Route Button - Floating */}
        {!routeActive ? (
          <button
            onClick={() => setRouteActive(true)}
            className="absolute bottom-24 md:bottom-lg left-1/2 transform -translate-x-1/2 z-20 bg-critical text-white px-xl py-md font-bold text-sm uppercase rounded-card shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-md md:left-lg md:translate-x-0"
          >
            <Navigation strokeWidth={2.5} size={20} /> Find Safe Route
          </button>
        ) : (
          <div className="absolute bottom-24 md:bottom-lg left-lg z-20 bg-bg-card border border-border-light px-lg py-md font-bold uppercase rounded-card shadow-card text-xs text-text-primary">
            Route Active • 1.2km • 15 mins
          </div>
        )}

        {/* Route Settings Panel - Left Side (Desktop) / Bottom Sheet (Mobile) */}
        {/* Desktop Sidebar */}
        <div className="hidden md:block absolute top-lg left-lg z-10 w-80">
          <UnifiedCard noPadding className="w-full overflow-hidden">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-inner py-inner bg-bg-card hover:bg-bg-primary transition-colors flex items-center justify-between border-b border-border-light"
            >
              <h3 className="font-bold text-sm uppercase text-text-primary">Route Settings</h3>
              <ChevronDown size={18} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-inner space-y-md border-b border-border-light">
                    {/* Toggle: Avoid Water */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-text-primary">Avoid Water &gt; 1ft</span>
                      <button
                        onClick={() => setSettings({ ...settings, avoidWater: !settings.avoidWater })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.avoidWater ? 'bg-critical' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          animate={{ x: settings.avoidWater ? 24 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>

                    {/* Toggle: Wheelchair Safe */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-text-primary">Wheelchair Safe</span>
                      <button
                        onClick={() => setSettings({ ...settings, wheelchairSafe: !settings.wheelchairSafe })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.wheelchairSafe ? 'bg-safe' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          animate={{ x: settings.wheelchairSafe ? 24 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>

                    {/* Toggle: Elderly Friendly */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-text-primary">Elderly Friendly</span>
                      <button
                        onClick={() => setSettings({ ...settings, elderlyFriendly: !settings.elderlyFriendly })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.elderlyFriendly ? 'bg-critical' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          animate={{ x: settings.elderlyFriendly ? 24 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Directions */}
            {routeActive && (
              <div className="p-inner border-t border-border-light">
                <h4 className="font-bold text-xs uppercase mb-md text-text-primary">Directions</h4>
                <ol className="list-decimal list-inside space-y-md text-xs font-semibold text-text-secondary">
                  <li>Head North on Main St (200m)</li>
                  <li>Turn Right onto High Ground Rd</li>
                  <li className="text-caution">CAUTION: Wet Surface</li>
                  <li>Arrive at Temple Shelter</li>
                </ol>
              </div>
            )}
          </UnifiedCard>

          {/* Emergency Kit Alert */}
          <div className="mt-md bg-caution/10 text-text-primary border border-caution p-md rounded-card">
            <div className="flex items-start gap-md">
              <AlertTriangle size={18} className="shrink-0 mt-px text-caution" />
              <div>
                <h4 className="font-bold text-xs uppercase mb-xs">Emergency Kit</h4>
                <p className="text-xs leading-snug text-text-secondary">
                  Don't forget your documents, medicines, and water.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Elevation Profile - Floating Bottom Right */}
        {routeActive && (
          <div className="absolute bottom-24 md:bottom-lg right-2 md:right-lg z-10 w-[calc(100vw-1rem)] sm:w-80 md:w-96 bg-bg-card border border-border-light p-inner rounded-card shadow-card">
            <h4 className="font-bold text-xs uppercase mb-md text-text-primary">Elevation Profile</h4>
            <div className="w-full h-16 bg-bg-primary flex items-end gap-xs rounded-card overflow-hidden">
              {[20, 30, 40, 50, 45, 60, 70, 80, 85, 90].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 bg-gradient-to-t from-critical/60 to-critical hover:opacity-80 transition-opacity"
                />
              ))}
            </div>
          </div>
        )}

        {/* Mobile Bottom Sheet - Settings & Directions */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-bg-card border-t border-border-light rounded-t-2xl max-h-96 overflow-y-auto"
            >
              <div className="p-inner space-y-lg border-b border-border-light">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm uppercase text-text-primary">Route Settings</h3>
                  <button onClick={() => setShowSettings(false)}>
                    <X size={20} className="text-text-secondary" />
                  </button>
                </div>

                {/* Toggles */}
                <div className="space-y-md">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-text-primary">Avoid Water &gt; 1ft</span>
                    <button
                      onClick={() => setSettings({ ...settings, avoidWater: !settings.avoidWater })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.avoidWater ? 'bg-critical' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.avoidWater ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-text-primary">Wheelchair Safe</span>
                    <button
                      onClick={() => setSettings({ ...settings, wheelchairSafe: !settings.wheelchairSafe })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.wheelchairSafe ? 'bg-safe' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.wheelchairSafe ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-text-primary">Elderly Friendly</span>
                    <button
                      onClick={() => setSettings({ ...settings, elderlyFriendly: !settings.elderlyFriendly })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.elderlyFriendly ? 'bg-critical' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.elderlyFriendly ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Directions */}
              {routeActive && (
                <div className="p-inner border-t border-border-light">
                  <h4 className="font-bold text-xs uppercase mb-md text-text-primary">Directions</h4>
                  <ol className="list-decimal list-inside space-y-md text-xs font-semibold text-text-secondary">
                    <li>Head North on Main St (200m)</li>
                    <li>Turn Right onto High Ground Rd</li>
                    <li className="text-caution">CAUTION: Wet Surface</li>
                    <li>Arrive at Temple Shelter</li>
                  </ol>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}