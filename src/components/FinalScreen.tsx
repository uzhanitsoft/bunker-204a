// Финальный экран — премиум, без эмодзи

import { motion } from 'framer-motion';
import { TrophyIcon, CrownIcon, CopyIcon, RefreshIcon, SkullIcon } from './Icons';
import type { ScoreEntry } from '../types';

interface FinalScreenProps {
  scores: ScoreEntry[];
  onNewGame: () => void;
  isHost: boolean;
}

export default function FinalScreen({ scores, onNewGame, isHost }: FinalScreenProps) {
  const winners = scores.filter(s => s.isWinner);
  const losers = scores.filter(s => !s.isWinner).sort((a, b) => b.score - a.score);

  const getScoreColor = (score: number) => {
    if (score >= 93) return 'text-bunker-yellow';
    if (score >= 90) return 'text-bunker-green';
    return 'text-bunker-text';
  };

  return (
    <div className="h-full overflow-y-auto bg-bunker-bg relative">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/15 via-transparent to-transparent" />

      <div className="relative z-10 p-5 pb-20 max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <TrophyIcon size={40} color="#FFD700" className="mx-auto mb-3" />
          <h1 className="font-display text-4xl text-bunker-yellow tracking-wider mb-1">ФИНАЛ</h1>
          <p className="text-bunker-muted font-mono text-[10px]">БУНКЕР 204-А — Выжившие определены</p>
        </motion.div>

        {/* Winners */}
        <div className="flex justify-center gap-3 mb-6">
          {winners.map((winner, i) => (
            <motion.div key={winner.id}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.3, type: 'spring' }}
              className="flex-1 max-w-[160px] bg-bunker-card border border-bunker-yellow rounded-2xl p-4 text-center winner-glow"
            >
              <CrownIcon size={28} color="#FFD700" className="mx-auto mb-2" />
              <h3 className="font-display text-xl text-bunker-yellow mb-0.5">{winner.name}</h3>
              <p className="text-bunker-muted font-mono text-[9px] mb-2">{winner.profession}</p>
              <div className="font-display text-3xl text-bunker-yellow">{winner.score}</div>
              <p className="text-bunker-green font-mono text-[9px] mt-1">ПОБЕДИТЕЛЬ</p>
            </motion.div>
          ))}
        </div>

        {/* Score table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="bg-bunker-card/40 rounded-xl border border-white/5 overflow-hidden">
          <div className="bg-bunker-card px-4 py-2.5 border-b border-white/5">
            <h3 className="font-display text-lg text-bunker-yellow tracking-wider">ОЦЕНКИ</h3>
          </div>
          <div className="divide-y divide-white/5">
            {[...winners, ...losers].map((entry, i) => (
              <motion.div key={entry.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.08 }}
                className={`px-4 py-2.5 flex items-center gap-2.5 ${entry.isWinner ? 'bg-bunker-yellow/5' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display text-xs ${
                  entry.isWinner ? 'bg-bunker-yellow text-bunker-bg' : 'bg-bunker-bg text-bunker-muted'
                }`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-bunker-text truncate">{entry.name}</p>
                  <p className="text-bunker-muted font-mono text-[9px]">
                    {entry.profession} · {entry.isWinner ? 'Выжил' : `R${entry.eliminatedRound}`}
                  </p>
                </div>
                <span className={`font-display text-xl ${getScoreColor(entry.score)}`}>{entry.score}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {isHost && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
            onClick={() => {
              const text = [...winners, ...losers].map((e, i) => `${i + 1}. ${e.name} — ${e.score}`).join('\n');
              navigator.clipboard.writeText(text);
            }}
            className="w-full mt-3 py-2.5 bg-bunker-card border border-white/10 rounded-xl text-bunker-muted font-mono text-xs flex items-center justify-center gap-2"
          >
            <CopyIcon size={14} /> Скопировать оценки
          </motion.button>
        )}

        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
          onClick={onNewGame}
          className="w-full mt-3 py-3.5 bg-bunker-yellow text-bunker-bg rounded-xl font-display text-xl tracking-wider flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}
        >
          <RefreshIcon size={18} color="#1A1A1A" /> НОВАЯ ИГРА
        </motion.button>
      </div>
    </div>
  );
}
