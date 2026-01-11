import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, AlertTriangle, Navigation as NavIcon, History, FlaskConical, Sprout, RefreshCw, BookOpen, User, Menu, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navItems = [{
    path: '/',
    label: 'Dashboard',
    icon: Home
  }, {
    path: '/map',
    label: 'Risk Map',
    icon: Map
  }, {
    path: '/report',
    label: 'Report',
    icon: AlertTriangle
  }, {
    path: '/evacuate',
    label: 'Evacuate',
    icon: NavIcon
  }, {
    path: '/history',
    label: 'History',
    icon: History
  }, {
    path: '/what-if',
    label: 'What-If',
    icon: FlaskConical
  }, {
    path: '/agriculture',
    label: 'Agri',
    icon: Sprout
  }, {
    path: '/recovery',
    label: 'Recovery',
    icon: RefreshCw
  }, {
    path: '/learn',
    label: 'Learn',
    icon: BookOpen
  }, {
    path: '/profile',
    label: 'Profile',
    icon: User
  }, {
    path: '/admin',
    label: 'Admin',
    icon: ShieldAlert
  }];
  const isActive = (path: string) => location.pathname === path;
  return <>
      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-black md:hidden flex justify-around items-center h-16 px-2">
        {navItems.slice(0, 5).map(item => <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center w-full h-full ${isActive(item.path) ? 'text-[#FF0000]' : 'text-black'}`}>
            <item.icon size={24} strokeWidth={isActive(item.path) ? 3 : 2} />
            <span className="text-[10px] font-bold uppercase mt-1">
              {item.label}
            </span>
          </Link>)}
        <button onClick={() => setIsOpen(true)} className="flex flex-col items-center justify-center w-full h-full text-black">
          <Menu size={24} />
          <span className="text-[10px] font-bold uppercase mt-1">More</span>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r-4 border-black z-40 pt-20 overflow-y-auto">
        <div className="px-6 mb-8">
          <h1 className="text-3xl font-black uppercase leading-none">
            Flood
            <br />
            Resilience
            <br />
            System
          </h1>
          <div className="mt-2 inline-block bg-black text-white px-2 py-1 text-xs font-bold uppercase">
            Sri Lanka
          </div>
        </div>

        <nav className="flex-1 flex flex-col">
          {navItems.map(item => <Link key={item.path} to={item.path} className={`
                flex items-center gap-4 px-6 py-4 border-b-2 border-gray-100 hover:bg-gray-50 transition-colors
                ${isActive(item.path) ? 'bg-black text-white hover:bg-black' : 'text-black'}
              `}>
              <item.icon size={24} strokeWidth={3} />
              <span className="font-bold uppercase tracking-wide">
                {item.label}
              </span>
            </Link>)}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 bg-black/80 md:hidden flex justify-end" onClick={() => setIsOpen(false)}>
            <motion.div initial={{
          x: '100%'
        }} animate={{
          x: 0
        }} exit={{
          x: '100%'
        }} className="w-4/5 bg-white h-full border-l-4 border-black overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b-4 border-black flex justify-between items-center bg-[#FFCC00]">
                <h2 className="text-xl font-black uppercase">Menu</h2>
                <button onClick={() => setIsOpen(false)}>
                  <X size={32} strokeWidth={3} />
                </button>
              </div>
              <nav className="flex flex-col">
                {navItems.map(item => <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`
                      flex items-center gap-4 px-6 py-5 border-b-2 border-black
                      ${isActive(item.path) ? 'bg-black text-white' : 'text-black hover:bg-gray-100'}
                    `}>
                    <item.icon size={24} strokeWidth={3} />
                    <span className="font-bold uppercase text-lg">
                      {item.label}
                    </span>
                  </Link>)}
              </nav>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
    </>;
}