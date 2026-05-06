// Панель ведущего — ВСЕГДА ВИДНА, фиксирована снизу

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicIcon, VoteIcon, CheckIcon, SkullIcon, PlayIcon, PauseIcon, ArrowDownIcon, UserIcon } from './Icons';
import type { GameState } from '../types';

interface HostPanelProps {
  gameState: GameState;
  onRequestReveal: (playerId: string) => void;
  onConfirmTurn: () => void;
  onStartVoting: () => void;
  onConfirmElimination: (playerIds: string[]) => void;
  onStartNextRound: () => void;
  onTogglePause: () => void;
  onStartRevote: (playerIds: string[]) => void;
  onHostEliminate: (playerId: string) => void;
  onGetVotingResults: () => Promise<any>;
}

export default function HostPanel({
  gameState, onRequestReveal, onConfirmTurn, onStartVoting,
  onConfirmElimination, onStartNextRound, onTogglePause,
  onStartRevote, onHostEliminate, onGetVotingResults,
}: HostPanelProps) {
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [votingResults, setVotingResults] = useState<any>(null);

  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const allRevealed = activePlayers.every(p => gameState.roundChecklist[p.id]);
  const hasActivePlayer = gameState.activePlayerId !== null;

  const handleGetResults = async () => {
    const results = await onGetVotingResults();
    setVotingResults(results);
    setShowResults(true);
  };

  return (
    <>
      {/* Pause button — fixed top-right */}
      <button
        onClick={onTogglePause}
        className={`fixed top-3 right-3 z-50 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
          gameState.isPaused
            ? 'bg-bunker-green text-white'
            : 'bg-bunker-card border border-white/10 text-bunker-muted hover:text-white'
        }`}
      >
        {gameState.isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
      </button>

      {/* ═══ ПАНЕЛЬ — всегда видна снизу ═══ */}
      <div className="flex-shrink-0 bg-bunker-card/90 backdrop-blur-md border-t border-bunker-yellow/20 px-3 py-2 z-30 safe-bottom">
        {/* Статус чеклист */}
        <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1">
          {activePlayers.map(player => (
            <div
              key={player.id}
              className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 transition-all ${
                gameState.roundChecklist[player.id]
                  ? 'bg-bunker-green/15 text-bunker-green border border-bunker-green/20'
                  : player.id === gameState.activePlayerId
                  ? 'bg-bunker-yellow/15 text-bunker-yellow border border-bunker-yellow/20'
                  : 'bg-bunker-bg/50 text-bunker-muted border border-white/5'
              }`}
            >
              {gameState.roundChecklist[player.id]
                ? <CheckIcon size={10} />
                : player.id === gameState.activePlayerId
                ? <MicIcon size={10} />
                : <UserIcon size={10} />
              }
              {player.name.slice(0, 6)}
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="flex gap-2">
          {/* PLAYING phase */}
          {gameState.phase === 'playing' && !allRevealed && !hasActivePlayer && (
            <motion.button
              onClick={() => setShowPlayerList(true)}
              className="flex-1 py-3 bg-bunker-yellow text-bunker-bg rounded-xl font-display text-lg tracking-wider flex items-center justify-center gap-2"
              whileTap={{ scale: 0.97 }}
            >
              <MicIcon size={18} color="#1A1A1A" />
              ВЫЗВАТЬ ИГРОКА
            </motion.button>
          )}

          {gameState.phase === 'playing' && hasActivePlayer && (
            <motion.button
              onClick={onConfirmTurn}
              className="flex-1 py-3 bg-bunker-green text-white rounded-xl font-display text-lg tracking-wider flex items-center justify-center gap-2"
              whileTap={{ scale: 0.97 }}
            >
              <CheckIcon size={18} />
              СЛЕДУЮЩИЙ
            </motion.button>
          )}

          {gameState.phase === 'playing' && allRevealed && (
            <motion.button
              onClick={onStartVoting}
              className="flex-1 py-3 bg-bunker-red text-white rounded-xl font-display text-lg tracking-wider flex items-center justify-center gap-2 animate-pulse"
              whileTap={{ scale: 0.97 }}
            >
              <VoteIcon size={18} />
              ГОЛОСОВАНИЕ
            </motion.button>
          )}

          {/* VOTING phase */}
          {(gameState.phase === 'voting' || gameState.phase === 'revoting') && (
            <motion.button
              onClick={handleGetResults}
              className="flex-1 py-3 bg-bunker-yellow text-bunker-bg rounded-xl font-display text-lg tracking-wider flex items-center justify-center gap-2"
              whileTap={{ scale: 0.97 }}
            >
              <VoteIcon size={18} color="#1A1A1A" />
              РЕЗУЛЬТАТЫ
            </motion.button>
          )}

          {/* ELIMINATION phase */}
          {gameState.phase === 'elimination' && (
            <motion.button
              onClick={onStartNextRound}
              className="flex-1 py-3 bg-bunker-yellow text-bunker-bg rounded-xl font-display text-lg tracking-wider flex items-center justify-center gap-2"
              whileTap={{ scale: 0.97 }}
            >
              <PlayIcon size={18} color="#1A1A1A" />
              СЛЕДУЮЩИЙ РАУНД
            </motion.button>
          )}
        </div>
      </div>

      {/* ═══ МОДАЛКА: Выбор игрока ═══ */}
      <AnimatePresence>
        {showPlayerList && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 pb-24"
            onClick={() => setShowPlayerList(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bunker-bg border-2 border-bunker-yellow/30 rounded-2xl p-4 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-display text-xl text-bunker-yellow mb-3 text-center tracking-wider">ВЫБЕРИТЕ ИГРОКА</h3>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {activePlayers.filter(p => !gameState.roundChecklist[p.id]).map(player => (
                  <motion.button
                    key={player.id}
                    onClick={() => {
                      onRequestReveal(player.id);
                      setShowPlayerList(false);
                    }}
                    className="w-full py-3 px-4 bg-bunker-card rounded-xl text-bunker-text font-body text-left hover:bg-bunker-yellow/10 border border-white/5 transition-all flex items-center gap-3"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-bunker-bg flex items-center justify-center text-sm font-display text-bunker-muted">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{player.name}</span>
                  </motion.button>
                ))}
              </div>
              <button onClick={() => setShowPlayerList(false)} className="w-full mt-3 py-2 text-bunker-muted font-mono text-sm">
                Отмена
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ МОДАЛКА: Результаты голосования ═══ */}
      <AnimatePresence>
        {showResults && votingResults && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-bunker-bg border-2 border-bunker-red/30 rounded-2xl p-5 w-full max-w-sm"
            >
              <h3 className="font-display text-xl text-bunker-red mb-4 text-center tracking-wider">РЕЗУЛЬТАТЫ</h3>

              <div className="space-y-2 mb-5">
                {votingResults.results?.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <span className="text-bunker-text font-body text-sm flex-1 truncate">{r.name}</span>
                    <div className="w-20 h-2.5 bg-bunker-card rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(r.votesReceived / Math.max(activePlayers.length, 1)) * 100}%` }}
                        style={{ backgroundColor: r.votesReceived > 2 ? '#E63946' : '#2D9B6F' }}
                      />
                    </div>
                    <span className="text-bunker-yellow font-mono text-sm w-5 text-right">{r.votesReceived}</span>
                  </div>
                ))}
              </div>

              {votingResults.tie ? (
                <div className="space-y-2">
                  <p className="text-bunker-yellow font-mono text-xs text-center">Ничья — нужно переголосование</p>
                  <button
                    onClick={() => {
                      onStartRevote(votingResults.tiedPlayers.map((p: any) => p.id));
                      setShowResults(false); setVotingResults(null);
                    }}
                    className="w-full py-3 bg-bunker-yellow text-bunker-bg rounded-xl font-display text-lg flex items-center justify-center gap-2"
                  >
                    <ArrowDownIcon size={16} color="#1A1A1A" />
                    ПЕРЕГОЛОСОВАНИЕ
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-bunker-muted font-mono text-xs text-center">
                    Выбывают: {votingResults.eliminated?.map((e: any) => e.name).join(', ')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onConfirmElimination(votingResults.eliminated.map((e: any) => e.id));
                        setShowResults(false); setVotingResults(null);
                      }}
                      className="flex-1 py-3 bg-bunker-red text-white rounded-xl font-display text-lg flex items-center justify-center gap-2"
                    >
                      <SkullIcon size={16} />
                      ВЫГНАТЬ
                    </button>
                    <button
                      onClick={() => { setShowResults(false); setVotingResults(null); }}
                      className="px-4 py-3 bg-bunker-card text-bunker-muted rounded-xl font-mono text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
