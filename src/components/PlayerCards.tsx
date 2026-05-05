// Панель карт игрока — без эмодзи, премиум дизайн

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import { ArrowUpIcon, ArrowDownIcon, MicIcon } from './Icons';
import type { Card as CardType } from '../types';

interface PlayerCardsProps {
  cards: CardType[];
  isMyTurn: boolean;
  onRevealCard: (cardType: string) => void;
}

export default function PlayerCards({ cards, isMyTurn, onRevealCard }: PlayerCardsProps) {
  const [expanded, setExpanded] = useState(false);

  const revealedCards = cards.filter(c => c.revealed);
  const hiddenCards = cards.filter(c => !c.revealed);

  return (
    <div className="flex-shrink-0 bg-bunker-bg/95 backdrop-blur-md border-t border-white/5">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 flex items-center justify-center gap-2 text-bunker-muted"
      >
        {expanded ? <ArrowDownIcon size={14} /> : <ArrowUpIcon size={14} />}
        <span className="font-mono text-[10px] tracking-wider">
          МОИ КАРТЫ ({revealedCards.length}/{cards.length})
        </span>
        {isMyTurn && hiddenCards.length > 0 && (
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-2 h-2 bg-bunker-red rounded-full"
          />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              {/* Your turn banner */}
              {isMyTurn && hiddenCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-2 bg-bunker-yellow/10 border border-bunker-yellow/20 rounded-lg p-2 text-center flex items-center justify-center gap-2"
                >
                  <MicIcon size={16} color="#FFD700" />
                  <span className="text-bunker-yellow font-display text-sm tracking-wider">ТВОЙ ХОД — НАЖМИ НА КАРТУ</span>
                </motion.div>
              )}

              {/* Cards grid */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {cards.map(card => (
                  <Card
                    key={card.type}
                    card={card}
                    isOwn
                    size="md"
                    showRevealButton={isMyTurn && !card.revealed}
                    onReveal={onRevealCard}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
