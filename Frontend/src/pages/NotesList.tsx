import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { NoteCard } from '../components/NoteCard';
export function NotesList() {
  const { notes, user, loadNotes } = useAppContext();
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        await loadNotes();
      } catch (err: any) {
        console.error('Failed to fetch notes:', err);
        setError(err.message || 'Failed to load notes.');
      } finally {
        setIsLoadingNotes(false);
      }
    };
    load();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);
  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-slate-800 tracking-tight">
            Hello, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 mt-1">
            You have {notes.length} notes in your collection
          </p>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
            
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Search */}
      <div className="md:hidden flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
          
        </div>
        <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500">
          <Filter size={18} />
        </button>
      </div>

      {/* Notes Grid */}
      {isLoadingNotes ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <FileText size={40} className="text-red-300" />
          </div>
          <h3 className="text-xl font-serif text-slate-800 mb-2">
            Failed to load notes
          </h3>
          <p className="text-slate-500 max-w-sm mb-6">{error}</p>
          <button
            onClick={async () => {
              setError('');
              setIsLoadingNotes(true);
              try {
                await loadNotes();
              } catch (err: any) {
                setError(err.message || 'Failed to load notes.');
              } finally {
                setIsLoadingNotes(false);
              }
            }}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-teal-200">
            Try Again
          </button>
        </div>
      ) : filteredNotes.length > 0 ?
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-24 md:pb-0">
          {filteredNotes.map((note, index) =>
        <NoteCard key={note.id} note={note} index={index} />
        )}
        </div> :

      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6">
            <FileText size={40} className="text-teal-300" />
          </div>
          <h3 className="text-xl font-serif text-slate-800 mb-2">
            No notes found
          </h3>
          <p className="text-slate-500 max-w-sm">
            {searchQuery ?
          `We couldn't find any notes matching "${searchQuery}"` :
          "You haven't created any notes yet. Click the + button to start writing."}
          </p>
          {!searchQuery &&
        <button
          onClick={() => navigate('/notes/new')}
          className="mt-6 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-teal-200">
          
              Create First Note
            </button>
        }
        </div>
      }

      {/* Floating Action Button */}
      <motion.button
        whileHover={{
          scale: 1.05
        }}
        whileTap={{
          scale: 0.95
        }}
        onClick={() => navigate('/notes/new')}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-teal-500 text-white rounded-full shadow-lg shadow-teal-500/30 flex items-center justify-center z-30 hover:bg-teal-600 transition-colors">
        
        <Plus size={28} strokeWidth={2.5} />
      </motion.button>
    </div>);

}