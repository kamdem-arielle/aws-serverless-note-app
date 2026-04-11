import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Note } from '../utils/types';
import { formatDistanceToNow } from 'date-fns';
interface NoteCardProps {
  note: Note;
  index: number;
}
export function NoteCard({ note, index }: NoteCardProps) {
  // Format date to show relative time (e.g., "2 days ago")
  const timeAgo = formatDistanceToNow(new Date(note.updatedAt), {
    addSuffix: true
  });
  // Default colors if none provided
  const bgColors = [
  'bg-blue-50',
  'bg-green-50',
  'bg-yellow-50',
  'bg-purple-50',
  'bg-pink-50',
  'bg-orange-50'];

  const bgColor = note.color || bgColors[index % bgColors.length];
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.4,
        delay: index * 0.05
      }}
      whileHover={{
        y: -4,
        scale: 1.02
      }}
      className="h-full">
      
      <Link
        to={`/notes/${note.id}`}
        className={`block h-full p-5 rounded-3xl ${bgColor} border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}>
        
        <h3 className="font-serif text-lg text-slate-800 mb-2 line-clamp-2 leading-tight">
          {note.title}
        </h3>

        <p className="text-slate-600 text-sm line-clamp-4 mb-4 flex-1 whitespace-pre-line leading-relaxed">
          {note.content}
        </p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/5">
          <span className="text-xs font-medium text-slate-500">{timeAgo}</span>
          <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
          </div>
        </div>
      </Link>
    </motion.div>);

}