// Главный экран — мобильный список + объявления + большая карточка

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AICommentary from './AICommentary';
import HostPanel from './HostPanel';
import VotingScreen from './VotingScreen';
import PauseOverlay from './PauseOverlay';
import CardDeck from './CardDeck';
import { MicIcon, CheckIcon, SkullIcon, BriefcaseIcon, DnaIcon, HeartPulseIcon, TargetIcon, ZapIcon, BackpackIcon } from './Icons';
import type { GameState, Card } from '../types';
import { sounds } from '../utils/sounds';

const CARD_COLORS: Record<string, string> = {
  profession: '#FFFFFF',
  biology: '#4A90D9',
  health: '#E63946',
  hobby: '#2D9B6F',
  fact: '#87CEEB',
  baggage: '#FFD700',
};

const CARD_LABELS: Record<string, string> = {
  profession: 'ПРОФЕССИЯ',
  biology: 'БИОЛОГИЯ',
  health: 'ЗДОРОВЬЕ',
  hobby: 'ХОББИ',
  fact: 'ФАКТ',
  baggage: 'БАГАЖ',
};

const CARD_ICONS: Record<string, typeof BriefcaseIcon> = {
  profession: BriefcaseIcon,
  biology: DnaIcon,
  health: HeartPulseIcon,
  hobby: TargetIcon,
  fact: ZapIcon,
  baggage: BackpackIcon,
};

interface GameTableProps {
  gameState: GameState;
  myId: string;
  onRequestReveal: (playerId: string) => void;
  onRevealCard: (cardType: string) => void;
  onConfirmTurn: () => void;
  onStartVoting: () => void;
  onVote: (targetId: string) => void;
  onConfirmElimination: (playerIds: string[]) => void;
  onStartNextRound: () => void;
  onTogglePause: () => void;
  onStartRevote: (playerIds: string[]) => void;
  onHostEliminate: (playerId: string) => void;
  onGetVotingResults: () => Promise<any>;
}

export default function GameTable({
  gameState, myId,
  onRequestReveal, onRevealCard, onConfirmTurn,
  onStartVoting, onVote, onConfirmElimination,
  onStartNextRound, onTogglePause, onStartRevote,
  onHostEliminate, onGetVotingResults,
}: GameTableProps) {
  const myPlayer = gameState.players.find(p => p.id === myId);
  const isMyTurn = gameState.activePlayerId === myId;
  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const eliminatedPlayers = gameState.players.filter(p => p.isEliminated);
  const activePlayer = gameState.players.find(p => p.id === gameState.activePlayerId);

  // Большая карточка — видна всем
  const [revealedCard, setRevealedCard] = useState<{playerName: string; card: Card} | null>(null);
  // Объявление "Ведущий вызывает..."
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const prevActiveRef = useRef<string | null>(null);
  // Модалка "Мои карты"
  const [showMyCards, setShowMyCards] = useState(false);

  // Слушаем card_revealed для большой карточки
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setAnnouncement(null);
      setRevealedCard(e.detail);
      if (gameState.isHost) sounds.cardRevealed();
    };
    window.addEventListener('card_revealed_display', handler as EventListener);
    return () => window.removeEventListener('card_revealed_display', handler as EventListener);
  }, [gameState.isHost]);

  // Показываем объявление когда ведущий вызывает игрока
  useEffect(() => {
    if (gameState.activePlayerId && gameState.activePlayerId !== prevActiveRef.current) {
      const player = gameState.players.find(p => p.id === gameState.activePlayerId);
      if (player) {
        setRevealedCard(null);
        if (gameState.isHost) sounds.playerCalled();

        if (gameState.activePlayerId === myId) {
          // Не показываем объявление для себя — сразу колода
        } else {
          setAnnouncement(player.name);
        }
      }
    }
    if (!gameState.activePlayerId && prevActiveRef.current) {
      setAnnouncement(null);
      setRevealedCard(null);
    }
    prevActiveRef.current = gameState.activePlayerId;
  }, [gameState.activePlayerId, gameState.players, myId, gameState.isHost]);

  // Звук при смене фазы — ТОЛЬКО для ведущего
  useEffect(() => {
    if (!gameState.isHost) return;
    if (gameState.phase === 'voting' || gameState.phase === 'revoting') {
      sounds.votingStart();
    }
    if (gameState.phase === 'elimination') {
      sounds.elimination();
    }
    if (gameState.phase === 'finished') {
      sounds.victory();
    }
    if (gameState.phase === 'catastrophe') {
      sounds.catastropheAlarm();
    }
  }, [gameState.phase, gameState.isHost]);

  // Мои скрытые карты
  const myHiddenCards = myPlayer?.cards?.filter(c => !c.revealed) || [];

  return (
    <div className="h-full flex flex-col bg-bunker-bg relative">
      {/* ═══ ВЕРХНЯЯ ПОЛОСА ═══ */}
      <div className="flex-shrink-0 bg-bunker-card/70 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-bunker-yellow/10 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bunker-yellow/10 border border-bunker-yellow/30 flex items-center justify-center">
            <span className="text-bunker-yellow font-display text-lg">{gameState.round}</span>
          </div>
          <div>
            <p className="text-bunker-yellow font-display text-sm tracking-wider">РАУНД {gameState.round}</p>
            <p className="text-bunker-muted font-mono text-[9px]">{activePlayers.length} игроков</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-bunker-muted font-mono text-[10px]">Комната</p>
            <p className="text-bunker-yellow font-display text-lg tracking-wider">{gameState.code}</p>
          </div>
        </div>
      </div>

      {/* ═══ СПИСОК ИГРОКОВ ═══ */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {activePlayers.map((player) => {
            const isActive = gameState.activePlayerId === player.id;
            const isMe = player.id === myId;
            const hasRevealed = gameState.roundChecklist[player.id];

            return (
              <motion.div
                key={player.id}
                layout
                className={`rounded-xl p-4 border transition-all ${
                  isActive
                    ? 'border-bunker-yellow bg-bunker-yellow/5 shadow-[0_0_20px_rgba(255,215,0,0.15)]'
                    : hasRevealed
                    ? 'border-bunker-green/30 bg-bunker-green/5'
                    : isMe
                    ? 'border-bunker-yellow/20 bg-bunker-card/80'
                    : 'border-white/5 bg-bunker-card/40'
                }`}
              >
                {/* Player header */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg flex-shrink-0 ${
                    isActive ? 'bg-bunker-yellow text-bunker-bg' :
                    isMe ? 'bg-bunker-yellow/20 text-bunker-yellow border border-bunker-yellow/50' :
                    'bg-bunker-bg text-bunker-muted border border-white/10'
                  }`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-body text-base truncate ${isMe ? 'text-bunker-yellow font-semibold' : 'text-bunker-text'}`}>
                        {player.name}
                      </span>
                      {isMe && <span className="text-bunker-yellow/50 text-[10px] font-mono flex-shrink-0">(вы)</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isActive && (
                        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                          className="text-bunker-yellow text-[10px] font-mono flex items-center gap-1">
                          <MicIcon size={10} color="#FFD700" /> Говорит
                        </motion.span>
                      )}
                      {hasRevealed && !isActive && (
                        <span className="text-bunker-green text-[10px] font-mono flex items-center gap-1">
                          <CheckIcon size={10} /> Готов
                        </span>
                      )}
                      {!hasRevealed && !isActive && (
                        <span className="text-bunker-muted text-[10px] font-mono">Ожидает</span>
                      )}
                    </div>
                  </div>

                  <span className="text-bunker-muted font-mono text-[10px] flex-shrink-0">
                    {player.revealedCards.length}/6
                  </span>
                </div>

                {/* Revealed cards — compact list */}
                {player.revealedCards.length > 0 && (
                  <div className="mt-2 ml-[52px] space-y-1">
                    {player.revealedCards.map(card => {
                      const Icon = CARD_ICONS[card.type] || BriefcaseIcon;
                      return (
                        <div key={card.type} className="flex items-center gap-2.5 bg-bunker-bg/40 rounded-lg px-3 py-2">
                          <Icon size={16} color={CARD_COLORS[card.type]} />
                          <span className="text-[10px] font-mono uppercase flex-shrink-0 w-16" style={{ color: CARD_COLORS[card.type] + 'AA' }}>
                            {CARD_LABELS[card.type]}
                          </span>
                          <span className="text-base font-body text-bunker-text truncate">{card.value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Eliminated */}
          {eliminatedPlayers.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-bunker-muted font-mono text-[9px] mb-1.5 tracking-wider px-1">ВЫБЫЛИ</p>
              {eliminatedPlayers.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 opacity-40">
                  <SkullIcon size={14} color="#666" />
                  <span className="text-sm text-bunker-muted line-through">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AICommentary рендерится в конце — поверх всего */}

      {/* ═══ КОЛОДА КАРТ — мой ход ═══ */}
      <AnimatePresence>
        {isMyTurn && myHiddenCards.length > 0 && (
          <CardDeck cards={myHiddenCards} onRevealCard={onRevealCard} />
        )}
      </AnimatePresence>

      {/* ═══ ПАНЕЛЬ ВЕДУЩЕГО ═══ */}
      {gameState.isHost && (
        <HostPanel
          gameState={gameState}
          onRequestReveal={onRequestReveal}
          onConfirmTurn={() => { setRevealedCard(null); setAnnouncement(null); sounds.confirmTurn(); onConfirmTurn(); }}
          onStartVoting={onStartVoting}
          onConfirmElimination={onConfirmElimination}
          onStartNextRound={onStartNextRound}
          onTogglePause={onTogglePause}
          onStartRevote={onStartRevote}
          onHostEliminate={onHostEliminate}
          onGetVotingResults={onGetVotingResults}
        />
      )}

      {/* ═══════════════════════════════════════════════
          ОБЪЯВЛЕНИЕ: "Ведущий вызывает [ИМЯ]!"
          Видно ВСЕМ игрокам
      ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {announcement && !revealedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full max-w-xs text-center"
            >
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-bunker-yellow text-bunker-bg font-display text-4xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(255,215,0,0.3)]"
              >
                {announcement.charAt(0).toUpperCase()}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-bunker-muted font-mono text-xs tracking-wider mb-2"
              >
                ВЕДУЩИЙ ВЫЗЫВАЕТ
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-display text-3xl text-bunker-yellow tracking-wider mb-4"
              >
                {announcement}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ delay: 0.6, duration: 1.5, repeat: Infinity }}
                className="text-bunker-muted font-mono text-xs"
              >
                Покажите одну из карт...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════
          БОЛЬШАЯ КАРТОЧКА — видна ВСЕМ при открытии
      ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {revealedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.3, rotateY: -90 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
              className="w-full max-w-xs"
            >
              {/* Кто открыл */}
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-bunker-yellow text-bunker-bg font-display text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  {revealedCard.playerName.charAt(0).toUpperCase()}
                </div>
                <p className="text-bunker-text font-display text-xl">{revealedCard.playerName}</p>
                <p className="text-bunker-muted font-mono text-[10px] tracking-wider mt-0.5">ОТКРЫВАЕТ КАРТУ</p>
              </div>

              {/* Карточка */}
              <motion.div
                initial={{ rotateY: -180 }}
                animate={{ rotateY: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                className="rounded-2xl p-8 text-center relative overflow-hidden"
                style={{
                  border: `2px solid ${CARD_COLORS[revealedCard.card.type]}`,
                  background: `linear-gradient(180deg, ${CARD_COLORS[revealedCard.card.type]}05 0%, ${CARD_COLORS[revealedCard.card.type]}12 100%)`,
                  boxShadow: `0 0 40px ${CARD_COLORS[revealedCard.card.type]}20`,
                }}
              >
                {/* Тип */}
                <div className="flex items-center justify-center gap-2.5 mb-5">
                  {(() => {
                    const Icon = CARD_ICONS[revealedCard.card.type] || BriefcaseIcon;
                    return <Icon size={28} color={CARD_COLORS[revealedCard.card.type]} />;
                  })()}
                  <span className="font-display text-xl tracking-[0.3em]" style={{ color: CARD_COLORS[revealedCard.card.type] }}>
                    {CARD_LABELS[revealedCard.card.type]}
                  </span>
                </div>

                {/* Разделитель */}
                <div className="w-20 h-px mx-auto mb-5" style={{ backgroundColor: CARD_COLORS[revealedCard.card.type] + '50' }} />

                {/* Значение — крупно */}
                <p className="text-bunker-text font-body text-2xl leading-snug font-medium">
                  {revealedCard.card.value}
                </p>
              </motion.div>

              {/* Кнопка СЛЕДУЮЩИЙ для ведущего */}
              {gameState.isHost && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  onClick={() => {
                    setRevealedCard(null);
                    setAnnouncement(null);
                    sounds.confirmTurn();
                    onConfirmTurn();
                  }}
                  className="w-full mt-5 py-4 bg-bunker-yellow text-bunker-bg rounded-xl font-display text-xl tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <CheckIcon size={20} color="#1A1A1A" />
                  СЛЕДУЮЩИЙ
                </motion.button>
              )}

              {/* Подсказка для игроков */}
              {!gameState.isHost && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ delay: 1, duration: 2, repeat: Infinity }}
                  className="text-center text-bunker-muted font-mono text-[10px] mt-4"
                >
                  Игрок оправдывается...
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voting overlay */}
      {(gameState.phase === 'voting' || gameState.phase === 'revoting') && !gameState.isHost && (
        <VotingScreen gameState={gameState} myId={myId} onVote={onVote} />
      )}

      {/* Pause overlay */}
      <AnimatePresence>
        {gameState.isPaused && <PauseOverlay isHost={gameState.isHost} onResume={onTogglePause} />}
      </AnimatePresence>
      {/* ═══ ПЛАВАЮЩАЯ КНОПКА "МОИ КАРТЫ" ═══ */}
      {!gameState.isHost && myPlayer?.cards && (
        <button
          onClick={() => setShowMyCards(true)}
          className="fixed top-3 left-3 z-[55] px-4 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-bunker-yellow/40 text-bunker-yellow font-display text-sm tracking-wider flex items-center gap-2 shadow-xl active:scale-95 transition-transform"
          style={{ minHeight: '48px', boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.1)' }}
        >
          <BackpackIcon size={18} color="#FFD700" />
          МОИ КАРТЫ
        </button>
      )}

      {/* ═══ ИИ КОММЕНТАРИИ — поверх ВСЕГО ═══ */}
      <AICommentary />

      {/* ═══ МОДАЛКА "МОИ КАРТЫ" ═══ */}
      <AnimatePresence>
        {showMyCards && myPlayer?.cards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex flex-col"
            onClick={() => setShowMyCards(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="text-center mb-4 pt-4">
                <p className="text-bunker-yellow font-display text-xl tracking-wider">МОИ КАРТЫ</p>
                <p className="text-bunker-muted font-mono text-[10px] mt-1">{myPlayer.name}</p>
              </div>

              {/* Список карт */}
              <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                {myPlayer.cards.map(card => {
                  const Icon = CARD_ICONS[card.type] || BriefcaseIcon;
                  const color = CARD_COLORS[card.type];
                  return (
                    <motion.div
                      key={card.type}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`rounded-xl p-4 border ${
                        card.revealed
                          ? 'border-white/20 bg-white/5'
                          : 'border-white/5 bg-bunker-card/50'
                      }`}
                      style={{ borderLeftWidth: 3, borderLeftColor: color }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: color + '15' }}
                        >
                          <Icon size={20} color={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: color + 'CC' }}>
                              {CARD_LABELS[card.type]}
                            </p>
                            {card.revealed ? (
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-bunker-green/20 text-bunker-green">ОТКРЫТА</span>
                            ) : (
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-bunker-muted">СКРЫТА</span>
                            )}
                          </div>
                          <p className="text-white font-body text-sm leading-snug">{card.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Кнопка закрыть */}
              <button
                onClick={() => setShowMyCards(false)}
                className="w-full py-3 bg-bunker-card border border-white/10 rounded-xl text-bunker-muted font-mono text-sm"
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
