import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, AlertTriangle, Navigation as NavIcon, History, FlaskConical, Sprout, RefreshCw, BookOpen, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemLogo } from './SystemLogo';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/map', label: 'Risk Map', icon: Map },
    { path: '/report', label: 'Report', icon: AlertTriangle },
    { path: '/evacuate', label: 'Evacuate', icon: NavIcon },
    { path: '/history', label: 'History', icon: History },
    { path: '/what-if', label: 'What-If', icon: FlaskConical },
    { path: '/agriculture', label: 'Agriculture', icon: Sprout },
    { path: '/recovery', label: 'Recovery', icon: RefreshCw },
    { path: '/learn', label: 'Learn', icon: BookOpen },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Bottom Navigation - Dark Navy */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-bg-sidebar border-t border-gray-700 md:hidden flex justify-around items-center h-20 safe-area-bottom">
        {navItems.slice(0, 5).map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full gap-xs transition-colors relative ${
              isActive(item.path)
                ? 'text-blue-600'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {isActive(item.path) && (
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
            )}
            <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-xs font-semibold uppercase">
              {item.label}
            </span>
          </Link>
        ))}
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full gap-xs text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
          <span className="text-xs font-semibold uppercase">More</span>
        </button>
      </div>

      {/* Desktop Icon Sidebar - Dark Navy 80px Fixed */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-20 bg-bg-sidebar z-40 items-center pt-lg gap-sm px-0 py-lg overflow-y-auto border-r border-gray-800">
        {/* Logo */}
        <div className="mb-4 pb-3 border-b border-gray-700 w-full flex justify-center">
          <Link to="/" aria-label="Flood Resilience System home">
            <SystemLogo size="sm" variant="light" showText={false} />
          </Link>
        </div>
        {navItems.map(item => (
          <div key={item.path} className="relative group w-full">
            <Link
              to={item.path}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`flex items-center justify-center h-16 w-20 transition-colors relative ${
                isActive(item.path)
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isActive(item.path) && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
              )}
              <item.icon size={28} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            </Link>
            {/* Tooltip */}
            {hoveredItem === item.path && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="absolute left-full ml-md bg-bg-dark text-white text-xs font-semibold px-md py-sm rounded-card whitespace-nowrap pointer-events-none z-50"
              >
                {item.label}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile More Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="ml-auto w-64 bg-bg-sidebar h-full border-l border-gray-700 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-lg border-b border-gray-700 flex justify-between items-center sticky top-0 bg-bg-sidebar">
                <SystemLogo size="sm" variant="light" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-sm text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-md px-lg py-md border-b border-gray-700 transition-colors relative ${
                      isActive(item.path)
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {isActive(item.path) && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                    )}
                    <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                    <span className="font-semibold">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}