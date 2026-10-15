import crypto from 'crypto';
import { roomManager } from '../rooms/roomManager.js';
import { wordExists, evaluateGuess } from '../game/wordleEngine.js';
import { calculateRoundScores } from '../game/scoring.js';
import { isValidWord, sanitizeDisplayName } from '../utils/validation.js';
import { createRateLimiter } from '../utils/rateLimiter.js';

// Rate limiters
const createRoomLimiter = createRateLimiter(60 * 1000, 5); // max 5 per minute
const joinRoomLimiter = createRateLimiter(60 * 1000, 10); // max 10 per minute
const guessLimiter = createRateLimiter(30 * 1000, 15); // max 15 per 30 seconds

/**
 * Helper to end a round and broadcast results
 */
function endRound(io, room, winnerPlayerId = null) {
  const currentSetterId = room.wordSetterOrder[room.currentWordSetterIndex];
  const setter = room.players.get(currentSetterId);
  const wordSetterId = setter ? setter.id : null;

  const winner = winnerPlayerId ? room.players.get(winnerPlayerId) : null;
  const winnerName = winner ? winner.name : null;

  // Calculate points for this round
  const playersList = Array.from(room.players.values());
  const roundScores = calculateRoundScores(playersList, room.roundGuesses, winnerPlayerId, wordSetterId);

  // Update cumulative leaderboard
  for (const scoreEntry of roundScores) {
    const prevScore = room.leaderboard.get(scoreEntry.playerId) || 0;
    room.leaderboard.set(scoreEntry.playerId, prevScore + scoreEntry.pointsEarned);
  }

  // Construct results array for all players
  const results = playersList.map(player => {
    const guessState = room.roundGuesses.get(player.id) || { guesses: [], attempts: 0, solved: false };
    const scoreItem = roundScores.find(s => s.playerId === player.id);
    return {
      playerId: player.id,
      playerName: player.name,
      guesses: guessState.guesses,
      pointsEarned: scoreItem ? scoreItem.pointsEarned : 0,
      isSolved: Boolean(guessState.solved),
      isWordSetter: player.id === wordSetterId
    };
  });

  // Updated leaderboard list sorted descending
  const updatedLeaderboard = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    score: room.leaderboard.get(p.id) || 0
  })).sort((a, b) => b.score - a.score);

  room.roundResults = {
    secretWord: room.currentWord,
    results,
    winnerId: winnerPlayerId,
    winnerName,
    leaderboard: updatedLeaderboard
  };

  io.to(room.code).emit('round_end', {
    secretWord: room.currentWord,
    results,
    winnerId: winnerPlayerId,
    winnerName,
    leaderboard: updatedLeaderboard
  });
}

/**
 * Registers all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerHandlers(io, socket) {
  // CREATE ROOM
  socket.on('create_room', ({ playerName }) => {
    if (!createRoomLimiter(socket.id)) {
      return socket.emit('error', { message: 'Too many requests. Please wait a moment.' });
    }

    const cleanName = sanitizeDisplayName(playerName) || 'Player 1';
    const playerId = `p_${crypto.randomUUID().slice(0, 8)}`;

    const { roomCode, room } = roomManager.createRoom(playerId, cleanName);

    // Update socket mapping
    socket.data.playerId = playerId;
    socket.data.roomCode = roomCode;
    const player = room.players.get(playerId);
    if (player) player.socketId = socket.id;

    socket.join(roomCode);

    socket.emit('room_created', {
      roomCode,
      playerId,
      room: roomManager.getRoomSnapshot(room, playerId)
    });
  });

  // JOIN ROOM
  socket.on('join_room', ({ roomCode, playerName, playerId }) => {
    if (!joinRoomLimiter(socket.id)) {
      return socket.emit('error', { message: 'Too many requests. Please wait a moment.' });
    }

    if (!roomCode) {
      return socket.emit('error', { message: 'Room code is required' });
    }

    const normalizedCode = roomCode.trim().toUpperCase();
    const result = roomManager.joinRoom(normalizedCode, playerId, playerName, socket.id);

    if (!result.success) {
      return socket.emit('error', { message: result.error });
    }

    const room = result.room;
    const finalPlayerId = result.playerId;

    socket.data.playerId = finalPlayerId;
    socket.data.roomCode = normalizedCode;
    socket.join(normalizedCode);

    const player = room.players.get(finalPlayerId);

    if (result.reconnected) {
      socket.emit('room_joined', {
        playerId: finalPlayerId,
        room: roomManager.getRoomSnapshot(room, finalPlayerId),
        reconnected: true
      });

      socket.to(normalizedCode).emit('player_reconnected', {
        playerId: finalPlayerId,
        playerName: player.name
      });
    } else {
      socket.emit('room_joined', {
        playerId: finalPlayerId,
        room: roomManager.getRoomSnapshot(room, finalPlayerId)
      });

      socket.to(normalizedCode).emit('player_joined', {
        player: { id: finalPlayerId, name: player.name, connected: true, isHost: finalPlayerId === room.hostId },
        room: roomManager.getRoomSnapshot(room)
      });
    }
  });

  // START GAME (Host only)
  socket.on('start_game', ({ roomCode }) => {
    const code = roomCode || socket.data.roomCode;
    const room = roomManager.getRoom(code);

    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }

    if (socket.data.playerId !== room.hostId) {
      return socket.emit('error', { message: 'Only the host can start the game' });
    }

    if (room.status !== 'lobby') {
      return socket.emit('error', { message: 'Game has already started' });
    }

    if (room.players.size < 2) {
      return socket.emit('error', { message: 'At least 2 players are required to start the game' });
    }

    room.status = 'playing';
    room.totalRounds = room.players.size;
    room.currentRound = 1;
    room.wordSetterOrder = Array.from(room.players.keys());
    room.currentWordSetterIndex = 0;
    room.currentWord = null;
    room.roundGuesses.clear();
    room.roundResults = null;

    const setterId = room.wordSetterOrder[0];
    const setter = room.players.get(setterId);

    io.to(room.code).emit('game_started', {
      round: 1,
      totalRounds: room.totalRounds,
      wordSetter: { id: setter.id, name: setter.name },
      players: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name }))
    });

    // Notify word setter directly
    if (setter.socketId) {
      io.to(setter.socketId).emit('set_word_prompt', {
        round: 1,
        message: 'You are the Word Setter! Choose a 5-letter word for the other players to guess.'
      });
    }
  });

  // SUBMIT WORD (Word Setter only)
  socket.on('submit_word', ({ roomCode, word }) => {
    const code = roomCode || socket.data.roomCode;
    const room = roomManager.getRoom(code);

    if (!room || room.status !== 'playing') {
      return socket.emit('error', { message: 'No active game in this room' });
    }

    const currentSetterId = room.wordSetterOrder[room.currentWordSetterIndex];
    if (socket.data.playerId !== currentSetterId) {
      return socket.emit('error', { message: 'Only the current word setter can submit the word' });
    }

    if (room.currentWord) {
      return socket.emit('error', { message: 'Word has already been chosen for this round' });
    }

    if (!word || !isValidWord(word)) {
      return socket.emit('error', { message: 'Word must be exactly 5 alphabetic letters' });
    }

    const cleanWord = word.trim().toLowerCase();
    if (!wordExists(cleanWord)) {
      return socket.emit('error', { message: 'Word is not in the dictionary. Please choose another 5-letter word.' });
    }

    // Set word securely on server
    room.currentWord = cleanWord;

    // Initialize round guesses for all players
    for (const pId of room.players.keys()) {
      const isSetter = pId === currentSetterId;
      room.roundGuesses.set(pId, {
        guesses: [],
        attempts: 0,
        finished: isSetter, // word setter is automatically finished/cannot guess
        solved: false
      });
    }

    const setter = room.players.get(currentSetterId);

    // Notify room that word has been set (NEVER send the secret word!)
    io.to(room.code).emit('word_set', {
      wordSetterName: setter ? setter.name : 'Word Setter'
    });
  });

  // SUBMIT GUESS (Guessers only)
  socket.on('submit_guess', ({ roomCode, word }) => {
    if (!guessLimiter(socket.id)) {
      return socket.emit('error', { message: 'Guessing too quickly. Please pause.' });
    }

    const code = roomCode || socket.data.roomCode;
    const room = roomManager.getRoom(code);

    if (!room || room.status !== 'playing') {
      return socket.emit('error', { message: 'No active round in progress' });
    }

    if (!room.currentWord) {
      return socket.emit('error', { message: 'The word setter has not submitted a word yet' });
    }

    const playerId = socket.data.playerId;
    if (!playerId || !room.players.has(playerId)) {
      return socket.emit('error', { message: 'Player not recognized in this room' });
    }

    const currentSetterId = room.wordSetterOrder[room.currentWordSetterIndex];
    if (playerId === currentSetterId) {
      return socket.emit('error', { message: 'Word setter cannot submit guesses' });
    }

    const guessState = room.roundGuesses.get(playerId);
    if (!guessState || guessState.finished) {
      return socket.emit('error', { message: 'You have already completed your guesses for this round' });
    }

    if (!word || !isValidWord(word)) {
      return socket.emit('error', { message: 'Guess must be exactly 5 letters' });
    }

    const cleanWord = word.trim().toLowerCase();
    if (!wordExists(cleanWord)) {
      return socket.emit('error', { message: 'Word not found in dictionary' });
    }

    // Evaluate guess
    const feedback = evaluateGuess(cleanWord, room.currentWord);
    guessState.guesses.push({ word: cleanWord, feedback });
    guessState.attempts = guessState.guesses.length;

    const isSolved = cleanWord === room.currentWord;
    if (isSolved) {
      guessState.solved = true;
      guessState.finished = true;
    } else if (guessState.attempts >= 5) {
      guessState.finished = true;
    }

    // Send private result back ONLY to guesser
    socket.emit('guess_result', {
      word: cleanWord,
      feedback,
      attempts: guessState.attempts,
      solved: isSolved,
      finished: guessState.finished
    });

    // Check if round should end
    if (isSolved) {
      // Immediate win!
      endRound(io, room, playerId);
    } else {
      // Check if all active guessers are finished
      let allGuessersFinished = true;
      for (const [pId, p] of room.players.entries()) {
        if (pId === currentSetterId) continue; // Setter doesn't guess
        const pGuess = room.roundGuesses.get(pId);
        if (!pGuess || !pGuess.finished) {
          allGuessersFinished = false;
          break;
        }
      }

      if (allGuessersFinished) {
        // Round ends without a winner
        endRound(io, room, null);
      }
    }
  });

  // REQUEST NEXT ROUND (Host only)
  socket.on('request_next_round', ({ roomCode }) => {
    const code = roomCode || socket.data.roomCode;
    const room = roomManager.getRoom(code);

    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }

    if (socket.data.playerId !== room.hostId) {
      return socket.emit('error', { message: 'Only host can start the next round' });
    }

    if (room.currentRound < room.totalRounds) {
      // Advance to next round
      room.currentRound += 1;
      room.currentWordSetterIndex = (room.currentWordSetterIndex + 1) % room.wordSetterOrder.length;
      room.status = 'playing';
      room.currentWord = null;
      room.roundResults = null;
      room.roundGuesses.clear();

      const setterId = room.wordSetterOrder[room.currentWordSetterIndex];
      const setter = room.players.get(setterId);

      io.to(room.code).emit('next_round_started', {
        round: room.currentRound,
        totalRounds: room.totalRounds,
        wordSetter: { id: setter.id, name: setter.name }
      });

      if (setter && setter.socketId) {
        io.to(setter.socketId).emit('set_word_prompt', {
          round: room.currentRound,
          message: 'You are the Word Setter! Choose a 5-letter word for the other players to guess.'
        });
      }
    } else {
      // Game Over
      room.status = 'finished';
      room.finishedAt = new Date();

      const leaderboardList = Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        score: room.leaderboard.get(p.id) || 0
      })).sort((a, b) => b.score - a.score);

      const winner = leaderboardList[0] || null;

      io.to(room.code).emit('game_over', {
        leaderboard: leaderboardList,
        winner
      });
    }
  });

  // REQUEST SKIP ROUND (Host only)
  socket.on('request_skip_round', ({ roomCode }) => {
    const code = roomCode || socket.data.roomCode;
    const room = roomManager.getRoom(code);

    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }

    if (socket.data.playerId !== room.hostId) {
      return socket.emit('error', { message: 'Only host can skip the round' });
    }

    if (room.currentRound < room.totalRounds) {
      room.currentRound += 1;
      room.currentWordSetterIndex = (room.currentWordSetterIndex + 1) % room.wordSetterOrder.length;
      room.status = 'playing';
      room.currentWord = null;
      room.roundResults = null;
      room.roundGuesses.clear();

      const setterId = room.wordSetterOrder[room.currentWordSetterIndex];
      const setter = room.players.get(setterId);

      io.to(room.code).emit('next_round_started', {
        round: room.currentRound,
        totalRounds: room.totalRounds,
        wordSetter: { id: setter.id, name: setter.name },
        skipped: true
      });

      if (setter && setter.socketId) {
        io.to(setter.socketId).emit('set_word_prompt', {
          round: room.currentRound,
          message: 'Previous round was skipped. You are the Word Setter! Choose a 5-letter word.'
        });
      }
    } else {
      room.status = 'finished';
      room.finishedAt = new Date();

      const leaderboardList = Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        score: room.leaderboard.get(p.id) || 0
      })).sort((a, b) => b.score - a.score);

      const winner = leaderboardList[0] || null;

      io.to(room.code).emit('game_over', {
        leaderboard: leaderboardList,
        winner
      });
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const playerId = socket.data.playerId;
    const roomCode = socket.data.roomCode;

    if (!roomCode || !playerId) return;

    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(playerId);
    const playerName = player ? player.name : 'A player';

    const updatedRoom = roomManager.leaveRoom(roomCode, playerId);

    if (updatedRoom) {
      io.to(roomCode).emit('player_left', {
        playerId,
        playerName,
        newHostId: updatedRoom.hostId,
        room: roomManager.getRoomSnapshot(updatedRoom)
      });
    }
  });
}
