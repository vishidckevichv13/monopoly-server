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
  executeMortgageProperty,
  executeUnmortgageProperty,
  executePayJailFine,
  executeEndTurn,
  executeSurrender,
  BOARD_TILES,
  GAME_RULES,
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

  private generateUniqueRoomId(): string {
    let id: string;
    let attempts = 0;
    do {
      id = Math.floor(100000 + Math.random() * 900000).toString();
      attempts++;
    } while (this.rooms.has(id) && attempts < 100);
    return id;
  }

  public createRoom(
    hostPlayer: Omit<PlayerState, 'balance' | 'position' | 'inJail' | 'jailTurns' | 'isBankrupt' | 'doublesRolledCount' | 'properties'>,
    socketId: string,
    isPrivate: boolean = false
  ): ActiveRoom {
    const roomId = this.generateUniqueRoomId();
    const inviteCode = roomId;

    const initialHost: PlayerState = {
      ...hostPlayer,
      color: PLAYER_COLORS[0],
      tokenIndex: 0,
      balance: GAME_RULES.STARTING_BALANCE_CLASSIC,
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
      balance: GAME_RULES.STARTING_BALANCE_CLASSIC,
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
      room.gameState = executeSurrender(room.gameState, playerId);
      this.broadcastGameState(room);
    } else {
      room.players = room.players.filter((p: PlayerState) => p.id !== playerId);
      if (room.hostId === playerId && room.players.length > 0) {
        room.hostId = room.players[0].id;
      }
      this.broadcastRoom(room);
    }

    if (room.players.length === 0 || (room.gameState && room.players.every((p: PlayerState) => p.isBot || p.isBankrupt))) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.botTurnTimeout) clearTimeout(room.botTurnTimeout);
      this.rooms.delete(roomId);
    }
  }

  public addBot(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState || room.players.length >= room.maxPlayers) {
      return false;
    }

    const botNumber = room.players.filter((p: PlayerState) => p.isBot).length + 1;
    const colorIndex = room.players.length % PLAYER_COLORS.length;
    const botPlayer: PlayerState = {
      id: `bot_${Math.random().toString(36).substring(2, 7)}`,
      username: `bot_${botNumber}`,
      displayName: `Сбер AI #${botNumber}`,
      color: PLAYER_COLORS[colorIndex],
      tokenIndex: colorIndex,
      balance: GAME_RULES.STARTING_BALANCE_CLASSIC,
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

  public removeBot(roomId: string, botId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState) return false;

    const hadBot = room.players.some((p: PlayerState) => p.id === botId && p.isBot);
    if (!hadBot) return false;

    room.players = room.players.filter((p: PlayerState) => p.id !== botId);
    this.broadcastRoom(room);
    return true;
  }

  public startGame(roomId: string, hostPlayerId?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || (hostPlayerId && room.hostId !== hostPlayerId) || room.players.length < 2) {
      return false;
    }

    room.gameState = createInitialGameState(roomId, room.players, GAME_RULES.STARTING_BALANCE_CLASSIC);
    this.startTurnTimer(room);
    this.broadcastGameState(room);

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
        (p: PlayerState) => p.isBot && !p.isBankrupt && auction.activeParticipantIds.includes(p.id)
      );

      if (botParticipants.length > 0) {
        // Schedule bot auction decision
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
        }, 1200 + Math.random() * 1000);
      }
      return;
    }

    // Handle Bot in Active Trade Offer (if target is a bot)
    if (room.gameState.activeTrade) {
      const trade = room.gameState.activeTrade;
      const targetBot = room.gameState.players.find((p: PlayerState) => p.id === trade.targetId && p.isBot);
      if (targetBot) {
        room.botTurnTimeout = setTimeout(() => {
          if (!room.gameState || !room.gameState.activeTrade) return;
          // Simple bot logic: accept if receiving money >= 0 and not losing vital monopoly
          const offerVal = trade.offerMoney + trade.offerProperties.reduce((acc, idx) => acc + (BOARD_TILES[idx]?.cost || 0), 0);
          const reqVal = trade.requestMoney + trade.requestProperties.reduce((acc, idx) => acc + (BOARD_TILES[idx]?.cost || 0), 0);
          if (offerVal >= reqVal && targetBot.balance >= trade.requestMoney) {
            room.gameState = executeAcceptTrade(room.gameState, targetBot.id, trade.id);
          } else {
            room.gameState = executeRejectTrade(room.gameState, targetBot.id, trade.id);
          }
          this.broadcastGameState(room);
        }, 1500);
        return;
      }
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

        const hopDuration = Math.max(1200, diceTotal * 170 + 400);

        room.botTurnTimeout = setTimeout(() => {
          if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') return;
          const freshBot = room.gameState.players[room.gameState.activePlayerIndex];
          if (!freshBot || !freshBot.isBot) return;

          // Purchase decision on newly landed tile
          const currentPos = freshBot.position;
          const tile = BOARD_TILES[currentPos];

          if (tile && ['street', 'railroad', 'utility'].includes(tile.type) && tile.cost) {
            const isOwned = room.gameState.players.some((p: PlayerState) => p.properties.includes(currentPos));
            if (!isOwned) {
              if (freshBot.balance >= tile.cost) {
                room.gameState = executeBuyProperty(room.gameState, freshBot.id, currentPos);
                this.broadcastGameState(room);
              } else {
                // If bot cannot afford to buy, decline and start auction
                room.gameState = executeStartAuction(room.gameState, currentPos);
                this.broadcastGameState(room);
                this.processBotTurn(room);
                return;
              }
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

          // Delay before ending turn
          room.botTurnTimeout = setTimeout(() => {
            if (!room.gameState || room.gameState.turnPhase === 'GAME_OVER') return;
            const endBot = room.gameState.players[room.gameState.activePlayerIndex];
            if (!endBot || !endBot.isBot) return;

            room.gameState = executeEndTurn(room.gameState, endBot.id);
            this.broadcastGameState(room);

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
          // If player landed on an unowned property and timer ran out, start auction!
          const currentPos = activePlayer.position;
          const currentTile = BOARD_TILES[currentPos];
          const isUnowned =
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

  public getRoomList(): any[] {
    const list: any[] = [];
    this.rooms.forEach((room) => {
      if (!room.isPrivate && !room.gameState) {
        list.push({
          id: room.id,
          name: room.name,
          playerCount: room.players.length,
          maxPlayers: room.maxPlayers,
          isGameStarted: !!room.gameState,
          isPrivate: room.isPrivate
        });
      }
    });
    return list;
  }
}
