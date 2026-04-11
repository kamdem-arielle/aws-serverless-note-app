import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting?: boolean;
}
export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting = false
}: DeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          onClick={onClose} />
        
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20
            }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden pointer-events-auto">
            
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-500" size={32} />
                </div>

                <h3 className="text-xl font-serif text-slate-800 mb-2">
                  Delete Note?
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  Are you sure you want to delete "{title}"? This action cannot
                  be undone.
                </p>

                <div className="flex gap-3">
                  <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50">
                  
                    Cancel
                  </button>
                  <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center disabled:opacity-70">
                  
                    {isDeleting ?
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :

                  'Delete'
                  }
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      }
    </AnimatePresence>);

}