// Карточка — 3D переворот, SVG иконки

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BriefcaseIcon, DnaIcon, HeartPulseIcon, TargetIcon, ZapIcon, BackpackIcon, CardIcon } from './Icons';
import type { Card as CardType } from '../types';

const CARD_COLORS: Record<string, string> = {
  profession: '#FFFFFF',
  biology: '#4A90D9',
  health: '#E63946',
  hobby: '#2D9B6F',
  fact: '#87CEEB',
  baggage: '#FFD700',
};

const CARD_ICON_MAP: Record<string, typeof BriefcaseIcon> = {
  profession: BriefcaseIcon,
  biology: DnaIcon,
  health: HeartPulseIcon,
  hobby: TargetIcon,
  fact: ZapIcon,
  baggage: BackpackIcon,
};

interface CardProps {
  card: CardType;
  isOwn?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onReveal?: (type: string) => void;
  showRevealButton?: boolean;
  animate?: boolean;
}

export default function Card({ card, isOwn, size = 'md', onReveal, showRevealButton, animate }: CardProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const borderColor = CARD_COLORS[card.type] || '#FFD700';
  const IconComponent = CARD_ICON_MAP[card.type] || CardIcon;

  const sizeClasses = {
    sm: 'w-14 h-20',
    md: 'w-20 h-28',
    lg: 'w-28 h-40',
  };

  const handleReveal = () => {
    if (onReveal && !card.revealed) {
      setIsFlipping(true);
      setTimeout(() => {
        onReveal(card.type);
        setIsFlipping(false);
      }, 500);
    }
  };

  // Card back (hidden, not own)
  if (!card.revealed && !isOwn) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-bunker-card border border-white/10 flex flex-col items-center justify-center flex-shrink-0`}>
        <CardIcon size={16} color="#555" />
        <span className="text-bunker-muted text-[7px] font-mono mt-1">СКРЫТО</span>
      </div>
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-lg relative overflow-hidden cursor-pointer select-none flex-shrink-0`}
      style={{
        border: `1.5px solid ${card.revealed ? borderColor : borderColor + '50'}`,
        background: card.revealed ? '#2A2A2A' : '#222',
      }}
      animate={{ rotateY: isFlipping ? 180 : 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.95 }}
      onClick={showRevealButton ? handleReveal : undefined}
    >
      <div className="relative z-10 h-full flex flex-col p-1.5">
        {/* Icon and label */}
        <div className="flex items-center gap-1">
          <IconComponent size={size === 'sm' ? 10 : 12} color={borderColor} />
          <span className="font-mono uppercase tracking-wider opacity-60" style={{ color: borderColor, fontSize: '7px' }}>
            {card.label}
          </span>
        </div>

        {/* Value */}
        <div className="flex-1 flex items-center justify-center px-0.5">
          <p className="text-bunker-text font-body font-medium text-center leading-tight"
            style={{ fontSize: size === 'sm' ? '7px' : size === 'md' ? '9px' : '11px' }}
          >
            {card.revealed || isOwn ? card.value : '???'}
          </p>
        </div>

        {/* Reveal overlay */}
        {showRevealButton && !card.revealed && (
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg border border-bunker-yellow/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-bunker-yellow font-display text-[10px] tracking-wider">ОТКРЫТЬ</span>
          </motion.div>
        )}

        {/* Revealed dot */}
        {card.revealed && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-bunker-green" />
        )}
      </div>
    </motion.div>
  );
}

export function MiniCard({ type, revealed }: { type: string; revealed: boolean }) {
  const color = CARD_COLORS[type] || '#888';
  const IconComponent = CARD_ICON_MAP[type] || CardIcon;

  return (
    <div
      className={`w-5 h-7 rounded-sm flex items-center justify-center border ${
        revealed ? 'bg-bunker-card' : 'bg-bunker-bg'
      }`}
      style={{ borderColor: revealed ? color : '#444' }}
    >
      {revealed ? <IconComponent size={10} color={color} /> : <span className="text-[7px] text-bunker-muted">?</span>}
    </div>
  );
}
