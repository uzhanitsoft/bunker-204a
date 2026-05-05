// Лента ИИ-ведущего — компактная, без эмодзи

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBunkerStore } from '../stores/gameStore';
import { ArrowUpIcon, ArrowDownIcon, FlaskIcon } from './Icons';

export default function AICommentary() {
  const { localAIComments } = useBunkerStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localAIComments]);

  const latestComment = localAIComments[localAIComments.length - 1];

  return (
    <div className="flex-shrink-0 bg-bunker-card/60 backdrop-blur-sm border-t border-b border-white/5">
      {/* Main bar */}
      <div className="flex items-start gap-2.5 px-3 py-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bunker-bg border border-bunker-yellow/30 flex items-center justify-center">
          <FlaskIcon size={14} color="#FFD700" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-bunker-yellow/60 font-mono text-[8px] tracking-[0.2em] mb-0.5">ИИ-ВЕДУЩИЙ</p>
          {latestComment ? (
            <TypewriterText key={latestComment.timestamp} text={latestComment.text} />
          ) : (
            <p className="text-bunker-muted text-xs font-body italic">Ожидание...</p>
          )}
        </div>

        <button className="flex-shrink-0 mt-1 text-bunker-muted">
          {expanded ? <ArrowDownIcon size={12} /> : <ArrowUpIcon size={12} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div ref={scrollRef} className="max-h-32 overflow-y-auto px-3 pb-2 space-y-1.5">
              {localAIComments.slice(0, -1).map((comment, i) => (
                <div key={i} className="flex items-start gap-1.5 opacity-50">
                  <div className="w-1 h-1 rounded-full bg-bunker-yellow mt-1.5 flex-shrink-0" />
                  <p className="text-bunker-text text-[10px] font-body">{comment.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => { setDisplayed(''); setIndex(0); }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, index + 1));
        setIndex(index + 1);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [index, text]);

  return (
    <p className="text-bunker-text text-xs font-body leading-relaxed">
      {displayed}
      {index < text.length && <span className="text-bunker-yellow animate-pulse">|</span>}
    </p>
  );
}
