import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BottomNav } from './BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User as UserIcon } from 'lucide-react';
export function Layout() {
  const { isAuthenticated, isLoading, user, logout } = useAppContext();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
      </div>);

  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/signin"
        state={{
          from: location
        }}
        replace />);


  }
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-teal-200">
            N
          </div>
          <span className="font-serif text-xl text-slate-800 tracking-tight">
            NotesApp
          </span>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-600 rounded-xl font-medium transition-colors">
            
            <UserIcon size={20} />
            My Notes
          </a>
        </nav>

        <div className="p-4">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors">
            
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 relative max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              y: -10
            }}
            transition={{
              duration: 0.2
            }}
            className="h-full">
            
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>);

}