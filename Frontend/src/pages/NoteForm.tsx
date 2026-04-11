import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
const COLORS = [
{
  id: 'bg-blue-50',
  name: 'Blue'
},
{
  id: 'bg-green-50',
  name: 'Green'
},
{
  id: 'bg-yellow-50',
  name: 'Yellow'
},
{
  id: 'bg-purple-50',
  name: 'Purple'
},
{
  id: 'bg-pink-50',
  name: 'Pink'
},
{
  id: 'bg-orange-50',
  name: 'Orange'
},
{
  id: 'bg-white',
  name: 'White'
}];

export function NoteForm() {
  const { id } = useParams<{
    id: string;
  }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { notes, addNote, updateNote } = useAppContext();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(COLORS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isEditing) {
      const noteToEdit = notes.find((n) => n.id === id);
      if (noteToEdit) {
        setTitle(noteToEdit.title);
        setContent(noteToEdit.content);
        if (noteToEdit.color) setColor(noteToEdit.color);
      } else {
        navigate('/notes');
      }
    }
  }, [id, isEditing, notes, navigate]);
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      if (isEditing && id) {
        await updateNote(id, {
          title,
          content,
          color
        });
        navigate(`/notes/${id}`);
      } else {
        await addNote({
          title,
          content,
          color
        });
        navigate('/notes');
      }
    } catch (error) {
      console.error('Failed to save note', error);
      setIsSubmitting(false);
    }
  };
  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors">
          
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
            
            <X size={18} />
            <span className="hidden sm:inline">Cancel</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 shadow-sm shadow-teal-200">
            
            {isSubmitting ?
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :

            <>
                <Save size={18} />
                <span className="hidden sm:inline">Save Note</span>
              </>
            }
          </button>
        </div>
      </div>

      {/* Form Area */}
      <motion.div
        initial={{
          opacity: 0,
          y: 10
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className={`flex-1 flex flex-col bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 transition-colors duration-300 ${color}`}>
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          className="w-full text-3xl md:text-4xl font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-slate-300 mb-6" />
        

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your note here..."
          className="flex-1 w-full text-lg text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-slate-400 resize-none leading-relaxed" />
        

        {/* Color Picker */}
        <div className="mt-6 pt-6 border-t border-black/5 flex items-center gap-3 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-slate-500 mr-2">
            Color:
          </span>
          {COLORS.map((c) =>
          <button
            key={c.id}
            onClick={() => setColor(c.id)}
            className={`w-8 h-8 rounded-full border-2 transition-transform ${c.id} ${color === c.id ? 'border-teal-500 scale-110' : 'border-transparent hover:scale-110'} ${c.id === 'bg-white' ? 'border-slate-200' : ''}`}
            title={c.name} />

          )}
        </div>
      </motion.div>
    </div>);

}