import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './roomManager.js';
import { ClientAction, PlayerState } from '@monopoly/shared';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  socket.on('create_room', (data: { player: PlayerState; isPrivate?: boolean }) => {
    const room = roomManager.createRoom(data.player, socket.id, data.isPrivate);
    socket.join(room.id);
    socket.emit('room_created', { roomId: room.id, inviteCode: room.inviteCode });
    roomManager.broadcastRoom(room);
  });

  socket.on('join_room', (data: { roomId: string; player: PlayerState }) => {
    const room = roomManager.joinRoom(data.roomId, data.player, socket.id);
    if (!room) {
      socket.emit('error_message', { message: 'Не удалось присоединиться к комнате' });
      return;
    }
    socket.join(room.id);
    socket.emit('joined_room', { roomId: room.id });
    roomManager.broadcastRoom(room);
    if (room.gameState) {
      socket.emit('game_state', room.gameState);
    }
  });

  socket.on('leave_room', (data: { roomId: string; playerId: string }) => {
    roomManager.leaveRoom(data.roomId, data.playerId);
    socket.leave(data.roomId);
  });

  socket.on('add_bot', (data: { roomId: string }) => {
    roomManager.addBot(data.roomId);
  });

  socket.on('start_game', (data: { roomId: string }) => {
    const success = roomManager.startGame(data.roomId);
    if (!success) {
      socket.emit('error_message', { message: 'Нужно минимум 2 игрока для старта' });
    }
  });

  socket.on('game_action', (data: { roomId: string; playerId: string; action: ClientAction }) => {
    roomManager.handleAction(data.roomId, data.playerId, data.action);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Monopoly Game Server is running on http://localhost:${PORT}`);
});
