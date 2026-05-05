// БУНКЕР 204-А — Bot Manager для тестирования
// Создаёт ботов и автоматизирует их действия

const BOT_NAMES = [
  'Бот-Иван', 'Бот-Маша', 'Бот-Коля', 'Бот-Аня',
  'Бот-Саша', 'Бот-Дима', 'Бот-Лена', 'Бот-Петя',
  'Бот-Оля', 'Бот-Миша', 'Бот-Катя', 'Бот-Артём',
];

export class BotManager {
  constructor(io, gameManager) {
    this.io = io;
    this.gm = gameManager;
    this.botTimers = new Map(); // roomCode -> timers
  }

  // Add bot players to a room
  addBots(roomCode, count = 4) {
    const room = this.gm.getRoom(roomCode);
    if (!room) return [];

    const botIds = [];
    const shuffledNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      const botId = `bot_${roomCode}_${i}`;
      const botName = shuffledNames[i] || `Бот-${i + 1}`;
      
      const result = this.gm.joinRoom(roomCode, botId, botName);
      if (result.success) {
        botIds.push(botId);
        console.log(`🤖 Bot added: ${botName} (${botId})`);
      }
    }

    return botIds;
  }

  // Get all bot IDs in a room
  getBotIds(roomCode) {
    const room = this.gm.getRoom(roomCode);
    if (!room) return [];
    return room.players.filter(p => p.id.startsWith('bot_')).map(p => p.id);
  }

  // Bot auto-reveals a card when requested
  botRevealCard(roomCode, botId) {
    const room = this.gm.getRoom(roomCode);
    if (!room) return;

    const bot = room.players.find(p => p.id === botId);
    if (!bot) return;

    // Find unrevealed cards
    const hiddenCards = bot.cards.filter(c => !c.revealed);
    if (hiddenCards.length === 0) return;

    // Pick a random card to reveal
    const card = hiddenCards[Math.floor(Math.random() * hiddenCards.length)];

    setTimeout(async () => {
      const result = this.gm.revealCard(roomCode, botId, card.type);
      if (result.success) {
        // AI comment
        const reaction = await this.gm.ai.getCardReaction(
          result.playerName, result.card.label, result.card.value, result.profession
        );
        this.gm.addAIComment(roomCode, reaction);
        this.io.to(roomCode).emit('ai_comment', { text: reaction, timestamp: Date.now() });
        this.io.to(roomCode).emit('card_revealed', {
          playerId: botId,
          playerName: result.playerName,
          card: result.card,
        });

        // НЕ подтверждаем автоматически — ведущий сам нажмёт СЛЕДУЮЩИЙ
        this.broadcastState(roomCode);
      }
    }, 1500 + Math.random() * 1000); // 1.5-2.5 sec delay
  }

  // Bots auto-vote (protecting a specific player if needed)
  botsAutoVote(roomCode, protectPlayerId = null) {
    const room = this.gm.getRoom(roomCode);
    if (!room) return;

    const botIds = this.getBotIds(roomCode);
    const activePlayers = room.players.filter(p => !p.isEliminated);
    const activeBots = activePlayers.filter(p => p.id.startsWith('bot_'));
    const nonProtected = activePlayers.filter(p => p.id !== protectPlayerId && p.id.startsWith('bot_'));

    botIds.forEach((botId, i) => {
      const bot = activePlayers.find(p => p.id === botId);
      if (!bot || bot.isEliminated) return;

      setTimeout(() => {
        // Choose who to vote for (not self, not protected player)
        const targets = nonProtected.filter(p => p.id !== botId);
        if (targets.length === 0) return;

        const target = targets[Math.floor(Math.random() * targets.length)];
        this.gm.castVote(roomCode, botId, target.id);
        this.broadcastState(roomCode);
      }, 2000 + i * 800 + Math.random() * 1000);
    });
  }

  // === AUTO-HOST MODE (for player test) ===
  // Bot host runs the entire game automatically
  startAutoHost(roomCode, realPlayerId) {
    console.log(`🤖 Auto-host starting for room ${roomCode}`);
    this.clearTimers(roomCode);
    
    const timers = [];
    this.botTimers.set(roomCode, timers);

    // Wait a bit, then start the game flow
    const runRound = () => {
      const room = this.gm.getRoom(roomCode);
      if (!room || room.phase === 'finished') return;

      const activePlayers = room.players.filter(p => !p.isEliminated);
      if (activePlayers.length <= 2) {
        // Game over!
        this.gm.calculateScores(roomCode);
        this.broadcastState(roomCode);
        return;
      }

      let delay = 0;

      // Request each player to reveal a card
      activePlayers.forEach((player, index) => {
        delay += 2500;
        
        const t = setTimeout(() => {
          const currentRoom = this.gm.getRoom(roomCode);
          if (!currentRoom || currentRoom.phase !== 'playing') return;

          // Request reveal
          this.gm.requestCardReveal(roomCode, player.id);
          this.broadcastState(roomCode);

          if (player.id.startsWith('bot_')) {
            // Bot auto-reveals
            this.botRevealCard(roomCode, player.id);
          } else {
            // Real player — wait for them, then auto-confirm after 8 seconds
            setTimeout(() => {
              const r = this.gm.getRoom(roomCode);
              if (r && r.activePlayerId === player.id) {
                // Auto reveal a card for the player if they haven't
                const p = r.players.find(pl => pl.id === player.id);
                if (p) {
                  const hidden = p.cards.filter(c => !c.revealed);
                  if (hidden.length > 0 && !r.roundChecklist[player.id]) {
                    // Don't auto-reveal for real player, just wait longer
                  }
                }
              }
            }, 8000);
          }
        }, delay);
        timers.push(t);

        // Confirm turn after reveal
        delay += 3000;
      });

      // Start voting after all reveals
      delay += 2000;
      const voteTimer = setTimeout(async () => {
        const currentRoom = this.gm.getRoom(roomCode);
        if (!currentRoom || currentRoom.phase !== 'playing') return;

        // Check all revealed
        const active = currentRoom.players.filter(p => !p.isEliminated);
        const allDone = active.every(p => currentRoom.roundChecklist[p.id]);
        
        if (!allDone) {
          // Force confirm remaining
          active.forEach(p => {
            if (!currentRoom.roundChecklist[p.id]) {
              this.gm.confirmPlayerTurn(roomCode, p.id);
            }
          });
        }

        // Start voting
        const voteComment = await this.gm.ai.getVoteStart(currentRoom.round);
        this.gm.addAIComment(roomCode, voteComment);
        this.io.to(roomCode).emit('ai_comment', { text: voteComment, timestamp: Date.now() });
        
        this.gm.startVoting(roomCode);
        this.broadcastState(roomCode);

        // Bots vote (protecting real player)
        this.botsAutoVote(roomCode, realPlayerId);

        // After voting, eliminate
        setTimeout(async () => {
          const r = this.gm.getRoom(roomCode);
          if (!r) return;

          const results = this.gm.getVotingResults(roomCode);
          if (results.success && results.eliminated) {
            // Make sure real player is not eliminated
            let toEliminate = results.eliminated
              .filter(e => e.id !== realPlayerId)
              .map(e => e.id);
            
            if (toEliminate.length === 0) {
              // Pick a random bot to eliminate instead
              const bots = r.players.filter(p => !p.isEliminated && p.id.startsWith('bot_'));
              if (bots.length > 0) {
                toEliminate = [bots[0].id];
              }
            }

            const elimResult = this.gm.confirmElimination(roomCode, toEliminate.slice(0, 1));
            
            if (elimResult.success) {
              for (const e of elimResult.eliminatedNames) {
                const comment = await this.gm.ai.getElimination(e.name, e.profession);
                this.gm.addAIComment(roomCode, comment);
                this.io.to(roomCode).emit('ai_comment', { text: comment, timestamp: Date.now() });
              }
            }

            this.broadcastState(roomCode);

            if (elimResult.gameOver) {
              // Finale
              const scores = this.gm.calculateScores(roomCode);
              const active = r.players.filter(p => !p.isEliminated);
              if (active.length >= 2) {
                const finale = await this.gm.ai.getFinale(active[0].name, active[1].name);
                this.gm.addAIComment(roomCode, finale);
                this.io.to(roomCode).emit('ai_comment', { text: finale, timestamp: Date.now() });
              }
              this.io.to(roomCode).emit('game_over', scores);
              this.broadcastState(roomCode);
            } else {
              // Next round after delay
              setTimeout(() => {
                this.gm.startNextRound(roomCode);
                this.gm.addAIComment(roomCode, `Раунд ${r.round + 1}. Продолжаем.`);
                this.broadcastState(roomCode);
                
                // Run next round
                setTimeout(() => runRound(), 2000);
              }, 3000);
            }
          }
        }, 8000); // Wait for voting

      }, delay);
      timers.push(voteTimer);
    };

    // Start first round
    setTimeout(() => runRound(), 3000);
  }

  broadcastState(roomCode) {
    const room = this.gm.getRoom(roomCode);
    if (!room) return;

    room.players.forEach(player => {
      if (!player.id.startsWith('bot_')) {
        const state = this.gm.getPlayerState(roomCode, player.id);
        this.io.to(player.id).emit('game_state_update', state);
      }
    });

    // Also send to host
    if (!room.hostId.startsWith('bot_')) {
      const hostState = this.gm.getPlayerState(roomCode, room.hostId);
      this.io.to(room.hostId).emit('game_state_update', hostState);
    }
  }

  clearTimers(roomCode) {
    const timers = this.botTimers.get(roomCode);
    if (timers) {
      timers.forEach(t => clearTimeout(t));
      this.botTimers.delete(roomCode);
    }
  }
}
