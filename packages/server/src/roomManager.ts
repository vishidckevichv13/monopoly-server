import { Server } from 'socket.io';
import {
  GameState,
  PlayerState,
  ClientAction,
  createInitialGameState,
  executeRollDice,
  executeBuyProperty,
  executeUpgradeProperty,
  executeEndTurn,
  executeSurrender,
  BOARD_TILES,
  hasFullMonopoly
} from '@monopoly/shared';

const PLAYER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export interface ActiveRoom {
  id: string;
  name: string;
  hostId: string;
  isPrivate: boolean;
  inviteCode: string;
  maxPlayers: number;
  players: PlayerState[];
  sockets: Map<string, string>; // playerId -> socketId
  gameState: GameState | null;
  timerInterval: any;
  botTurnTimeout: any;
}

export class RoomManager {
  private rooms: Map<string, ActiveRoom> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public createRoom(
    hostPlayer: Omit<PlayerState, 'balance' | 'position' | 'inJail' | 'jailTurns' | 'isBankrupt' | 'doublesRolledCount' | 'properties'>,
    socketId: string,
    isPrivate: boolean = false
  ): ActiveRoom {
    const roomId = 'room_' + Math.random().toString(36).substring(2, 8);
    const inviteCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    const initialHost: PlayerState = {
      ...hostPlayer,
      color: PLAYER_COLORS[0],
      tokenIndex: 0,
      balance: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      doublesRolledCount: 0,
      properties: []
    };

    const room: ActiveRoom = {
      id: roomId,
      name: `Комната ${hostPlayer.displayName}`,
      hostId: hostPlayer.id,
      isPrivate,
      inviteCode,
      maxPlayers: 4,
      players: [initialHost],
      sockets: new Map([[hostPlayer.id, socketId]]),
      gameState: null,
      timerInterval: null,
      botTurnTimeout: null
    };

    this.rooms.set(roomId, room);
    return room;
  }

  public joinRoom(roomId: string, player: PlayerState, socketId: string): ActiveRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.gameState && !room.players.some((p: PlayerState) => p.id === player.id)) {
      return null;
    }

    const existingIdx = room.players.findIndex((p: PlayerState) => p.id === player.id);
    if (existingIdx >= 0) {
      room.sockets.set(player.id, socketId);
      return room;
    }

    if (room.players.length >= room.maxPlayers) {
      return null;
    }

    const colorIndex = room.players.length % PLAYER_COLORS.length;
    const fullPlayer: PlayerState = {
      ...player,
      color: PLAYER_COLORS[colorIndex],
      tokenIndex: colorIndex,
      balance: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      doublesRolledCount: 0,
      properties: []
    };

    room.players.push(fullPlayer);
    room.sockets.set(player.id, socketId);
    return room;
  }

  public leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.sockets.delete(playerId);

    if (room.gameState) {
      // If player leaves active game, surrender them
      room.gameState = executeSurrender(room.gameState, playerId);
      this.broadcastGameState(room);
      this.processBotTurn(room);
    } else {
      // If still in lobby, remove player from list
      room.players = room.players.filter((p) => p.id !== playerId);
      if (room.players.length === 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        if (room.botTurnTimeout) clearTimeout(room.botTurnTimeout);
        this.rooms.delete(roomId);
        return;
      }
      if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
      }
      this.broadcastRoom(room);
    }
  }

  public addBot(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState || room.players.length >= room.maxPlayers) return false;

    const botNames = ['Бот Алекс 🤖', 'Бот Виктория 🤖', 'Бот Макс 🤖'];
    const botIdx = room.players.filter((p: PlayerState) => p.isBot).length;
    const name = botNames[botIdx % botNames.length] || `Бот ${botIdx + 1} 🤖`;
    const botId = 'bot_' + Math.random().toString(36).substring(2, 7);

    const colorIndex = room.players.length % PLAYER_COLORS.length;
    const botPlayer: PlayerState = {
      id: botId,
      username: botId,
      displayName: name,
      avatarUrl: '',
      color: PLAYER_COLORS[colorIndex],
      tokenIndex: colorIndex,
      balance: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      isBot: true,
      doublesRolledCount: 0,
      properties: []
    };

    room.players.push(botPlayer);
    this.broadcastRoom(room);
    return true;
  }

  public startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length < 2) return false;

    room.gameState = createInitialGameState(room.id, room.players, 1500);
    this.startTurnTimer(room);
    this.broadcastGameState(room);

    // If initial player is a bot, start their turn
    this.processBotTurn(room);
    return true;
  }

  public handleAction(roomId: string, playerId: string, action: ClientAction): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return;

    let nextState = room.gameState;

    switch (action.type) {
      case 'ROLL_DICE':
        nextState = executeRollDice(nextState, playerId);
        break;
      case 'BUY_PROPERTY':
        nextState = executeBuyProperty(nextState, playerId, action.tileIndex);
        break;
      case 'UPGRADE_PROPERTY':
        nextState = executeUpgradeProperty(nextState, playerId, action.tileIndex);
        break;
      case 'END_TURN':
        nextState = executeEndTurn(nextState, playerId);
        break;
      case 'SURRENDER':
        nextState = executeSurrender(nextState, playerId);
        break;
      default:
        break;
    }

    room.gameState = nextState;
    this.broadcastGameState(room);

    this.processBotTurn(room);
  }

  public processBotTurn(room: ActiveRoom): void {
    if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') return;

    if (room.botTurnTimeout) {
      clearTimeout(room.botTurnTimeout);
      room.botTurnTimeout = null;
    }

    const activePlayer = room.gameState.players[room.gameState.activePlayerIndex];
    if (!activePlayer || !activePlayer.isBot || activePlayer.isBankrupt) return;

    // Small initial delay before rolling
    room.botTurnTimeout = setTimeout(() => {
      if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') return;
      const bot = room.gameState.players[room.gameState.activePlayerIndex];
      if (!bot || !bot.isBot) return;

      if (room.gameState.turnPhase === 'WAITING_FOR_ROLL') {
        room.gameState = executeRollDice(room.gameState, bot.id);
        this.broadcastGameState(room);

        const diceTotal = room.gameState.lastDiceResult
          ? room.gameState.lastDiceResult.die1 + room.gameState.lastDiceResult.die2
          : 5;

        // Allow token hopping animation to finish on client (160ms per step + pause)
        const hopDuration = Math.max(1200, diceTotal * 170 + 400);

        room.botTurnTimeout = setTimeout(() => {
          if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') return;
          const freshBot = room.gameState.players[room.gameState.activePlayerIndex];
          if (!freshBot || !freshBot.isBot) return;

          // Smart purchase decision on newly landed tile
          const currentPos = freshBot.position;
          const tile = BOARD_TILES[currentPos];

          if (tile && ['street', 'railroad', 'utility'].includes(tile.type) && tile.cost) {
            const isOwned = room.gameState.players.some((p) => p.properties.includes(currentPos));
            // Bot buys unowned property if they have enough balance (reserve $50)
            if (!isOwned && freshBot.balance >= tile.cost) {
              room.gameState = executeBuyProperty(room.gameState, freshBot.id, currentPos);
              this.broadcastGameState(room);
            }
          }

          // Smart upgrade decision (monopolies)
          for (const propIdx of freshBot.properties) {
            const t = BOARD_TILES[propIdx];
            if (
              t &&
              t.houseCost &&
              hasFullMonopoly(freshBot.id, t.group, room.gameState.propertyStates, room.gameState.players)
            ) {
              if (freshBot.balance >= t.houseCost + 150) {
                room.gameState = executeUpgradeProperty(room.gameState, freshBot.id, propIdx);
                this.broadcastGameState(room);
              }
            }
          }

          // Delay before ending turn so logs and results are clearly visible
          room.botTurnTimeout = setTimeout(() => {
            if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') return;
            const endBot = room.gameState.players[room.gameState.activePlayerIndex];
            if (!endBot || !endBot.isBot) return;

            room.gameState = executeEndTurn(room.gameState, endBot.id);
            this.broadcastGameState(room);

            // Process next turn if it's also a bot
            this.processBotTurn(room);
          }, 800);
        }, hopDuration);
      }
    }, 800);
  }

  private startTurnTimer(room: ActiveRoom): void {
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.timerInterval = setInterval(() => {
      if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') {
        if (room.timerInterval) clearInterval(room.timerInterval);
        return;
      }

      room.gameState.turnTimeRemaining -= 1;

      if (room.gameState.turnTimeRemaining <= 0) {
        const activePlayer = room.gameState.players[room.gameState.activePlayerIndex];
        if (room.gameState.turnPhase === 'WAITING_FOR_ROLL') {
          room.gameState = executeRollDice(room.gameState, activePlayer.id);
        } else {
          room.gameState = executeEndTurn(room.gameState, activePlayer.id);
        }
        this.broadcastGameState(room);
        this.processBotTurn(room);
      } else {
        this.io.to(room.id).emit('timer_tick', { remaining: room.gameState.turnTimeRemaining });
      }
    }, 1000);
  }

  public broadcastRoom(room: ActiveRoom): void {
    this.io.to(room.id).emit('room_updated', {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      players: room.players,
      isStarted: !!room.gameState
    });
  }

  public broadcastGameState(room: ActiveRoom): void {
    if (!room.gameState) return;
    this.io.to(room.id).emit('game_state', room.gameState);
  }

  public getRoom(roomId: string): ActiveRoom | undefined {
    return this.rooms.get(roomId);
  }
}
