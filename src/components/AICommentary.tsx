// ИИ-ведущий — берёт комментарии из gameState
// Отслеживает aiCommentCount (реальный счётчик) вместо длины массива

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBunkerStore } from '../stores/gameStore';

export default function AICommentary() {
  const gameState = useBunkerStore(s => s.gameState);
  const [displayKey, setDisplayKey] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [fullText, setFullText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const prevCountRef = useRef(0);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const aiComments = gameState?.aiComments || [];
  const aiCommentCount = gameState?.aiCommentCount || 0;

  useEffect(() => {
    // Используем aiCommentCount — реальный счётчик, который ВСЕГДА растёт
    if (aiCommentCount > prevCountRef.current && aiComments.length > 0) {
      const latest = aiComments[aiComments.length - 1];

      if (typingRef.current) {
        clearInterval(typingRef.current);
        typingRef.current = null;
      }

      const text = latest.text;
      setFullText(text);
      setDisplayedText('');
      setDisplayKey(prev => prev + 1);
      setIsTyping(true);

      let i = 0;
      typingRef.current = setInterval(() => {
        i++;
        if (i <= text.length) {
          setDisplayedText(text.slice(0, i));
        } else {
          setIsTyping(false);
          if (typingRef.current) {
            clearInterval(typingRef.current);
            typingRef.current = null;
          }
        }
      }, 25);
    }
    prevCountRef.current = aiCommentCount;
  }, [aiCommentCount, aiComments]);

  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []);

  if (!fullText) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[60] pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayKey}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mx-2 mb-2 bg-black/85 backdrop-blur-md border border-bunker-yellow/20 rounded-2xl px-4 py-3"
            style={{
              boxShadow: '0 -4px 30px rgba(0,0,0,0.5), 0 0 15px rgba(255,215,0,0.08)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-bunker-yellow/15 border border-bunker-yellow/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 2h6"/><path d="M10 2v6.5L4 20a1 1 0 0 0 .87 1.5h14.26A1 1 0 0 0 20 20l-6-11.5V2"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-bunker-yellow/60 font-mono text-[8px] tracking-[0.25em] mb-1">ИИ-ВЕДУЩИЙ</p>
                <p className="text-white text-sm font-body leading-relaxed">
                  {displayedText}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                      className="text-bunker-yellow ml-0.5"
                    >
                      |
                    </motion.span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
