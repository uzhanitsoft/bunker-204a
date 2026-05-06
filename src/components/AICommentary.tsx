// ИИ-ведущий — всплывающие комментарии тостом, не блокируют игру

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBunkerStore } from '../stores/gameStore';

interface Toast {
  id: number;
  text: string;
}

export default function AICommentary() {
  const { localAIComments } = useBunkerStore();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevCountRef = useRef(0);
  const idRef = useRef(0);

  // Когда приходит новый комментарий — показываем тост
  useEffect(() => {
    if (localAIComments.length > prevCountRef.current) {
      const newComments = localAIComments.slice(prevCountRef.current);
      newComments.forEach(comment => {
        const id = ++idRef.current;
        setToasts(prev => [...prev.slice(-2), { id, text: comment.text }]); // Макс 3 тоста
        
        // Автоудаление через 6 секунд
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);
      });
    }
    prevCountRef.current = localAIComments.length;
  }, [localAIComments]);

  return (
    <div className="fixed top-14 left-2 right-2 z-30 pointer-events-none flex flex-col gap-1.5">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto"
          >
            <div className="bg-bunker-card/90 backdrop-blur-md border border-bunker-yellow/15 rounded-xl px-3 py-2 flex items-start gap-2.5 shadow-lg">
              {/* ИИ аватар */}
              <div className="w-7 h-7 rounded-full bg-bunker-yellow/10 border border-bunker-yellow/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 2h6"/><path d="M10 2v6.5L4 20a1 1 0 0 0 .87 1.5h14.26A1 1 0 0 0 20 20l-6-11.5V2"/>
                </svg>
              </div>
              
              {/* Текст */}
              <div className="flex-1 min-w-0">
                <p className="text-bunker-yellow/50 font-mono text-[7px] tracking-[0.2em] mb-0.5">ИИ-ВЕДУЩИЙ</p>
                <p className="text-bunker-text text-xs font-body leading-relaxed">{toast.text}</p>
              </div>

              {/* Закрыть */}
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-bunker-muted/40 hover:text-bunker-muted flex-shrink-0 mt-0.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
