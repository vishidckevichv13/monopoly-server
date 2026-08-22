import { Server } from 'socket.io';
import {
  GameState,
  PlayerState,
  ClientAction,
  createInitialGameState,
  executeRollDice,
  executeBuyProperty,
  executeStartAuction,
  executeAuctionBid,
  executeAuctionPass,
  executeEndAuction,
  executeProposeTrade,
  executeAcceptTrade,
  executeRejectTrade,
  executeCancelTrade,
  executeUpgradeProperty,
  executeDowngradeProperty,
  executeMortgageProperty,
  executeUnmortgageProperty,
  executePayJailFine,
  executeEndTurn,
  executeSurrender,
  getPlayerMortgageableAssets,
  BOARD_TILES,
  GAME_RULES,
  hasFullMonopoly
} from '@monopoly/shared';

const PLAYER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const REALISTIC_BOT_PROFILES = [
  { displayName: 'Алексей Смирнов', username: 'alex_smirnov', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Дарья Ковалёва', username: 'daria_k', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Максим Соколов', username: 'max_sokol', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Никита Морозов', username: 'nikita_m', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Елена Васильева', username: 'elena_v', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Владислав Попов', username: 'vlad_popov', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Алина Новикова', username: 'alina_nov', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Сергей Кузнецов', username: 'sergey_kuz', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Артем Волков', username: 'artem_pro', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Полина Лебедева', username: 'polina_leb', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Илья Федоров', username: 'ilya_fedorov', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Мария Семенова', username: 'maria_sem', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Денис Медведев', username: 'denis_m', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Виктория Орлова', username: 'vika_orlova', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=faces' },
  { displayName: 'Кирилл Зайцев', username: 'kirill_z', avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&h=120&fit=crop&crop=faces' }
];

export interface ActiveRoom {
  id: string;
  name: string;
  hostId: string;
  hostDisplayName: string;
  isPrivate: boolean;
  inviteCode: string;
  maxPlayers: number;
  players: PlayerState[];
  sockets: Map<string, string>; // playerId -> socketId
  gameState: GameState | null;
  timerInterval: any;
  botTurnTimeout: any;
  isSearching: boolean;
  searchTimer: any;
  searchTimeRemaining: number;
  searchElapsedSeconds: number;
  botAddInterval: any;
  autoStartTimer: any;
  autoStartCountdown: number | null;
  createdAt: number;
}

export interface SimulatedRoom {
  id: string;
  name: string;
  hostDisplayName: string;
  maxPlayers: number;
  players: PlayerState[];
  createdAt: number;
  lastUpdate: number;
}

export class RoomManager {
  private rooms: Map<string, ActiveRoom> = new Map();
  private simulatedRooms: Map<string, SimulatedRoom> = new Map();
  private io: Server;
  private simulationInterval: any = null;

  constructor(io: Server) {
    this.io = io;
    this.initSimulatedRooms();
    this.startSimulationLoop();
  }

  private generateUniqueRoomId(): string {
    let id: string;
    let attempts = 0;
    do {
      id = Math.floor(100000 + Math.random() * 900000).toString();
      attempts++;
    } while ((this.rooms.has(id) || this.simulatedRooms.has(id)) && attempts < 100);
    return id;
  }

  private createBotPlayerState(
    usedNames: Set<string>,
    colorIndex: number,
    baseElo: number = 1100
  ): PlayerState {
    const availableProfiles = REALISTIC_BOT_PROFILES.filter((p) => !usedNames.has(p.displayName));
    const profile = availableProfiles.length > 0
      ? availableProfiles[Math.floor(Math.random() * availableProfiles.length)]
      : {
          displayName: `Игрок #${Math.floor(10 + Math.random() * 90)}`,
          username: `player_${Math.floor(100 + Math.random() * 900)}`,
          avatarUrl: undefined
        };

    usedNames.add(profile.displayName);

    const botElo = Math.max(850, Math.min(2200, baseElo - 60 + Math.floor(Math.random() * 140)));
    const botLevel = botElo >= 1600 ? 5 : botElo >= 1300 ? 4 : botElo >= 1100 ? 3 : 2;

    return {
      id: `bot_${Math.random().toString(36).substring(2, 9)}`,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      elo: botElo,
      level: botLevel,
      color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
      tokenIndex: colorIndex % PLAYER_COLORS.length,
      balance: GAME_RULES.STARTING_BALANCE_CLASSIC,
      position: 0,
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      isBot: true,
      isReady: true,
      doublesRolledCount: 0,
      properties: []
    };
  }

  private spawnSimulatedRoom(targetMaxPlayers?: number, initialPlayerCount?: number): SimulatedRoom {
    const roomId = this.generateUniqueRoomId();
    const maxPlayers = targetMaxPlayers || ([2, 3, 4, 4][Math.floor(Math.random() * 4)]);
    const count = initialPlayerCount !== undefined
      ? Math.min(maxPlayers - 1, Math.max(1, initialPlayerCount))
      : (maxPlayers === 2 ? 1 : Math.floor(1 + Math.random() * (maxPlayers - 1)));

    const usedNames = new Set<string>();
    const players: PlayerState[] = [];

    for (let i = 0; i < count; i++) {
      players.push(this.createBotPlayerState(usedNames, i, 1000 + Math.floor(Math.random() * 400)));
    }

    const host = players[0];
    const simRoom: SimulatedRoom = {
      id: roomId,
      name: `Комната ${host.displayName}`,
      hostDisplayName: host.displayName,
      maxPlayers,
      players,
      createdAt: Date.now() - Math.floor(Math.random() * 30000),
      lastUpdate: Date.now()
    };

    this.simulatedRooms.set(roomId, simRoom);
    return simRoom;
  }

  private initSimulatedRooms(): void {
    this.simulatedRooms.clear();
    this.spawnSimulatedRoom(2, 1);
    this.spawnSimulatedRoom(2, 1);
    this.spawnSimulatedRoom(3, 1);
    this.spawnSimulatedRoom(3, 2);
    this.spawnSimulatedRoom(4, 1);
    this.spawnSimulatedRoom(4, 2);
    this.spawnSimulatedRoom(4, 3);
  }

  private startSimulationLoop(): void {
    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = setInterval(() => {
      let changed = false;

      // 1. Process existing simulated rooms
      const simKeys = Array.from(this.simulatedRooms.keys());
      for (const key of simKeys) {
        const room = this.simulatedRooms.get(key);
        if (!room) continue;

        if (room.players.length >= room.maxPlayers) {
          this.simulatedRooms.delete(key);
          changed = true;
          continue;
        }

        if (Math.random() < 0.3) {
          const usedNames = new Set(room.players.map((p) => p.displayName));
          const newBot = this.createBotPlayerState(usedNames, room.players.length, room.players[0]?.elo || 1000);
          room.players.push(newBot);
          room.lastUpdate = Date.now();
          changed = true;
        }
      }

      // 2. Ensure pool size is between 4 and 7 rooms
      if (this.simulatedRooms.size < 5) {
        const need = 5 - this.simulatedRooms.size;
        for (let i = 0; i < need; i++) {
          this.spawnSimulatedRoom();
          changed = true;
        }
      }

      if (changed) {
        this.broadcastRoomList();
      }
    }, 3500);
  }

  public createRoom(
    hostPlayer: Omit<PlayerState, 'balance' | 'position' | 'inJail' | 'jailTurns' | 'isBankrupt' | 'doublesRolledCount' | 'properties'>,
    socketId: string,
    isPrivate: boolean = true,
    maxPlayers: number = 4
  ): ActiveRoom {
    const roomId = this.generateUniqueRoomId();
    const inviteCode = roomId;

    const initialHost: PlayerState = {
      ...hostPlayer,
      elo: hostPlayer.elo || 1000,
      level: hostPlayer.level || 3,
      color: PLAYER_COLORS[0],
      tokenIndex: 0,
      balance: GAME_RULES.STARTING_BALANCE_CLASSIC,
      position: 0,
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      isReady: true,
      doublesRolledCount: 0,
      properties: []
    };

    const room: ActiveRoom = {
      id: roomId,
      name: `Комната ${hostPlayer.displayName}`,
      hostId: hostPlayer.id,
      hostDisplayName: hostPlayer.displayName,
      isPrivate,
      inviteCode,
      maxPlayers: Math.min(4, Math.max(2, maxPlayers || 4)),
      players: [initialHost],
      sockets: new Map([[hostPlayer.id, socketId]]),
      gameState: null,
      timerInterval: null,
      botTurnTimeout: null,
      isSearching: false,
      searchTimer: null,
      searchTimeRemaining: 0,
      searchElapsedSeconds: 0,
      botAddInterval: null,
      autoStartTimer: null,
      autoStartCountdown: null,
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);
    this.broadcastRoomList();
    return room;
  }

  public joinRoom(
    roomId: string,
    player: PlayerState,
    socketId: string,
    autoReady: boolean = false
  ): ActiveRoom | null {
    let room = this.rooms.get(roomId);

    if (!room && this.simulatedRooms.has(roomId)) {
      const simRoom = this.simulatedRooms.get(roomId)!;
      this.simulatedRooms.delete(roomId);

      if (simRoom.players.length >= simRoom.maxPlayers) {
        return null;
      }

      const hostBot = simRoom.players[0];
      room = {
        id: simRoom.id,
        name: simRoom.name,
        hostId: hostBot.id,
        hostDisplayName: hostBot.displayName,
        isPrivate: false,
        inviteCode: simRoom.id,
        maxPlayers: simRoom.maxPlayers,
        players: [...simRoom.players],
        sockets: new Map(),
        gameState: null,
        timerInterval: null,
        botTurnTimeout: null,
        isSearching: false,
        searchTimer: null,
        searchTimeRemaining: 0,
        searchElapsedSeconds: 0,
        botAddInterval: null,
        autoStartTimer: null,
        autoStartCountdown: null,
        createdAt: simRoom.createdAt
      };

      this.rooms.set(roomId, room);
    }

    if (!room) return null;

    const existingIdx = room.players.findIndex(
      (p: PlayerState) =>
        p.id === player.id ||
        (player.telegramId && p.telegramId && String(p.telegramId) === String(player.telegramId)) ||
        (player.telegramId && p.id === `tg_${player.telegramId}`) ||
        (p.telegramId && player.id === `tg_${p.telegramId}`) ||
        (player.id && p.id && String(p.id) === String(player.id))
    );

    if (existingIdx >= 0) {
      const existingPlayer = room.players[existingIdx];
      room.sockets.set(existingPlayer.id, socketId);
      room.sockets.set(player.id, socketId);
      if (autoReady) {
        room.players[existingIdx].isReady = true;
      }
      this.broadcastRoom(room);
      if (room.gameState) {
        this.broadcastGameState(room);
      }
      return room;
    }

    const isGameActive = !!room.gameState;
    const activeCount = room.players.filter((p) => !p.isSpectator).length;

    if (isGameActive || activeCount >= room.maxPlayers) {
      return null;
    }

    const colorIndex = room.players.length % PLAYER_COLORS.length;
    const fullPlayer: PlayerState = {
      ...player,
      elo: player.elo || 1000,
      level: player.level || 3,
      color: PLAYER_COLORS[colorIndex],
      tokenIndex: colorIndex,
      balance: GAME_RULES.STARTING_BALANCE_CLASSIC,
      position: 0,
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      isReady: autoReady || true,
      isSpectator: false,
      doublesRolledCount: 0,
      properties: []
    };

    room.players.push(fullPlayer);
    room.sockets.set(player.id, socketId);

    const nonSpectators = room.players.filter((p) => !p.isSpectator);
    if (nonSpectators.length >= room.maxPlayers) {
      if (room.searchTimer) clearInterval(room.searchTimer);
      if (room.botAddInterval) clearTimeout(room.botAddInterval);
      room.searchTimer = null;
      room.botAddInterval = null;
      room.isSearching = false;
      this.startAutoStartCountdown(room);
    }

    this.broadcastRoom(room);
    this.broadcastRoomList();
    return room;
  }

  public leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.sockets.delete(playerId);

    const player = room.players.find((p) => p.id === playerId);
    const isSpectator = player?.isSpectator;

    if (room.gameState) {
      if (isSpectator) {
        room.players = room.players.filter((p) => p.id !== playerId);
        room.gameState.players = room.gameState.players.filter((p) => p.id !== playerId);
      } else {
        room.gameState = executeSurrender(room.gameState, playerId);
      }
      this.broadcastGameState(room);
      this.processBotTurn(room);
    } else {
      room.players = room.players.filter((p: PlayerState) => p.id !== playerId);
      if (room.hostId === playerId && room.players.length > 0) {
        room.hostId = room.players[0].id;
        room.hostDisplayName = room.players[0].displayName;
      }
      this.broadcastRoom(room);
    }

    // Keep active games running for bot simulation / spectators
    const hasRemainingActiveBots =
      room.gameState &&
      room.gameState.turnPhase !== 'GAME_OVER' &&
      room.gameState.players.filter((p: PlayerState) => !p.isBankrupt).length >= 2;

    const hasConnectedSockets = room.sockets.size > 0;

    if (!hasRemainingActiveBots && (!hasConnectedSockets || (room.gameState && room.gameState.turnPhase === 'GAME_OVER'))) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.botTurnTimeout) clearTimeout(room.botTurnTimeout);
      if (room.searchTimer) clearInterval(room.searchTimer);
      if (room.botAddInterval) clearTimeout(room.botAddInterval);
      if (room.autoStartTimer) clearInterval(room.autoStartTimer);
      this.rooms.delete(roomId);
    }

    this.broadcastRoomList();
  }

  public handleSocketDisconnect(socketId: string): void {
    this.rooms.forEach((room, roomId) => {
      let disconnectedPlayerId: string | null = null;
      for (const [pId, sId] of room.sockets.entries()) {
        if (sId === socketId) {
          disconnectedPlayerId = pId;
          break;
        }
      }

      if (disconnectedPlayerId) {
        room.sockets.delete(disconnectedPlayerId);

        // If in game, bots continue playing
        if (room.gameState && room.gameState.turnPhase !== 'GAME_OVER') {
          this.processBotTurn(room);
        } else if (!room.gameState) {
          // In lobby, remove disconnected player
          this.leaveRoom(roomId, disconnectedPlayerId);
        }
      }
    });
  }

  public addBot(roomId: string): boolean {
    return this.addRealisticBot(roomId);
  }

  public addRealisticBot(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    const nonSpectators = room ? room.players.filter((p) => !p.isSpectator) : [];
    if (!room || room.gameState || nonSpectators.length >= room.maxPlayers) {
      return false;
    }

    const host = room.players.find((p) => p.id === room.hostId) || room.players[0];
    const hostElo = host?.elo || 1000;
    const usedNames = new Set(room.players.map((p) => p.displayName));
    const botPlayer = this.createBotPlayerState(usedNames, room.players.length, hostElo);

    room.players.push(botPlayer);
    this.broadcastRoom(room);
    this.broadcastRoomList();
    return true;
  }

  public removeBot(roomId: string, botId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState) return false;

    const hadBot = room.players.some((p: PlayerState) => p.id === botId && p.isBot);
    if (!hadBot) return false;

    room.players = room.players.filter((p: PlayerState) => p.id !== botId);
    this.broadcastRoom(room);
    this.broadcastRoomList();
    return true;
  }

  public startMatchmaking(roomId: string, hostPlayerId?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState || (hostPlayerId && room.hostId !== hostPlayerId)) {
      return false;
    }

    if (room.isSearching) return true;

    room.isSearching = true;
    room.isPrivate = false;
    room.searchElapsedSeconds = 0;
    room.searchTimeRemaining = 35;

    if (room.searchTimer) clearInterval(room.searchTimer);
    if (room.botAddInterval) clearTimeout(room.botAddInterval);
    if (room.autoStartTimer) clearInterval(room.autoStartTimer);
    room.autoStartCountdown = null;

    this.broadcastRoom(room);
    this.broadcastRoomList();

    room.searchTimer = setInterval(() => {
      const current = this.rooms.get(roomId);
      if (!current || current.gameState || !current.isSearching) {
        if (room.searchTimer) clearInterval(room.searchTimer);
        return;
      }

      const activeCount = current.players.filter((p) => !p.isSpectator).length;
      if (activeCount >= current.maxPlayers) {
        clearInterval(current.searchTimer);
        current.searchTimer = null;
        current.isSearching = false;
        this.startAutoStartCountdown(current);
        this.broadcastRoom(current);
        this.broadcastRoomList();
        return;
      }

      current.searchElapsedSeconds += 1;

      if (current.searchElapsedSeconds >= 2 && current.searchElapsedSeconds % 3 === 0) {
        this.addRealisticBot(current.id);
        const newCount = current.players.filter((p) => !p.isSpectator).length;
        if (newCount >= current.maxPlayers) {
          clearInterval(current.searchTimer);
          current.searchTimer = null;
          current.isSearching = false;
          this.startAutoStartCountdown(current);
          this.broadcastRoom(current);
          this.broadcastRoomList();
          return;
        }
      }

      this.broadcastRoom(current);
    }, 1000);

    return true;
  }

  public cancelMatchmaking(roomId: string, hostPlayerId?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || (hostPlayerId && room.hostId !== hostPlayerId)) {
      return false;
    }

    room.isSearching = false;
    room.isPrivate = true;
    room.searchElapsedSeconds = 0;
    room.searchTimeRemaining = 0;

    if (room.searchTimer) clearInterval(room.searchTimer);
    if (room.botAddInterval) clearTimeout(room.botAddInterval);
    if (room.autoStartTimer) clearInterval(room.autoStartTimer);
    room.searchTimer = null;
    room.botAddInterval = null;
    room.autoStartTimer = null;
    room.autoStartCountdown = null;

    this.broadcastRoom(room);
    this.broadcastRoomList();
    return true;
  }

  private startAutoStartCountdown(room: ActiveRoom): void {
    if (room.autoStartTimer || room.gameState) return;

    room.autoStartCountdown = 3;
    this.broadcastRoom(room);

    room.autoStartTimer = setInterval(() => {
      const current = this.rooms.get(room.id);
      if (!current || current.gameState) {
        if (room.autoStartTimer) clearInterval(room.autoStartTimer);
        return;
      }

      if (current.autoStartCountdown !== null && current.autoStartCountdown > 1) {
        current.autoStartCountdown -= 1;
        this.broadcastRoom(current);
      } else {
        clearInterval(current.autoStartTimer);
        current.autoStartTimer = null;
        current.autoStartCountdown = null;
        this.startGame(current.id);
      }
    }, 1000);
  }

  public startGame(roomId: string, hostPlayerId?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || (hostPlayerId && room.hostId !== hostPlayerId)) {
      return false;
    }

    const activePlayers = room.players.filter((p) => !p.isSpectator);
    if (activePlayers.length < 2) {
      return false;
    }

    if (room.searchTimer) clearInterval(room.searchTimer);
    if (room.botAddInterval) clearTimeout(room.botAddInterval);
    if (room.autoStartTimer) clearInterval(room.autoStartTimer);
    room.isSearching = false;
    room.autoStartCountdown = null;

    room.gameState = createInitialGameState(roomId, activePlayers, GAME_RULES.STARTING_BALANCE_CLASSIC);
    this.startTurnTimer(room);
    this.broadcastGameState(room);
    this.broadcastRoomList();

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
      case 'DECLINE_BUY_PROPERTY':
        nextState = executeStartAuction(nextState, action.tileIndex);
        break;
      case 'AUCTION_BID':
        nextState = executeAuctionBid(nextState, playerId, action.amount);
        break;
      case 'AUCTION_PASS':
        nextState = executeAuctionPass(nextState, playerId);
        break;
      case 'PROPOSE_TRADE':
        nextState = executeProposeTrade(
          nextState,
          playerId,
          action.targetPlayerId,
          action.offerMoney,
          action.offerProperties,
          action.requestMoney,
          action.requestProperties
        );
        break;
      case 'ACCEPT_TRADE':
        nextState = executeAcceptTrade(nextState, playerId, action.tradeId);
        break;
      case 'REJECT_TRADE':
        nextState = executeRejectTrade(nextState, playerId, action.tradeId);
        break;
      case 'CANCEL_TRADE':
        nextState = executeCancelTrade(nextState, playerId, action.tradeId);
        break;
      case 'UPGRADE_PROPERTY':
        nextState = executeUpgradeProperty(nextState, playerId, action.tileIndex);
        break;
      case 'DOWNGRADE_PROPERTY':
        nextState = executeDowngradeProperty(nextState, playerId, action.tileIndex);
        break;
      case 'MORTGAGE_PROPERTY':
        nextState = executeMortgageProperty(nextState, playerId, action.tileIndex);
        break;
      case 'UNMORTGAGE_PROPERTY':
        nextState = executeUnmortgageProperty(nextState, playerId, action.tileIndex);
        break;
      case 'PAY_JAIL_FINE':
        nextState = executePayJailFine(nextState, playerId);
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

  public isControlledByBot(room: ActiveRoom, player: PlayerState): boolean {
    if (player.isBot) return true;
    return !room.sockets.has(player.id);
  }

  public getActiveRoomForPlayer(playerId: string, telegramId?: number, cachedRoomId?: string): ActiveRoom | undefined {
    // 1. If client provided cachedRoomId, check it first
    if (cachedRoomId && this.rooms.has(cachedRoomId)) {
      const room = this.rooms.get(cachedRoomId);
      if (room && room.gameState && room.gameState.turnPhase !== 'GAME_OVER') {
        const isPlayerInRoom = room.players.some(
          (p) =>
            !p.isBankrupt &&
            !p.isSpectator &&
            (p.id === playerId ||
              (telegramId && p.telegramId && String(p.telegramId) === String(telegramId)) ||
              (telegramId && p.id === `tg_${telegramId}`) ||
              (p.telegramId && playerId === `tg_${p.telegramId}`) ||
              (playerId && p.id && String(p.id) === String(playerId)))
        );
        if (isPlayerInRoom) return room;
      }
    }

    // 2. Search through all active rooms
    for (const room of this.rooms.values()) {
      if (room.gameState && room.gameState.turnPhase !== 'GAME_OVER') {
        const found = room.players.some(
          (p) =>
            !p.isBankrupt &&
            !p.isSpectator &&
            (p.id === playerId ||
              (telegramId && p.telegramId && String(p.telegramId) === String(telegramId)) ||
              (telegramId && p.id === `tg_${telegramId}`) ||
              (p.telegramId && playerId === `tg_${p.telegramId}`) ||
              (playerId && p.id && String(p.id) === String(playerId)))
        );
        if (found) return room;
      }
    }
    return undefined;
  }

  public processBotTurn(room: ActiveRoom): void {
    if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') return;

    if (room.botTurnTimeout) {
      clearTimeout(room.botTurnTimeout);
      room.botTurnTimeout = null;
    }

    // Handle Bot in Auction
    if (room.gameState.turnPhase === 'AUCTION' && room.gameState.auctionState) {
      const auction = room.gameState.auctionState;
      const tile = BOARD_TILES[auction.tileIndex];
      const botParticipants = room.gameState.players.filter(
        (p: PlayerState) => this.isControlledByBot(room, p) && !p.isBankrupt && auction.activeParticipantIds.includes(p.id)
      );

      if (botParticipants.length > 0) {
        room.botTurnTimeout = setTimeout(() => {
          if (!room.gameState || room.gameState.turnPhase !== 'AUCTION' || !room.gameState.auctionState) return;
          const currentAuction = room.gameState.auctionState;
          const bot = botParticipants[Math.floor(Math.random() * botParticipants.length)];
          if (!bot || !currentAuction.activeParticipantIds.includes(bot.id)) return;

          const maxWillingPrice = tile && tile.cost ? Math.min(tile.cost * 1.1, bot.balance - 100) : 0;
          const nextBid = currentAuction.currentBid + (currentAuction.highestBidderId ? 10 : 0);

          if (nextBid <= maxWillingPrice && currentAuction.highestBidderId !== bot.id) {
            room.gameState = executeAuctionBid(room.gameState, bot.id, nextBid);
          } else {
            room.gameState = executeAuctionPass(room.gameState, bot.id);
          }

          this.broadcastGameState(room);
          this.processBotTurn(room);
        }, 1100 + Math.random() * 600);
      }
      return;
    }

    // Handle Bot in Active Trade Offer
    if (room.gameState.activeTrade) {
      const trade = room.gameState.activeTrade;
      const targetBot = room.gameState.players.find(
        (p: PlayerState) => p.id === trade.targetId && this.isControlledByBot(room, p)
      );
      if (targetBot) {
        room.botTurnTimeout = setTimeout(() => {
          if (!room.gameState || !room.gameState.activeTrade) return;
          const offerVal = trade.offerMoney + trade.offerProperties.reduce((acc, idx) => acc + (BOARD_TILES[idx]?.cost || 0), 0);
          const reqVal = trade.requestMoney + trade.requestProperties.reduce((acc, idx) => acc + (BOARD_TILES[idx]?.cost || 0), 0);
          if (offerVal >= reqVal && targetBot.balance >= trade.requestMoney) {
            room.gameState = executeAcceptTrade(room.gameState, targetBot.id, trade.id);
          } else {
            room.gameState = executeRejectTrade(room.gameState, targetBot.id, trade.id);
          }
          this.broadcastGameState(room);
          this.processBotTurn(room);
        }, 1200);
        return;
      }
    }

    const activePlayer = room.gameState.players[room.gameState.activePlayerIndex];
    if (!activePlayer || !this.isControlledByBot(room, activePlayer) || activePlayer.isBankrupt) {
      return;
    }

    // Bot rolling dice (1.0 - 1.4s delay for natural turn start)
    if (room.gameState.turnPhase === 'WAITING_FOR_ROLL') {
      room.botTurnTimeout = setTimeout(() => {
        if (!room.gameState || room.gameState.turnPhase !== 'WAITING_FOR_ROLL') return;
        const currentBot = room.gameState.players[room.gameState.activePlayerIndex];
        if (!currentBot || !this.isControlledByBot(room, currentBot) || currentBot.isBankrupt) return;

        if (currentBot.inJail && currentBot.balance >= GAME_RULES.JAIL_FINE) {
          room.gameState = executePayJailFine(room.gameState, currentBot.id);
        }

        room.gameState = executeRollDice(room.gameState, currentBot.id);
        this.broadcastGameState(room);
        this.processBotTurn(room);
      }, 1000 + Math.random() * 400);
      return;
    }

    // Bot tile decision (1.8s - 2.2s delay to give client smooth hopping animation time)
    if (room.gameState.turnPhase === 'AWAITING_ACTION') {
      room.botTurnTimeout = setTimeout(() => {
        if (!room.gameState || room.gameState.turnPhase !== 'AWAITING_ACTION') return;
        let currentBot = room.gameState.players[room.gameState.activePlayerIndex];
        if (!currentBot || !this.isControlledByBot(room, currentBot) || currentBot.isBankrupt) return;

        const currentPos = currentBot.position;
        const tile = BOARD_TILES[currentPos];
        const isUnowned =
          !room.gameState.auctionDoneForTurn &&
          tile &&
          ['street', 'railroad', 'utility'].includes(tile.type) &&
          !room.gameState.players.some((p: PlayerState) => p.properties.includes(currentPos));

        if (isUnowned && tile.cost && currentBot.balance >= tile.cost + 100) {
          room.gameState = executeBuyProperty(room.gameState, currentBot.id, currentPos);
        } else if (isUnowned) {
          room.gameState = executeStartAuction(room.gameState, currentPos);
        }

        // If bot is in debt, auto-mortgage or downgrade to clear debt
        currentBot = room.gameState.players[room.gameState.activePlayerIndex];
        if (currentBot && currentBot.balance < 0) {
          const assets = getPlayerMortgageableAssets(room.gameState, currentBot.id);
          for (const pIdx of assets.canDowngrade) {
            if ((room.gameState.players.find((p) => p.id === currentBot.id)?.balance || 0) >= 0) break;
            room.gameState = executeDowngradeProperty(room.gameState, currentBot.id, pIdx);
          }
          for (const pIdx of assets.canMortgage) {
            if ((room.gameState.players.find((p) => p.id === currentBot.id)?.balance || 0) >= 0) break;
            room.gameState = executeMortgageProperty(room.gameState, currentBot.id, pIdx);
          }
        }

        // Bot property upgrade logic (if monopoly and extra cash)
        currentBot = room.gameState.players[room.gameState.activePlayerIndex];
        if (room.gameState.turnPhase === 'AWAITING_ACTION' && currentBot && currentBot.balance > 200) {
          for (const pIdx of currentBot.properties) {
            const propTile = BOARD_TILES[pIdx];
            if (
              propTile &&
              propTile.houseCost &&
              hasFullMonopoly(currentBot.id, propTile.group, room.gameState.propertyStates, room.gameState.players) &&
              currentBot.balance >= propTile.houseCost + 200 &&
              !room.gameState.upgradedTilesThisTurn?.includes(pIdx)
            ) {
              const pState = room.gameState.propertyStates[pIdx];
              if (!pState || pState.level < 5) {
                room.gameState = executeUpgradeProperty(room.gameState, currentBot.id, pIdx);
                break;
              }
            }
          }
        }

        this.broadcastGameState(room);

        // Conclude bot turn with 1.0s delay
        setTimeout(() => {
          if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') return;
          const endBot = room.gameState.players[room.gameState.activePlayerIndex];
          if (!endBot || !this.isControlledByBot(room, endBot)) return;

          room.gameState = executeEndTurn(room.gameState, endBot.id);
          this.broadcastGameState(room);
          this.processBotTurn(room);
        }, 1000);
      }, 1800 + Math.random() * 300);
    }
  }

  private startTurnTimer(room: ActiveRoom): void {
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.timerInterval = setInterval(() => {
      if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') {
        if (room.timerInterval) clearInterval(room.timerInterval);
        return;
      }

      // Handle Auction Phase Timer
      if (room.gameState.turnPhase === 'AUCTION' && room.gameState.auctionState) {
        room.gameState.auctionState.timeRemaining -= 1;
        if (room.gameState.auctionState.timeRemaining <= 0) {
          room.gameState = executeEndAuction(room.gameState);
          this.broadcastGameState(room);
          this.processBotTurn(room);
        } else {
          this.io.to(room.id).emit('timer_tick', {
            turnTimeRemaining: room.gameState.turnTimeRemaining,
            auctionTimeRemaining: room.gameState.auctionState.timeRemaining
          });
        }
        return;
      }

      room.gameState.turnTimeRemaining -= 1;

      if (room.gameState.turnTimeRemaining <= 0) {
        const activePlayer = room.gameState.players[room.gameState.activePlayerIndex];
        if (room.gameState.turnPhase === 'WAITING_FOR_ROLL') {
          room.gameState = executeRollDice(room.gameState, activePlayer.id);
        } else if (room.gameState.turnPhase === 'AWAITING_ACTION') {
          const currentPos = activePlayer.position;
          const currentTile = BOARD_TILES[currentPos];
          const isUnowned =
            !room.gameState.auctionDoneForTurn &&
            currentTile &&
            ['street', 'railroad', 'utility'].includes(currentTile.type) &&
            !room.gameState.players.some((p: PlayerState) => p.properties.includes(currentPos));

          if (isUnowned) {
            room.gameState = executeStartAuction(room.gameState, currentPos);
          } else {
            room.gameState = executeEndTurn(room.gameState, activePlayer.id);
          }
        } else {
          room.gameState = executeEndTurn(room.gameState, activePlayer.id);
        }
        this.broadcastGameState(room);
        this.processBotTurn(room);
      } else {
        this.io.to(room.id).emit('timer_tick', {
          turnTimeRemaining: room.gameState.turnTimeRemaining,
          auctionTimeRemaining: room.gameState.auctionState ? room.gameState.auctionState.timeRemaining : null
        });
      }
    }, 1000);
  }

  public broadcastRoom(room: ActiveRoom): void {
    this.io.to(room.id).emit('room_updated', {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      isPrivate: room.isPrivate,
      maxPlayers: room.maxPlayers,
      players: room.players,
      isStarted: !!room.gameState,
      isSearching: room.isSearching,
      searchTimeRemaining: room.searchTimeRemaining,
      searchElapsedSeconds: room.searchElapsedSeconds,
      autoStartCountdown: room.autoStartCountdown
    });
  }

  public broadcastRoomList(): void {
    this.io.emit('room_list', this.getRoomList());
  }

  public broadcastGameState(room: ActiveRoom): void {
    if (!room.gameState) return;
    this.io.to(room.id).emit('game_state', room.gameState);
  }

  public getRoom(roomId: string): ActiveRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomList(): any[] {
    const list: any[] = [];

    // 1. Add active real rooms
    this.rooms.forEach((room) => {
      const activeCount = room.players.filter((p) => !p.isSpectator).length;
      if (!room.gameState && activeCount < room.maxPlayers && (!room.isPrivate || room.isSearching)) {
        list.push({
          id: room.id,
          name: room.name,
          hostDisplayName: room.hostDisplayName,
          playerCount: activeCount,
          maxPlayers: room.maxPlayers,
          isGameStarted: !!room.gameState,
          isPrivate: room.isPrivate,
          isSearching: room.isSearching,
          createdAt: room.createdAt
        });
      }
    });

    // 2. Add simulated bot rooms (only non-full)
    this.simulatedRooms.forEach((simRoom) => {
      if (simRoom.players.length < simRoom.maxPlayers) {
        list.push({
          id: simRoom.id,
          name: simRoom.name,
          hostDisplayName: simRoom.hostDisplayName,
          playerCount: simRoom.players.length,
          maxPlayers: simRoom.maxPlayers,
          isGameStarted: false,
          isPrivate: false,
          isSearching: true,
          createdAt: simRoom.createdAt
        });
      }
    });

    return list.sort((a, b) => b.createdAt - a.createdAt);
  }
}
