import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { DeleteModal } from '../components/DeleteModal';
export function NoteDetail() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { notes, deleteNote } = useAppContext();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const note = notes.find((n) => n.id === id);
  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-serif text-slate-800 mb-2">
          Note not found
        </h2>
        <p className="text-slate-500 mb-6">
          The note you're looking for doesn't exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/notes')}
          className="px-6 py-3 bg-teal-500 text-white font-medium rounded-xl">
          
          Back to Notes
        </button>
      </div>);

  }
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNote(note.id);
      navigate('/notes');
    } catch (error) {
      console.error('Failed to delete note', error);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };
  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/notes')}
          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors">
          
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/notes/${note.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
            
            <Edit3 size={18} />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors">
            
            <Trash2 size={18} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Note Content */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className={`flex-1 bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100 ${note.color?.replace('bg-', 'border-t-4 border-t-') || 'border-t-4 border-t-teal-400'}`}>
        
        <h1 className="text-3xl md:text-4xl font-serif text-slate-800 mb-6 leading-tight">
          {note.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-10 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar size={16} className="text-slate-400" />
            <span>
              Created: {format(new Date(note.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock size={16} className="text-slate-400" />
            <span>
              Updated:{' '}
              {format(new Date(note.updatedAt), 'MMM d, yyyy • h:mm a')}
            </span>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
        </div>
      </motion.div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={note.title}
        isDeleting={isDeleting} />
      
    </div>);

}