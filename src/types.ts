// TypeScript types for БУНКЕР 204-А

export interface Card {
  type: 'profession' | 'biology' | 'health' | 'hobby' | 'fact' | 'baggage';
  label: string;
  value: string;
  revealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  isEliminated: boolean;
  eliminatedRound: number;
  revealedCards: Card[];
  hiddenCardCount: number;
  cards?: Card[]; // Only available for self
  voteCount?: number; // Only available for host
  score?: number;
}

export interface AIComment {
  text: string;
  timestamp: number;
}

export interface VoteData {
  hasVoted: boolean;
  totalVoted: number;
  totalVoters: number;
  results?: Record<string, number>; // host only
  revoteTargets: string[];
}

export interface GameState {
  code: string;
  phase: 'lobby' | 'catastrophe' | 'playing' | 'voting' | 'revoting' | 'elimination' | 'finished';
  round: number;
  isPaused: boolean;
  isHost: boolean;
  activePlayerId: string | null;
  votingEndTime: number | null;
  roundChecklist: Record<string, boolean>;
  aiComments: AIComment[];
  players: Player[];
  votes?: VoteData;
}

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  isWinner: boolean;
  eliminatedRound: number;
  profession: string;
}
