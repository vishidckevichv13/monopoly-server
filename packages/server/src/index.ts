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

app.get('/api/rooms', (req, res) => {
  res.json(roomManager.getRoomList());
});

// Endpoint to send Telegram Bot notification if bot token & chat_id provided
app.post('/api/invite-player', async (req, res) => {
  const { targetTelegramId, inviterName, roomId, botUsername } = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!targetTelegramId || !botToken) {
    return res.json({ success: false, message: 'Bot token or targetTelegramId missing' });
  }

  try {
    const inviteUrl = botUsername
      ? `https://t.me/${botUsername}/app?startapp=${roomId}`
      : `https://t.me/share/url?url=${roomId}`;

    const text = `🎲 *Приглашение в игру Monopoly TMA!*\n\nИгрок *${inviterName || 'Друг'}* пригласил вас в приватное лобби #${roomId}!\n\nНажмите кнопку ниже, чтобы присоединиться к матчу:`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetTelegramId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎮 Присоединиться к игре',
                url: inviteUrl
              }
            ]
          ]
        }
      })
    });

    const data = await response.json();
    return res.json({ success: data.ok, data });
  } catch (error: any) {
    console.error('Failed to send Telegram notification:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // Send initial room list on connection
  socket.emit('room_list', roomManager.getRoomList());

  socket.on('get_rooms', () => {
    socket.emit('room_list', roomManager.getRoomList());
  });

  socket.on('check_active_game', (data: { playerId: string; telegramId?: number }) => {
    const activeRoom = roomManager.getActiveRoomForPlayer(data.playerId, data.telegramId);
    if (activeRoom && activeRoom.gameState) {
      socket.emit('active_game_found', {
        roomId: activeRoom.id,
        roomName: activeRoom.name
      });
    } else {
      socket.emit('no_active_game');
    }
  });

  socket.on('create_room', (data: { player: PlayerState; isPrivate?: boolean; maxPlayers?: number }) => {
    const room = roomManager.createRoom(data.player, socket.id, data.isPrivate ?? true, data.maxPlayers ?? 4);
    socket.join(room.id);
    socket.emit('room_created', { roomId: room.id, inviteCode: room.inviteCode });
    roomManager.broadcastRoom(room);
  });

  socket.on('join_room', (data: { roomId: string; player: PlayerState; autoReady?: boolean }) => {
    const room = roomManager.joinRoom(data.roomId, data.player, socket.id, data.autoReady);
    if (!room) {
      socket.emit('error_message', { message: 'Не удалось найти комнату или она заполнена' });
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

  socket.on('start_matchmaking', (data: { roomId: string; playerId?: string }) => {
    roomManager.startMatchmaking(data.roomId, data.playerId);
  });

  socket.on('cancel_matchmaking', (data: { roomId: string; playerId?: string }) => {
    roomManager.cancelMatchmaking(data.roomId, data.playerId);
  });

  socket.on('add_bot', (data: { roomId: string }) => {
    roomManager.addBot(data.roomId);
  });

  socket.on('remove_bot', (data: { roomId: string; botId: string }) => {
    roomManager.removeBot(data.roomId, data.botId);
  });

  socket.on('start_game', (data: { roomId: string; playerId?: string }) => {
    const success = roomManager.startGame(data.roomId, data.playerId);
    if (!success) {
      socket.emit('error_message', { message: 'Нужно минимум 2 активных игрока для старта' });
    }
  });

  socket.on('game_action', (data: { roomId: string; playerId: string; action: ClientAction }) => {
    roomManager.handleAction(data.roomId, data.playerId, data.action);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
    roomManager.handleSocketDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Monopoly Game Server is running on http://localhost:${PORT}`);
});
