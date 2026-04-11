import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';
export function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 md:hidden z-40 pb-safe">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <NavLink
          to="/notes"
          end
          className={({ isActive }) =>
          `flex flex-col items-center p-2 rounded-xl transition-colors ${isActive ? 'text-teal-500' : 'text-slate-400 hover:text-slate-600'}`
          }>
          
          {({ isActive }) =>
          <>
              <div className="relative">
                <Home size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isActive &&
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-2 left-1/2 w-1 h-1 bg-teal-500 rounded-full transform -translate-x-1/2" />

              }
              </div>
              <span className="text-[10px] mt-1 font-medium">Home</span>
            </>
          }
        </NavLink>

        <button className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
          <Search size={24} strokeWidth={2} />
          <span className="text-[10px] mt-1 font-medium">Search</span>
        </button>

        <button className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
          <User size={24} strokeWidth={2} />
          <span className="text-[10px] mt-1 font-medium">Profile</span>
        </button>
      </div>
    </div>);

}