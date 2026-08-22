export type ColorGroup =
  | 'brown'
  | 'light_blue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dark_blue'
  | 'railroad'
  | 'utility'
  | 'special';

export type TileType =
  | 'street'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'chance'
  | 'chest'
  | 'go'
  | 'jail'
  | 'free_parking'
  | 'go_to_jail';

export interface TileDefinition {
  index: number;
  name: string;
  type: TileType;
  group: ColorGroup;
  cost?: number;
  rent?: number[]; // [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
  houseCost?: number;
  mortgage?: number;
  taxAmount?: number;
  icon?: string;
  brandColor?: string;
  accentColor?: string;
  ticker?: string;
}

export interface PlayerPropertyState {
  tileIndex: number;
  level: number; // 0: base, 1-4: houses, 5: hotel
  isMortgaged: boolean;
  mortgageTurnsLeft?: number;
}

export interface PlayerState {
  id: string;
  telegramId?: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  tokenIndex: number;
  balance: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  isBankrupt: boolean;
  isBot: boolean;
  doublesRolledCount: number;
  properties: number[]; // tile indices owned
  elo?: number;
  level?: number;
  isReady?: boolean;
  isSpectator?: boolean;
}

export type TurnPhase =
  | 'WAITING_FOR_ROLL'
  | 'RESOLVING_TILE'
  | 'AWAITING_ACTION'
  | 'AUCTION'
  | 'TURN_ENDED'
  | 'GAME_OVER';

export interface DiceResult {
  die1: number;
  die2: number;
  isDouble: boolean;
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  playerId?: string;
  message: string;
  type: 'info' | 'dice' | 'buy' | 'rent' | 'jail' | 'bankrupt' | 'bonus' | 'tax' | 'auction' | 'trade';
}

export interface AuctionState {
  tileIndex: number;
  currentBid: number;
  highestBidderId: string | null;
  activeParticipantIds: string[]; // Player IDs who haven't passed
  timeRemaining: number; // Seconds left in auction
}

export interface TradeOffer {
  id: string;
  initiatorId: string;
  targetId: string;
  offerMoney: number;
  offerProperties: number[];
  requestMoney: number;
  requestProperties: number[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: number;
}

export interface GameState {
  roomId: string;
  turnNumber: number;
  activePlayerIndex: number;
  turnPhase: TurnPhase;
  turnTimeRemaining: number;
  lastDiceResult: DiceResult | null;
  players: PlayerState[];
  propertyStates: Record<number, PlayerPropertyState>;
  winnerId: string | null;
  logs: GameLogEntry[];
  jackpot: number;
  auctionState: AuctionState | null;
  auctionDoneForTurn?: boolean;
  activeTrade: TradeOffer | null;
  upgradedTilesThisTurn?: number[];
}

export interface RoomSettings {
  maxPlayers: number;
  turnDurationSec: number;
  initialBalance: number;
  isPrivate: boolean;
  inviteCode?: string;
}

export interface RoomSummary {
  id: string;
  name: string;
  hostDisplayName: string;
  playerCount: number;
  maxPlayers: number;
  isGameStarted: boolean;
  isPrivate: boolean;
  isSearching: boolean;
  createdAt: number;
}

export interface RoomState {
  id: string;
  name: string;
  hostId: string;
  isPrivate: boolean;
  maxPlayers: number;
  players: PlayerState[];
  isStarted: boolean;
  isSearching: boolean;
  searchTimeRemaining?: number;
  searchElapsedSeconds?: number;
  autoStartCountdown?: number | null;
}

export interface TimerTickPayload {
  turnTimeRemaining: number;
  auctionTimeRemaining?: number | null;
}

// Client to Server Action Payloads
export type ClientAction =
  | { type: 'ROLL_DICE' }
  | { type: 'BUY_PROPERTY'; tileIndex: number }
  | { type: 'DECLINE_BUY_PROPERTY'; tileIndex: number }
  | { type: 'AUCTION_BID'; amount: number }
  | { type: 'AUCTION_PASS' }
  | {
      type: 'PROPOSE_TRADE';
      targetPlayerId: string;
      offerMoney: number;
      offerProperties: number[];
      requestMoney: number;
      requestProperties: number[];
    }
  | { type: 'ACCEPT_TRADE'; tradeId: string }
  | { type: 'REJECT_TRADE'; tradeId: string }
  | { type: 'CANCEL_TRADE'; tradeId: string }
  | { type: 'UPGRADE_PROPERTY'; tileIndex: number }
  | { type: 'DOWNGRADE_PROPERTY'; tileIndex: number }
  | { type: 'MORTGAGE_PROPERTY'; tileIndex: number }
  | { type: 'UNMORTGAGE_PROPERTY'; tileIndex: number }
  | { type: 'PAY_JAIL_FINE' }
  | { type: 'END_TURN' }
  | { type: 'SURRENDER' };
