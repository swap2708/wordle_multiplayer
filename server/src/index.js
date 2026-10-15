import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { roomManager } from './rooms/roomManager.js';
import { registerHandlers } from './socket/handlers.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Multiplayer Wordle API',
    activeRooms: roomManager.rooms.size
  });
});

// Check room status endpoint
app.get('/api/room/:code', (req, res) => {
  const code = (req.params.code || '').trim().toUpperCase();
  const room = roomManager.getRoom(code);

  if (!room) {
    return res.json({
      exists: false,
      playerCount: 0,
      maxPlayers: 8,
      status: 'not_found'
    });
  }

  res.json({
    exists: true,
    playerCount: room.players.size,
    maxPlayers: room.maxPlayers,
    status: room.status
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', socket => {
  registerHandlers(io, socket);
});

server.listen(PORT, () => {
  console.log(`Wordle Multiplayer Server running on port ${PORT}`);
  console.log(`Allowed CORS Origin: ${FRONTEND_ORIGIN}`);
});

export { app, server, io };
