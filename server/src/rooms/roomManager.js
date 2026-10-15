import { isValidRoomCode, sanitizeDisplayName } from '../utils/validation.js';

/**
 * Generates a unique 6-character uppercase alphanumeric room code.
 * @param {Map} existingRooms
 * @returns {string}
 */
function generateUniqueCode(existingRooms) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingRooms.has(code));
  return code;
}

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room

    // Cleanup finished rooms older than 30 minutes every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Cleans up finished rooms that have been inactive for > 30 minutes.
   */
  cleanup() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (room.status === 'finished') {
        const finishedAt = room.finishedAt ? new Date(room.finishedAt).getTime() : new Date(room.createdAt).getTime();
        if (now - finishedAt > 30 * 60 * 1000) {
          this.rooms.delete(code);
        }
      }
    }
  }

  /**
   * Creates a new room with the given host player.
   * @param {string} hostPlayerId
   * @param {string} hostName
   * @returns {{ roomCode: string, room: Object }}
   */
  createRoom(hostPlayerId, hostName) {
    const roomCode = generateUniqueCode(this.rooms);
    const cleanHostName = sanitizeDisplayName(hostName) || 'Host';

    const hostPlayer = {
      id: hostPlayerId,
      name: cleanHostName,
      socketId: null,
      connected: true,
      joinedAt: new Date(),
      disconnectedAt: null
    };

    const playersMap = new Map();
    playersMap.set(hostPlayerId, hostPlayer);

    const leaderboardMap = new Map();
    leaderboardMap.set(hostPlayerId, 0);

    const room = {
      code: roomCode,
      hostId: hostPlayerId,
      players: playersMap,
      status: 'lobby', // 'lobby' | 'playing' | 'finished'
      maxPlayers: 8,
      currentRound: 0,
      totalRounds: 0,
      wordSetterOrder: [],
      currentWordSetterIndex: 0,
      currentWord: null, // NEVER sent to clients
      roundGuesses: new Map(), // playerId -> GuessState
      roundResults: null,
      leaderboard: leaderboardMap,
      createdAt: new Date(),
      finishedAt: null
    };

    this.rooms.set(roomCode, room);
    return { roomCode, room };
  }

  /**
   * Allows a player to join an existing room or reconnect.
   * @param {string} roomCode
   * @param {string} playerId
   * @param {string} playerName
   * @param {string|null} socketId
   * @returns {{ success: boolean, error?: string, room: Object|null, playerId?: string, reconnected?: boolean }}
   */
  joinRoom(roomCode, playerId, playerName, socketId = null) {
    if (!roomCode || typeof roomCode !== 'string') {
      return { success: false, error: 'Invalid room code', room: null };
    }

    const normalizedCode = roomCode.trim().toUpperCase();
    if (!isValidRoomCode(normalizedCode)) {
      return { success: false, error: 'Invalid room code format (must be 6 alphanumeric characters)', room: null };
    }

    const room = this.rooms.get(normalizedCode);
    if (!room) {
      return { success: false, error: 'Room not found', room: null };
    }

    // Check if player is reconnecting
    if (playerId && room.players.has(playerId)) {
      const existingPlayer = room.players.get(playerId);
      existingPlayer.connected = true;
      existingPlayer.disconnectedAt = null;
      if (socketId) existingPlayer.socketId = socketId;
      if (playerName) {
        const cleanName = sanitizeDisplayName(playerName);
        if (cleanName) existingPlayer.name = cleanName;
      }
      return { success: true, reconnected: true, playerId, room };
    }

    // New player joining
    if (room.status !== 'lobby') {
      return { success: false, error: 'Game is already in progress', room: null };
    }

    if (room.players.size >= room.maxPlayers) {
      return { success: false, error: 'Room is full (maximum 8 players)', room: null };
    }

    const cleanName = sanitizeDisplayName(playerName) || `Player ${room.players.size + 1}`;
    const newPlayerId = playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newPlayer = {
      id: newPlayerId,
      name: cleanName,
      socketId,
      connected: true,
      joinedAt: new Date(),
      disconnectedAt: null
    };

    room.players.set(newPlayerId, newPlayer);
    room.leaderboard.set(newPlayerId, 0);

    return { success: true, reconnected: false, playerId: newPlayerId, room };
  }

  /**
   * Handles player leaving a room.
   * @param {string} roomCode
   * @param {string} playerId
   * @returns {Object|null} - Updated room or null if room is deleted
   */
  leaveRoom(roomCode, playerId) {
    if (!roomCode) return null;
    const normalizedCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(normalizedCode);
    if (!room || !room.players.has(playerId)) return null;

    if (room.status === 'lobby') {
      // Remove from room entirely in lobby
      room.players.delete(playerId);
      room.leaderboard.delete(playerId);

      // If room is empty, delete it
      if (room.players.size === 0) {
        this.rooms.delete(normalizedCode);
        return null;
      }

      // If host left, elect the first remaining player as new host
      if (room.hostId === playerId) {
        const nextHostId = room.players.keys().next().value;
        room.hostId = nextHostId;
      }
      return room;
    } else {
      // Game in progress or finished: mark as disconnected
      const player = room.players.get(playerId);
      if (player) {
        player.connected = false;
        player.disconnectedAt = new Date();
        player.socketId = null;
      }

      // If host disconnected during game, elect another connected player as host if possible
      if (room.hostId === playerId) {
        for (const [id, p] of room.players.entries()) {
          if (p.connected) {
            room.hostId = id;
            break;
          }
        }
      }

      // If all players disconnected in a finished game, delete room
      const anyConnected = Array.from(room.players.values()).some(p => p.connected);
      if (!anyConnected && room.status === 'finished') {
        this.rooms.delete(normalizedCode);
        return null;
      }

      return room;
    }
  }

  /**
   * Gets a room by its code.
   * @param {string} roomCode
   * @returns {Object|null}
   */
  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.trim().toUpperCase()) || null;
  }

  /**
   * Finds the room containing a player.
   * @param {string} playerId
   * @returns {{ roomCode: string, room: Object } | null}
   */
  getRoomForPlayer(playerId) {
    if (!playerId) return null;
    for (const [roomCode, room] of this.rooms.entries()) {
      if (room.players.has(playerId)) {
        return { roomCode, room };
      }
    }
    return null;
  }

  /**
   * Finds the room containing a socketId.
   * @param {string} socketId
   * @returns {{ roomCode: string, room: Object, player: Object } | null}
   */
  getRoomForSocket(socketId) {
    if (!socketId) return null;
    for (const [roomCode, room] of this.rooms.entries()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          return { roomCode, room, player };
        }
      }
    }
    return null;
  }

  /**
   * Generates a safe client snapshot of the room.
   * CRITICAL: Never include `currentWord` or other players' private guesses during active round.
   * @param {Object} room
   * @param {string|null} requestingPlayerId
   * @returns {Object}
   */
  getRoomSnapshot(room, requestingPlayerId = null) {
    if (!room) return null;

    const playersList = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      isHost: p.id === room.hostId
    }));

    // Build leaderboard array sorted descending by score
    const leaderboardList = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: room.leaderboard.get(p.id) || 0
    })).sort((a, b) => b.score - a.score);

    // Current word setter info
    let currentWordSetter = null;
    if (room.wordSetterOrder && room.wordSetterOrder.length > 0) {
      const setterId = room.wordSetterOrder[room.currentWordSetterIndex];
      const setter = room.players.get(setterId);
      if (setter) {
        currentWordSetter = { id: setter.id, name: setter.name };
      }
    }

    // Only include private guesses for the requesting player if round is active
    let myGuessState = null;
    if (requestingPlayerId && room.roundGuesses.has(requestingPlayerId)) {
      myGuessState = room.roundGuesses.get(requestingPlayerId);
    }

    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      maxPlayers: room.maxPlayers,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      players: playersList,
      leaderboard: leaderboardList,
      wordSetter: currentWordSetter,
      wordIsSet: Boolean(room.currentWord),
      myGuessState: myGuessState || { guesses: [], attempts: 0, finished: false, solved: false },
      roundResults: room.roundResults
    };
  }
}

export const roomManager = new RoomManager();
