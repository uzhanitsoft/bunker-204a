// БУНКЕР 204-А — Main Server
// Express + Socket.io WebSocket server

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GameManager } from './gameManager.js';
import { BotManager } from './botManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3204;

app.use(cors());
app.use(express.json());

// В продакшене раздаём собранный фронтенд
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const gm = new GameManager();
const bots = new BotManager(io, gm);

// Helper: broadcast game state to all players in room
function broadcastState(roomCode) {
  const room = gm.getRoom(roomCode);
  if (!room) return;

  // Track sent IDs to avoid duplicates
  const sentIds = new Set();

  // Send personalized state to each player
  room.players.forEach(player => {
    if (sentIds.has(player.id)) return;
    sentIds.add(player.id);
    const state = gm.getPlayerState(roomCode, player.id);
    io.to(player.id).emit('game_state_update', state);
  });

  // Also send to host (if not already sent as player)
  if (!sentIds.has(room.hostId)) {
    const hostState = gm.getPlayerState(roomCode, room.hostId);
    io.to(room.hostId).emit('game_state_update', hostState);
  }
}

// Helper: send AI comment to all in room
function sendAIComment(roomCode, comment) {
  const room = gm.getRoom(roomCode);
  if (!room) return;
  gm.addAIComment(roomCode, comment);
  // Обновляем game state — клиент берёт aiComments оттуда
  broadcastState(roomCode);
}

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // ═══ CREATE ROOM ═══
  socket.on('create_room', async (callback) => {
    const room = gm.createRoom(socket.id);
    socket.join(room.code);
    console.log(`🏠 Room created: ${room.code} by ${socket.id}`);
    if (typeof callback === 'function') callback({ success: true, roomCode: room.code });
  });

  // ═══ TEST MODE: HOST ═══
  // User is host, 4 bot players auto-play
  socket.on('create_test_host', async (callback) => {
    const room = gm.createRoom(socket.id);
    socket.join(room.code);
    console.log(`🧪 TEST HOST room: ${room.code}`);

    // Add 13 bot players
    const botIds = bots.addBots(room.code, 13);
    room._testMode = 'host';
    room._botIds = botIds;

    // Start game automatically
    gm.startGame(room.code);
    const playerNames = room.players.map(p => p.name);
    const startComment = await gm.ai.getGameStart(playerNames);
    sendAIComment(room.code, startComment);

    // Skip catastrophe, go to playing
    gm.startPlaying(room.code);

    broadcastState(room.code);
    if (typeof callback === 'function') callback({ success: true, roomCode: room.code, testMode: 'host' });
  });

  // ═══ TEST MODE: PLAYER ═══
  // User is player, bot host runs everything
  socket.on('create_test_player', async ({ playerName }, callback) => {
    // Create room with a bot host
    const botHostId = `bot_host_${Date.now()}`;
    const room = gm.createRoom(botHostId);
    socket.join(room.code);
    console.log(`🧪 TEST PLAYER room: ${room.code}`);

    // Add real player
    gm.joinRoom(room.code, socket.id, playerName || 'Игрок');

    // Add 12 more bot players (12 bots + 1 real = 13 players)
    const botIds = bots.addBots(room.code, 12);
    room._testMode = 'player';
    room._botIds = [botHostId, ...botIds];
    room._realPlayerId = socket.id;

    // Start game
    gm.startGame(room.code);
    const playerNames = room.players.map(p => p.name);
    const startComment = await gm.ai.getGameStart(playerNames);
    sendAIComment(room.code, startComment);

    // Skip catastrophe, go to playing
    gm.startPlaying(room.code);

    broadcastState(room.code);

    // Start auto-host bot
    bots.startAutoHost(room.code, socket.id);

    if (typeof callback === 'function') callback({ success: true, roomCode: room.code, testMode: 'player' });
  });

  // ═══ JOIN ROOM ═══
  socket.on('join_room', async ({ roomCode, playerName }, callback) => {
    const result = gm.joinRoom(roomCode, socket.id, playerName);
    if (result.error) {
      callback({ error: result.error });
      return;
    }

    socket.join(roomCode);
    console.log(`👤 ${playerName} joined room ${roomCode}`);

    // AI welcome
    const welcome = await gm.ai.getWelcome(playerName);
    sendAIComment(roomCode, welcome);

    broadcastState(roomCode);
    callback({ success: true });
  });

  // ═══ START GAME ═══
  socket.on('start_game', async ({ roomCode }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий может начать игру' });
      return;
    }

    const result = gm.startGame(roomCode);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    // AI game start comment
    const playerNames = room.players.map(p => p.name);
    const startComment = await gm.ai.getGameStart(playerNames);
    sendAIComment(roomCode, startComment);

    broadcastState(roomCode);
    callback?.({ success: true });
  });

  // ═══ START PLAYING (after catastrophe screen) ═══
  socket.on('start_playing', ({ roomCode }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    const result = gm.startPlaying(roomCode);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    broadcastState(roomCode);
    callback?.({ success: true });
  });

  // ═══ REQUEST CARD REVEAL ═══
  socket.on('request_card_reveal', async ({ roomCode, targetPlayerId }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    const result = gm.requestCardReveal(roomCode, targetPlayerId);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    // If target is a bot, auto-reveal
    if (targetPlayerId.startsWith('bot_')) {
      bots.botRevealCard(roomCode, targetPlayerId);
    } else {
      io.to(targetPlayerId).emit('your_turn', {
        message: 'Ведущий вызывает тебя! Открой одну карту и объяснись',
      });
    }

    broadcastState(roomCode);
    callback?.({ success: true });

    // AI комментарий при вызове — НЕ блокирует основной поток
    try {
      const calledComment = await gm.ai.getPlayerCalled(result.playerName);
      sendAIComment(roomCode, calledComment);
    } catch (e) {
      console.error('AI comment error:', e.message);
    }
  });

  // ═══ REVEAL CARD ═══
  socket.on('reveal_card', async ({ roomCode, cardType }, callback) => {
    const result = gm.revealCard(roomCode, socket.id, cardType);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    // AI card reaction
    const reaction = await gm.ai.getCardReaction(
      result.playerName,
      result.card.label,
      result.card.value,
      result.profession
    );
    sendAIComment(roomCode, reaction);

    // Notify all about the revealed card with animation data
    io.to(roomCode).emit('card_revealed', {
      playerId: socket.id,
      playerName: result.playerName,
      card: result.card,
    });

    broadcastState(roomCode);
    callback?.({ success: true });
  });

  socket.on('confirm_player_turn', async ({ roomCode, playerId }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    // Получаем имя активного игрока до подтверждения
    const activeId = playerId || room.activePlayerId;
    const activePlayer = room.players.find(p => p.id === activeId);
    const playerName = activePlayer?.name || 'Неизвестный';

    const result = gm.confirmPlayerTurn(roomCode, activeId);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    broadcastState(roomCode);
    callback?.({ success: true, allRevealed: result.allRevealed });

    // AI комментарий при завершении хода — НЕ блокирует
    try {
      const turnComment = await gm.ai.getTurnEndReaction(playerName);
      sendAIComment(roomCode, turnComment);
    } catch (e) {
      console.error('AI comment error:', e.message);
    }
  });

  // ═══ START VOTING ═══
  socket.on('start_voting', async ({ roomCode }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    const result = gm.startVoting(roomCode);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    // AI voting comment
    const voteComment = await gm.ai.getVoteStart(room.round);
    sendAIComment(roomCode, voteComment);

    broadcastState(roomCode);

    // Bots auto-vote in test mode
    if (room._testMode === 'host') {
      bots.botsAutoVote(roomCode);
    }

    // Auto-close voting after timer
    setTimeout(() => {
      const currentRoom = gm.getRoom(roomCode);
      if (currentRoom && (currentRoom.phase === 'voting' || currentRoom.phase === 'revoting') && !currentRoom.isPaused) {
        io.to(roomCode).emit('voting_ended');
        broadcastState(roomCode);
      }
    }, result.duration * 1000);

    callback?.({ success: true, duration: result.duration });
  });

  // ═══ CAST VOTE ═══
  socket.on('cast_vote', ({ roomCode, targetId }, callback) => {
    const result = gm.castVote(roomCode, socket.id, targetId);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    broadcastState(roomCode);

    if (result.allVoted) {
      io.to(roomCode).emit('voting_ended');
    }

    callback?.({ success: true });
  });

  // ═══ GET VOTING RESULTS ═══
  socket.on('get_voting_results', ({ roomCode }, callback) => {
    const result = gm.getVotingResults(roomCode);
    callback?.(result);
  });

  // ═══ START REVOTE ═══
  socket.on('start_revote', async ({ roomCode, tiedPlayerIds }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    const result = gm.startRevote(roomCode, tiedPlayerIds);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    sendAIComment(roomCode, 'Ничья! Переголосование. На этот раз постарайтесь определиться.');
    broadcastState(roomCode);

    setTimeout(() => {
      const currentRoom = gm.getRoom(roomCode);
      if (currentRoom && currentRoom.phase === 'revoting' && !currentRoom.isPaused) {
        io.to(roomCode).emit('voting_ended');
        broadcastState(roomCode);
      }
    }, result.duration * 1000);

    callback?.({ success: true });
  });

  // ═══ CONFIRM ELIMINATION ═══
  socket.on('confirm_elimination', async ({ roomCode, playerIds }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    const result = gm.confirmElimination(roomCode, playerIds);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    // AI elimination comments
    for (const eliminated of result.eliminatedNames) {
      const comment = await gm.ai.getElimination(eliminated.name, eliminated.profession);
      sendAIComment(roomCode, comment);
    }

    // Notify eliminated players
    playerIds.forEach(id => {
      io.to(id).emit('player_eliminated', { playerId: id });
    });

    if (result.gameOver) {
      // Calculate scores and go to final screen
      const scores = gm.calculateScores(roomCode);

      // AI finale
      const activePlayers = room.players.filter(p => !p.isEliminated);
      if (activePlayers.length >= 2) {
        const finaleComment = await gm.ai.getFinale(activePlayers[0].name, activePlayers[1].name);
        sendAIComment(roomCode, finaleComment);
      }

      io.to(roomCode).emit('game_over', scores);
    }

    broadcastState(roomCode);
    callback?.({ success: true, gameOver: result.gameOver });
  });

  // ═══ HOST MANUAL ELIMINATION (for unresolved ties) ═══
  socket.on('host_eliminate', async ({ roomCode, playerId }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    const result = gm.confirmElimination(roomCode, [playerId]);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    for (const eliminated of result.eliminatedNames) {
      const comment = await gm.ai.getElimination(eliminated.name, eliminated.profession);
      sendAIComment(roomCode, comment);
    }

    broadcastState(roomCode);
    callback?.({ success: true, gameOver: result.gameOver });
  });

  // ═══ START NEXT ROUND ═══
  socket.on('start_next_round', ({ roomCode }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    const result = gm.startNextRound(roomCode);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    sendAIComment(roomCode, `Раунд ${result.round}. Новый круг — новые откровения.`);
    broadcastState(roomCode);
    callback?.({ success: true, round: result.round });
  });

  // ═══ TOGGLE PAUSE ═══
  socket.on('toggle_pause', ({ roomCode }, callback) => {
    const room = gm.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) {
      callback?.({ error: 'Только ведущий' });
      return;
    }

    const result = gm.togglePause(roomCode);
    if (result.error) {
      callback?.({ error: result.error });
      return;
    }

    if (result.isPaused) {
      io.to(roomCode).emit('game_paused', { text: gm.ai.getPauseText() });
    } else {
      io.to(roomCode).emit('game_resumed');
    }

    broadcastState(roomCode);
    callback?.({ success: true, isPaused: result.isPaused });
  });

  // ═══ DISCONNECT ═══
  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    const roomCode = gm.findRoomByPlayer(socket.id);
    if (roomCode) {
      const room = gm.getRoom(roomCode);
      if (room && room.phase === 'lobby') {
        gm.removePlayer(roomCode, socket.id);
        broadcastState(roomCode);
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: gm.rooms.size });
});

// SPA fallback — все маршруты → index.html
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏥 БУНКЕР 204-А сервер запущен на порту ${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
