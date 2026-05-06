// БУНКЕР 204-А — Main App Component

import { useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useBunkerStore } from './stores/gameStore';
import { useSocket } from './hooks/useSocket';
import EntryScreen from './components/EntryScreen';
import CatastropheScreen from './components/CatastropheScreen';
import GameTable from './components/GameTable';
import FinalScreen from './components/FinalScreen';

export default function App() {
  const { emit, getSocketId } = useSocket();
  const { gameState, scores, reset } = useBunkerStore();

  const phase = gameState?.phase || 'lobby';

  // Handle create room
  const handleCreateRoom = useCallback(async () => {
    return await emit('create_room');
  }, [emit]);

  // Handle join room
  const handleJoinRoom = useCallback(async (code: string, name: string) => {
    return await emit('join_room', { roomCode: code, playerName: name });
  }, [emit]);



  // Handle start game (from host)
  const handleStartGame = useCallback(async () => {
    if (!gameState) return;
    await emit('start_game', { roomCode: gameState.code });
  }, [emit, gameState]);

  // Handle start playing (after catastrophe)
  const handleStartPlaying = useCallback(async () => {
    if (!gameState) return;
    await emit('start_playing', { roomCode: gameState.code });
  }, [emit, gameState]);

  // Game action handlers
  const handleRequestReveal = useCallback((playerId: string) => {
    if (!gameState) return;
    emit('request_card_reveal', { roomCode: gameState.code, targetPlayerId: playerId });
  }, [emit, gameState]);

  const handleRevealCard = useCallback((cardType: string) => {
    if (!gameState) return;
    emit('reveal_card', { roomCode: gameState.code, cardType });
  }, [emit, gameState]);

  const handleConfirmTurn = useCallback(() => {
    if (!gameState) return;
    emit('confirm_player_turn', { roomCode: gameState.code, playerId: gameState.activePlayerId });
  }, [emit, gameState]);

  const handleStartVoting = useCallback(() => {
    if (!gameState) return;
    emit('start_voting', { roomCode: gameState.code });
  }, [emit, gameState]);

  const handleVote = useCallback((targetId: string) => {
    if (!gameState) return;
    emit('cast_vote', { roomCode: gameState.code, targetId });
  }, [emit, gameState]);

  const handleConfirmElimination = useCallback((playerIds: string[]) => {
    if (!gameState) return;
    emit('confirm_elimination', { roomCode: gameState.code, playerIds });
  }, [emit, gameState]);

  const handleStartNextRound = useCallback(() => {
    if (!gameState) return;
    emit('start_next_round', { roomCode: gameState.code });
  }, [emit, gameState]);

  const handleTogglePause = useCallback(() => {
    if (!gameState) return;
    emit('toggle_pause', { roomCode: gameState.code });
  }, [emit, gameState]);

  const handleStartRevote = useCallback((playerIds: string[]) => {
    if (!gameState) return;
    emit('start_revote', { roomCode: gameState.code, tiedPlayerIds: playerIds });
  }, [emit, gameState]);

  const handleHostEliminate = useCallback((playerId: string) => {
    if (!gameState) return;
    emit('host_eliminate', { roomCode: gameState.code, playerId });
  }, [emit, gameState]);

  const handleGetVotingResults = useCallback(async () => {
    if (!gameState) return null;
    return await emit('get_voting_results', { roomCode: gameState.code });
  }, [emit, gameState]);

  const handleNewGame = useCallback(() => {
    reset();
  }, [reset]);

  // Listen for startGame event from EntryScreen
  useEffect(() => {
    const handler = () => handleStartGame();
    window.addEventListener('startGame', handler);
    return () => window.removeEventListener('startGame', handler);
  }, [handleStartGame]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-bunker-bg">
      <AnimatePresence mode="wait">
        {/* Entry / Lobby */}
        {(!gameState || phase === 'lobby') && (
          <EntryScreen
            key="entry"
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        )}

        {/* Catastrophe Screen */}
        {phase === 'catastrophe' && (
          <CatastropheScreen
            key="catastrophe"
            isHost={gameState?.isHost || false}
            onStartGame={handleStartPlaying}
          />
        )}

        {/* Main Game Table */}
        {(phase === 'playing' || phase === 'voting' || phase === 'revoting' || phase === 'elimination') && gameState && (
          <GameTable
            key="game"
            gameState={gameState}
            myId={getSocketId()}
            onRequestReveal={handleRequestReveal}
            onRevealCard={handleRevealCard}
            onConfirmTurn={handleConfirmTurn}
            onStartVoting={handleStartVoting}
            onVote={handleVote}
            onConfirmElimination={handleConfirmElimination}
            onStartNextRound={handleStartNextRound}
            onTogglePause={handleTogglePause}
            onStartRevote={handleStartRevote}
            onHostEliminate={handleHostEliminate}
            onGetVotingResults={handleGetVotingResults}
          />
        )}

        {/* Final Screen */}
        {phase === 'finished' && scores && (
          <FinalScreen
            key="final"
            scores={scores}
            onNewGame={handleNewGame}
            isHost={gameState?.isHost || false}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
