// БУНКЕР 204-А — Game State Manager
// Управление состоянием игры, раундами, голосованием

import { CARD_SETS, ROUND_CONFIG } from './cards.js';
import { AIHost } from './aiHost.js';

function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export class GameManager {
  constructor() {
    this.rooms = new Map();
    this.ai = new AIHost(process.env.ANTHROPIC_API_KEY || null);
  }

  createRoom(hostSocketId) {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const room = {
      code,
      phase: 'lobby', // lobby, catastrophe, playing, voting, revoting, elimination, finished
      round: 0,
      hostId: hostSocketId,
      players: [],
      activePlayerId: null,
      votes: {},
      revoteTargets: [],
      aiComments: [],
      pausedAt: null,
      isPaused: false,
      votingTimer: null,
      votingEndTime: null,
      roundChecklist: {}, // playerId -> boolean (has revealed this round)
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code);
  }

  joinRoom(code, playerSocketId, playerName) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };
    if (room.phase !== 'lobby') return { error: 'Игра уже началась' };
    if (room.players.length >= 13) return { error: 'Комната полная (макс. 13)' };
    if (room.players.find(p => p.name === playerName)) return { error: 'Это имя уже занято' };

    const player = {
      id: playerSocketId,
      name: playerName,
      isHost: false,
      cards: [],
      revealedCards: [],
      isEliminated: false,
      eliminatedRound: 0,
      voteCount: 0,
      totalVotesAgainst: 0,
      survivedRevote: false,
      score: 0,
    };

    room.players.push(player);
    return { success: true, player };
  }

  startGame(code) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };
    if (room.players.length < 2) return { error: 'Нужно минимум 2 игрока' };

    // Shuffle and assign card sets
    const shuffledCards = shuffleArray(CARD_SETS).slice(0, room.players.length);
    room.players.forEach((player, i) => {
      const cardSet = shuffledCards[i];
      player.cards = [
        { type: 'profession', label: 'Профессия', value: cardSet.profession, revealed: false },
        { type: 'biology', label: 'Биология', value: cardSet.biology, revealed: false },
        { type: 'health', label: 'Здоровье', value: cardSet.health, revealed: false },
        { type: 'hobby', label: 'Хобби', value: cardSet.hobby, revealed: false },
        { type: 'fact', label: 'Факт', value: cardSet.fact, revealed: false },
        { type: 'baggage', label: 'Багаж', value: cardSet.baggage, revealed: false },
      ];
    });

    room.phase = 'catastrophe';
    return { success: true };
  }

  startPlaying(code) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };
    room.phase = 'playing';
    room.round = 1;
    room.roundChecklist = {};
    room.players.filter(p => !p.isEliminated).forEach(p => {
      room.roundChecklist[p.id] = false;
    });
    return { success: true };
  }

  requestCardReveal(code, targetPlayerId) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    const player = room.players.find(p => p.id === targetPlayerId);
    if (!player) return { error: 'Игрок не найден' };
    if (player.isEliminated) return { error: 'Игрок выбыл' };

    room.activePlayerId = targetPlayerId;
    return { success: true, playerName: player.name };
  }

  revealCard(code, playerId, cardType) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { error: 'Игрок не найден' };

    const card = player.cards.find(c => c.type === cardType && !c.revealed);
    if (!card) return { error: 'Карта не найдена или уже открыта' };

    card.revealed = true;
    player.revealedCards.push({ ...card });

    const profession = player.cards.find(c => c.type === 'profession')?.value || 'Неизвестно';

    return {
      success: true,
      playerName: player.name,
      card: { ...card },
      profession,
    };
  }

  confirmPlayerTurn(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    room.roundChecklist[playerId] = true;
    room.activePlayerId = null;

    // Check if all active players have revealed
    const activePlayers = room.players.filter(p => !p.isEliminated);
    const allRevealed = activePlayers.every(p => room.roundChecklist[p.id]);

    return { success: true, allRevealed };
  }

  startVoting(code) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    room.phase = 'voting';
    room.votes = {};
    room.players.filter(p => !p.isEliminated).forEach(p => {
      room.votes[p.id] = { votedFor: null, votesReceived: 0 };
    });

    // Set 90 second timer
    room.votingEndTime = Date.now() + 90000;

    return { success: true, duration: 90 };
  }

  castVote(code, voterId, targetId) {
    const room = this.rooms.get(code);
    if (!room || room.phase !== 'voting' && room.phase !== 'revoting') return { error: 'Не время голосовать' };
    if (voterId === targetId) return { error: 'Нельзя голосовать за себя' };

    const voterData = room.votes[voterId];
    if (!voterData) return { error: 'Голосующий не найден' };
    if (voterData.votedFor !== null) return { error: 'Уже проголосовал' };

    voterData.votedFor = targetId;
    if (room.votes[targetId]) {
      room.votes[targetId].votesReceived++;
    }

    // Check if all voted
    const allVoted = Object.values(room.votes)
      .filter(v => v.votedFor !== undefined)
      .every(v => v.votedFor !== null);

    // Count total voters and voted
    const totalVoters = Object.keys(room.votes).length;
    const votedCount = Object.values(room.votes).filter(v => v.votedFor !== null).length;

    return { success: true, allVoted, votedCount, totalVoters };
  }

  getVotingResults(code) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    const roundConfig = ROUND_CONFIG.find(r => r.round === room.round);
    const toEliminate = roundConfig ? roundConfig.eliminates : 2;

    // Gather results
    const results = room.players
      .filter(p => !p.isEliminated)
      .map(p => ({
        id: p.id,
        name: p.name,
        votesReceived: room.votes[p.id]?.votesReceived || 0,
      }))
      .sort((a, b) => b.votesReceived - a.votesReceived);

    // Determine who's eliminated
    const eliminated = [];
    const tieCheck = [];

    for (let i = 0; i < results.length && eliminated.length < toEliminate; i++) {
      if (i === 0 || eliminated.length < toEliminate - 1) {
        eliminated.push(results[i]);
      } else {
        // Check for tie at the cutoff point
        const lastEliminated = eliminated[eliminated.length - 1];
        if (results[i].votesReceived === lastEliminated.votesReceived) {
          tieCheck.push(results[i]);
        } else {
          eliminated.push(results[i]);
        }
      }
    }

    // If there's a tie at the elimination boundary
    if (tieCheck.length > 0) {
      // Also check if the last eliminated has the same votes as tie candidates
      const tieVotes = tieCheck[0].votesReceived;
      const tiedPlayers = results.filter(r => r.votesReceived === tieVotes);

      return {
        success: true,
        results,
        eliminated: eliminated.filter(e => e.votesReceived > tieVotes),
        tie: true,
        tiedPlayers,
        toEliminate,
      };
    }

    return {
      success: true,
      results,
      eliminated: eliminated.slice(0, toEliminate),
      tie: false,
      toEliminate,
    };
  }

  startRevote(code, tiedPlayerIds) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    room.phase = 'revoting';
    room.revoteTargets = tiedPlayerIds;
    room.votes = {};

    // Only non-tied active players can vote
    room.players
      .filter(p => !p.isEliminated && !tiedPlayerIds.includes(p.id))
      .forEach(p => {
        room.votes[p.id] = { votedFor: null, votesReceived: 0 };
      });

    // Also add vote receivers for tied players
    tiedPlayerIds.forEach(id => {
      room.votes[id] = { votesReceived: 0 };
    });

    room.votingEndTime = Date.now() + 60000; // 60 seconds for revote

    return { success: true, duration: 60 };
  }

  confirmElimination(code, playerIds) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    const eliminatedNames = [];
    playerIds.forEach(id => {
      const player = room.players.find(p => p.id === id);
      if (player) {
        player.isEliminated = true;
        player.eliminatedRound = room.round;
        player.totalVotesAgainst = room.votes[id]?.votesReceived || 0;
        eliminatedNames.push({ name: player.name, profession: player.cards.find(c => c.type === 'profession')?.value });
      }
    });

    room.phase = 'elimination';

    // Check if game is over (2 players left)
    const activePlayers = room.players.filter(p => !p.isEliminated);
    const gameOver = activePlayers.length <= 2;

    return { success: true, eliminatedNames, gameOver, remainingCount: activePlayers.length };
  }

  startNextRound(code) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    room.round++;
    room.phase = 'playing';
    room.votes = {};
    room.activePlayerId = null;
    room.roundChecklist = {};
    room.players.filter(p => !p.isEliminated).forEach(p => {
      room.roundChecklist[p.id] = false;
    });

    return { success: true, round: room.round };
  }

  togglePause(code) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    room.isPaused = !room.isPaused;
    if (room.isPaused) {
      room.pausedAt = Date.now();
      // Pause voting timer if active
      if (room.votingEndTime) {
        room._remainingVoteTime = room.votingEndTime - Date.now();
      }
    } else {
      // Resume voting timer
      if (room._remainingVoteTime) {
        room.votingEndTime = Date.now() + room._remainingVoteTime;
        delete room._remainingVoteTime;
      }
      room.pausedAt = null;
    }

    return { success: true, isPaused: room.isPaused };
  }

  calculateScores(code) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Комната не найдена' };

    room.phase = 'finished';

    room.players.forEach(player => {
      let score = 85; // Base score

      if (!player.isEliminated) {
        // Winner bonus
        score += 10;
        // All 6 rounds survived
        score += 6;
      } else {
        // Rounds survived
        score += player.eliminatedRound;
      }

      // Vote-based scoring
      if (player.totalVotesAgainst <= 1) {
        score += 3;
      } else if (player.totalVotesAgainst <= 3) {
        score += 1;
      }

      // Active participation
      if (player.revealedCards.length > 0) {
        score += 1;
      }

      // Survived revote bonus
      if (player.survivedRevote) {
        score += 2;
      }

      // Clamp to 85-95 range
      player.score = Math.min(95, Math.max(85, score));
    });

    const scores = room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isWinner: !p.isEliminated,
      eliminatedRound: p.eliminatedRound,
      profession: p.cards.find(c => c.type === 'profession')?.value,
    }));

    return { success: true, scores };
  }

  // Get sanitized game state for a specific player
  getPlayerState(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return null;

    const isHost = room.hostId === playerId;
    const self = room.players.find(p => p.id === playerId);

    return {
      code: room.code,
      phase: room.phase,
      round: room.round,
      isPaused: room.isPaused,
      isHost,
      activePlayerId: room.activePlayerId,
      votingEndTime: room.votingEndTime,
      roundChecklist: room.roundChecklist,
      aiComments: room.aiComments.slice(-20), // Last 20 comments
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        isEliminated: p.isEliminated,
        eliminatedRound: p.eliminatedRound,
        revealedCards: p.revealedCards,
        // Only show hidden card count (not content) to others
        hiddenCardCount: p.cards.filter(c => !c.revealed).length,
        // Show own cards to self
        cards: p.id === playerId ? p.cards : undefined,
        voteCount: isHost ? (room.votes[p.id]?.votesReceived || 0) : undefined,
        score: room.phase === 'finished' ? p.score : undefined,
      })),
      // Voting data
      votes: room.phase === 'voting' || room.phase === 'revoting' ? {
        hasVoted: self ? room.votes[playerId]?.votedFor !== null : false,
        totalVoted: Object.values(room.votes).filter(v => v.votedFor !== null).length,
        totalVoters: Object.values(room.votes).filter(v => v.votedFor !== undefined).length,
        // Host sees all vote counts
        results: isHost ? Object.fromEntries(
          Object.entries(room.votes).map(([id, v]) => [id, v.votesReceived])
        ) : undefined,
        revoteTargets: room.revoteTargets,
      } : undefined,
    };
  }

  addAIComment(code, comment) {
    const room = this.rooms.get(code);
    if (!room) return;
    room.aiComments.push({
      text: comment,
      timestamp: Date.now(),
    });
  }

  removePlayer(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== playerId);
    if (room.players.length === 0) {
      this.rooms.delete(code);
    }
  }

  findRoomByPlayer(playerId) {
    for (const [code, room] of this.rooms) {
      if (room.hostId === playerId || room.players.find(p => p.id === playerId)) {
        return code;
      }
    }
    return null;
  }
}
