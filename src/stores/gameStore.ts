// Zustand store for БУНКЕР 204-А game state

import { create } from 'zustand';
import type { GameState, AIComment, ScoreEntry } from '../types';

interface BunkerStore {
  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Player info
  playerName: string;
  setPlayerName: (name: string) => void;
  roomCode: string;
  setRoomCode: (code: string) => void;

  // Game state from server
  gameState: GameState | null;
  setGameState: (state: GameState) => void;

  // Local UI state
  showYourTurn: boolean;
  setShowYourTurn: (v: boolean) => void;
  isPausedOverlay: boolean;
  setIsPausedOverlay: (v: boolean) => void;

  // Scores
  scores: ScoreEntry[] | null;
  setScores: (s: ScoreEntry[]) => void;

  // AI comments (local feed)
  localAIComments: AIComment[];
  addAIComment: (comment: AIComment) => void;

  // Reset
  reset: () => void;
}

export const useBunkerStore = create<BunkerStore>((set) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  playerName: '',
  setPlayerName: (name) => set({ playerName: name }),
  roomCode: '',
  setRoomCode: (code) => set({ roomCode: code }),

  gameState: null,
  setGameState: (state) => set({ gameState: state }),

  showYourTurn: false,
  setShowYourTurn: (v) => set({ showYourTurn: v }),
  isPausedOverlay: false,
  setIsPausedOverlay: (v) => set({ isPausedOverlay: v }),

  scores: null,
  setScores: (s) => set({ scores: s }),

  localAIComments: [],
  addAIComment: (comment) =>
    set((state) => ({
      localAIComments: [...state.localAIComments.slice(-30), comment],
    })),

  reset: () =>
    set({
      gameState: null,
      showYourTurn: false,
      isPausedOverlay: false,
      scores: null,
      localAIComments: [],
      roomCode: '',
    }),
}));
