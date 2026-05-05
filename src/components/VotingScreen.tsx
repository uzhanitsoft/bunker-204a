// Экран голосования — SVG иконки, мобильный

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TimerIcon, VoteIcon, CheckIcon, XIcon, UserIcon } from './Icons';
import type { GameState } from '../types';

interface VotingScreenProps {
  gameState: GameState;
  myId: string;
  onVote: (targetId: string) => void;
}

export default function VotingScreen({ gameState, myId, onVote }: VotingScreenProps) {
  const [timeLeft, setTimeLeft] = useState(90);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const isRevoting = gameState.phase === 'revoting';
  const votablePlayers = isRevoting
    ? activePlayers.filter(p => gameState.votes?.revoteTargets?.includes(p.id))
    : activePlayers;
  const canVote = !hasVoted && !gameState.votes?.hasVoted;

  useEffect(() => {
    if (!gameState.votingEndTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((gameState.votingEndTime! - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.votingEndTime]);

  const handleVote = () => {
    if (selectedId && canVote) {
      onVote(selectedId);
      setHasVoted(true);
    }
  };

  const votedCount = gameState.votes?.totalVoted || 0;
  const totalVoters = gameState.votes?.totalVoters || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <VoteIcon size={24} color="#E63946" />
            <h2 className="font-display text-2xl text-bunker-red tracking-wider">
              {isRevoting ? 'ПЕРЕГОЛОСОВАНИЕ' : 'ГОЛОСОВАНИЕ'}
            </h2>
          </div>
          <p className="text-bunker-muted font-mono text-[10px]">
            Кого выгнать из бункера?
          </p>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <TimerIcon size={18} color={timeLeft <= 10 ? '#E63946' : '#FFD700'} />
          <span className={`font-display text-4xl ${timeLeft <= 10 ? 'text-bunker-red animate-pulse' : 'text-bunker-yellow'}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="text-bunker-muted font-mono text-[10px]">Проголосовали</span>
          <span className="text-bunker-yellow font-display text-lg">{votedCount}/{totalVoters}</span>
        </div>

        {/* Players */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto mb-5">
          {votablePlayers.map(player => {
            const isSelf = player.id === myId;
            const isSelected = selectedId === player.id;
            const voteCount = gameState.isHost ? (gameState.votes?.results?.[player.id] || 0) : undefined;

            return (
              <motion.button
                key={player.id}
                onClick={() => !isSelf && canVote && setSelectedId(player.id)}
                disabled={isSelf || !canVote}
                className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-2 transition-all border ${
                  isSelf ? 'bg-bunker-card/30 border-white/5 opacity-30' :
                  isSelected ? 'bg-bunker-red/15 border-bunker-red' :
                  'bg-bunker-card border-white/5'
                }`}
                whileTap={!isSelf && canVote ? { scale: 0.98 } : {}}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-sm ${
                  isSelected ? 'bg-bunker-red text-white' : 'bg-bunker-bg text-bunker-muted'
                }`}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-body text-sm text-bunker-text">{player.name}{isSelf ? ' (ты)' : ''}</p>
                  {player.revealedCards.find(c => c.type === 'profession') && (
                    <p className="text-bunker-muted text-[10px] font-mono">{player.revealedCards.find(c => c.type === 'profession')?.value}</p>
                  )}
                </div>
                {voteCount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-1.5 bg-bunker-bg rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" animate={{
                        width: `${totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0}%`,
                        backgroundColor: voteCount > 2 ? '#E63946' : '#2D9B6F',
                      }} />
                    </div>
                    <span className="text-bunker-yellow font-mono text-xs w-3">{voteCount}</span>
                  </div>
                )}
                {isSelected && <XIcon size={16} color="#E63946" />}
              </motion.button>
            );
          })}
        </div>

        {/* Vote button */}
        {canVote ? (
          <motion.button
            onClick={handleVote}
            disabled={!selectedId}
            className={`w-full py-3.5 rounded-xl font-display text-xl tracking-wider transition-all flex items-center justify-center gap-2 ${
              selectedId ? 'bg-bunker-red text-white' : 'bg-bunker-card text-bunker-muted cursor-not-allowed'
            }`}
            whileTap={selectedId ? { scale: 0.97 } : {}}
          >
            {selectedId ? <><VoteIcon size={18} /> ПРОГОЛОСОВАТЬ</> : 'Выберите участника'}
          </motion.button>
        ) : (
          <div className="text-center py-3">
            <div className="flex items-center justify-center gap-2 text-bunker-green">
              <CheckIcon size={20} />
              <p className="font-display text-lg">ВЫ ПРОГОЛОСОВАЛИ</p>
            </div>
            <p className="text-bunker-muted font-mono text-[10px] mt-1">Ожидаем остальных...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
