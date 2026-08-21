import {
  GameState,
  PlayerState,
  DiceResult,
  GameLogEntry,
  PlayerPropertyState,
  AuctionState,
  TradeOffer
} from './types.js';
import {
  BOARD_TILES,
  COLOR_GROUP_MAP,
  GAME_RULES,
  JAIL_POSITION
} from './boardData.js';

function makeLog(
  message: string,
  type: GameLogEntry['type'],
  playerId?: string
): GameLogEntry {
  return {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    playerId,
    message,
    type
  };
}

export function createInitialGameState(
  roomId: string,
  players: Omit<PlayerState, 'balance' | 'position' | 'inJail' | 'jailTurns' | 'isBankrupt' | 'doublesRolledCount' | 'properties'>[],
  initialBalance: number = GAME_RULES.STARTING_BALANCE_CLASSIC
): GameState {
  const initializedPlayers: PlayerState[] = players.map((p) => ({
    ...p,
    balance: initialBalance,
    position: 0,
    inJail: false,
    jailTurns: 0,
    isBankrupt: false,
    doublesRolledCount: 0,
    properties: []
  }));

  return {
    roomId,
    turnNumber: 1,
    activePlayerIndex: 0,
    turnPhase: 'WAITING_FOR_ROLL',
    turnTimeRemaining: GAME_RULES.TURN_TIMEOUT_SECONDS,
    lastDiceResult: null,
    players: initializedPlayers,
    propertyStates: {},
    winnerId: null,
    logs: [
      makeLog('Игра началась! Удачи всем участникам.', 'info')
    ],
    jackpot: 100,
    auctionState: null,
    auctionDoneForTurn: false,
    activeTrade: null
  };
}

export function rollDice(): DiceResult {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return {
    die1,
    die2,
    isDouble: die1 === die2
  };
}

export function hasFullMonopoly(
  playerId: string,
  group: string,
  _propertyStates: Record<number, PlayerPropertyState>,
  players: PlayerState[]
): boolean {
  const groupTiles = COLOR_GROUP_MAP[group];
  if (!groupTiles) return false;

  const player = players.find((p) => p.id === playerId);
  if (!player) return false;

  return groupTiles.every((idx) => player.properties.includes(idx));
}

export function hasFullMonopolyMaxUpgraded(
  playerId: string,
  group: string,
  propertyStates: Record<number, PlayerPropertyState>,
  players: PlayerState[]
): boolean {
  if (!hasFullMonopoly(playerId, group, propertyStates, players)) return false;
  const groupTiles = COLOR_GROUP_MAP[group];
  return groupTiles.every((idx) => {
    const prop = propertyStates[idx];
    return prop && prop.level === 5 && !prop.isMortgaged;
  });
}

export function calculateRent(
  state: GameState,
  tileIndex: number,
  diceTotal: number
): number {
  const tile = BOARD_TILES[tileIndex];
  if (!tile) return 0;

  const propState = state.propertyStates[tileIndex];
  if (!propState || propState.isMortgaged) return 0;

  const owner = state.players.find((p) => p.properties.includes(tileIndex));
  if (!owner) return 0;

  // Правило конкурента: в тюрьме владелец не получает ренту!
  if (owner.inJail && GAME_RULES.JAIL_DISABLES_RENT) {
    return 0;
  }

  if (tile.type === 'street' && tile.rent) {
    const isMonopoly = hasFullMonopoly(owner.id, tile.group, state.propertyStates, state.players);
    if (propState.level === 0) {
      return isMonopoly ? tile.rent[0] * 2 : tile.rent[0];
    }
    
    let baseRent = tile.rent[propState.level] || tile.rent[0];
    // Бонус монополии +20% если на всех карточках группы построен головной офис (отель, level 5)
    if (propState.level === 5 && hasFullMonopolyMaxUpgraded(owner.id, tile.group, state.propertyStates, state.players)) {
      baseRent = Math.round(baseRent * GAME_RULES.MONOPOLY_FULL_HOTEL_BONUS);
    }
    return baseRent;
  }

  if (tile.type === 'railroad' && tile.rent) {
    const ownedRailroads = COLOR_GROUP_MAP['railroad'].filter((idx) =>
      owner.properties.includes(idx)
    ).length;
    const rentIdx = Math.min(ownedRailroads - 1, tile.rent.length - 1);
    return rentIdx >= 0 ? tile.rent[rentIdx] : 25;
  }

  if (tile.type === 'utility' && tile.rent) {
    const ownedUtilities = COLOR_GROUP_MAP['utility'].filter((idx) =>
      owner.properties.includes(idx)
    ).length;
    const multiplier = ownedUtilities > 1 ? (tile.rent[1] || 10) : (tile.rent[0] || 4);
    return diceTotal * multiplier;
  }

  return 0;
}

export function processPlayerBankruptcy(state: GameState, playerId: string, reasonMessage?: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isBankrupt) return state;

  const updatedPropertyStates = { ...state.propertyStates };
  player.properties.forEach((propIdx) => {
    delete updatedPropertyStates[propIdx];
  });

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, isBankrupt: true, properties: [] } : p
  );

  const logs = [...state.logs];
  if (reasonMessage) {
    logs.push(makeLog(reasonMessage, 'bankrupt', player.id));
  }

  const nextState: GameState = {
    ...state,
    players: updatedPlayers,
    propertyStates: updatedPropertyStates,
    logs
  };

  return checkBankruptcyAndWinner(nextState);
}

export function checkBankruptcyAndWinner(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.isBankrupt && !p.isSpectator);
  if (activePlayers.length <= 1 && state.players.length > 0) {
    const winner = activePlayers[0] || state.players[0];
    return {
      ...state,
      turnPhase: 'GAME_OVER',
      winnerId: winner?.id || null,
      logs: [
        ...state.logs,
        makeLog(`🏆 Победитель игры: ${winner?.displayName || 'Игрок'}!`, 'bonus', winner?.id)
      ]
    };
  }
  return state;
}

export function handleTileLanding(
  state: GameState,
  playerIndex: number,
  diceTotal: number
): GameState {
  const players = state.players.map((p) => ({ ...p, properties: [...p.properties] }));
  const player = players[playerIndex];
  const tile = BOARD_TILES[player.position];
  let updatedState: GameState = {
    ...state,
    players,
    propertyStates: { ...state.propertyStates },
    logs: [...state.logs]
  };

  if (tile.type === 'go') {
    updatedState.turnPhase = 'AWAITING_ACTION';
    return updatedState;
  }

  if (tile.type === 'go_to_jail') {
    player.position = JAIL_POSITION;
    player.inJail = true;
    player.jailTurns = GAME_RULES.JAIL_MAX_TURNS;
    player.doublesRolledCount = 0;
    updatedState.turnPhase = 'AWAITING_ACTION';
    updatedState.logs.push(
      makeLog(`${player.displayName} арестован и отправлен в тюрьму! 👮`, 'jail', player.id)
    );
    return updatedState;
  }

  if (tile.type === 'tax' && tile.taxAmount) {
    const tax = tile.taxAmount;
    player.balance -= tax;
    updatedState.jackpot += tax;
    updatedState.logs.push(
      makeLog(`${player.displayName} заплатил налог $${tax}M`, 'tax', player.id)
    );

    if (player.balance < 0) {
      updatedState = processPlayerBankruptcy(
        updatedState,
        player.id,
        `${player.displayName} обанкротился на налогах! Вся недвижимость возвращена банку 💀🏦`
      );
    }
    updatedState.turnPhase = 'AWAITING_ACTION';
    return checkBankruptcyAndWinner(updatedState);
  }

  if (tile.type === 'free_parking') {
    const bonus = updatedState.jackpot;
    if (bonus > 0) {
      player.balance += bonus;
      updatedState.jackpot = 50;
      updatedState.logs.push(
        makeLog(`${player.displayName} забрал джекпот со стоянки: +$${bonus}M! 💰`, 'bonus', player.id)
      );
    }
    updatedState.turnPhase = 'AWAITING_ACTION';
    return updatedState;
  }

  if (tile.type === 'chance' || tile.type === 'chest') {
    const rewards = [50, 100, 150, -50, -100];
    const picked = rewards[Math.floor(Math.random() * rewards.length)];
    player.balance += picked;
    const msg = picked >= 0
      ? `${player.displayName} получил карту «${tile.name}»: +$${picked}M 🎁`
      : `${player.displayName} получил карту «${tile.name}»: штраф $${Math.abs(picked)}M ⚠️`;
    updatedState.logs.push(makeLog(msg, picked >= 0 ? 'bonus' : 'tax', player.id));

    if (player.balance < 0) {
      updatedState = processPlayerBankruptcy(
        updatedState,
        player.id,
        `${player.displayName} обанкротился! Вся недвижимость возвращена банку 💀🏦`
      );
    }
    updatedState.turnPhase = 'AWAITING_ACTION';
    return checkBankruptcyAndWinner(updatedState);
  }

  if (['street', 'railroad', 'utility'].includes(tile.type)) {
    const owner = updatedState.players.find((p) => p.properties.includes(tile.index));
    if (!owner) {
      // Свободная недвижимость для покупки
      updatedState.turnPhase = 'AWAITING_ACTION';
      return updatedState;
    }

    if (owner.id !== player.id) {
      if (owner.inJail && GAME_RULES.JAIL_DISABLES_RENT) {
        updatedState.logs.push(
          makeLog(
            `${player.displayName} попал на «${tile.name}», но владелец ${owner.displayName} в тюрьме (аренда сгорела)! ⛓️`,
            'info',
            player.id
          )
        );
      } else {
        const rent = calculateRent(updatedState, tile.index, diceTotal);
        if (rent > 0) {
          player.balance -= rent;
          owner.balance += rent;
          updatedState.logs.push(
            makeLog(
              `${player.displayName} заплатил $${rent}M аренды игроку ${owner.displayName} за «${tile.name}»`,
              'rent',
              player.id
            )
          );

          if (player.balance < 0) {
            updatedState = processPlayerBankruptcy(
              updatedState,
              player.id,
              `${player.displayName} обанкротился на аренде! Вся недвижимость возвращена банку 💀🏦`
            );
          }
        }
      }
    }
    updatedState.turnPhase = 'AWAITING_ACTION';
    return checkBankruptcyAndWinner(updatedState);
  }

  updatedState.turnPhase = 'AWAITING_ACTION';
  return updatedState;
}

export function executeRollDice(state: GameState, playerId: string): GameState {
  if (state.turnPhase !== 'WAITING_FOR_ROLL' || state.winnerId) {
    return state;
  }

  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer || activePlayer.id !== playerId) {
    return state;
  }

  const dice = rollDice();
  const diceTotal = dice.die1 + dice.die2;
  const updatedPlayers = [...state.players];
  const player = { ...activePlayer };
  updatedPlayers[state.activePlayerIndex] = player;

  let updatedState: GameState = {
    ...state,
    turnTimeRemaining: GAME_RULES.TURN_TIMEOUT_SECONDS,
    players: updatedPlayers,
    lastDiceResult: dice,
    auctionDoneForTurn: false,
    logs: [
      ...state.logs,
      makeLog(
        `${player.displayName} бросил кубики: [${dice.die1}] и [${dice.die2}] ${dice.isDouble ? '🔥 ДУБЛЬ!' : ''}`,
        'dice',
        player.id
      )
    ]
  };

  if (player.inJail) {
    if (dice.isDouble) {
      player.inJail = false;
      player.jailTurns = 0;
      updatedState.logs.push(
        makeLog(`${player.displayName} выбросил дубль и освобожден из тюрьмы! 🔓`, 'jail', player.id)
      );
    } else {
      player.jailTurns -= 1;
      if (player.jailTurns <= 0) {
        player.inJail = false;
        player.balance -= GAME_RULES.JAIL_FINE;
        updatedState.logs.push(
          makeLog(`${player.displayName} отбыл срок, оплатил штраф $${GAME_RULES.JAIL_FINE}M и вышел на свободу.`, 'jail', player.id)
        );
        if (player.balance < 0) {
          updatedState = processPlayerBankruptcy(
            updatedState,
            player.id,
            `${player.displayName} обанкротился на штрафе за выход из тюрьмы! Вся недвижимость возвращена банку 💀🏦`
          );
          updatedState.turnPhase = 'AWAITING_ACTION';
          return checkBankruptcyAndWinner(updatedState);
        }
      } else {
        updatedState.logs.push(
          makeLog(`${player.displayName} остается в тюрьме (попыток осталось: ${player.jailTurns})`, 'jail', player.id)
        );
        updatedState.turnPhase = 'AWAITING_ACTION';
        return updatedState;
      }
    }
  }

  if (dice.isDouble) {
    player.doublesRolledCount += 1;
    if (player.doublesRolledCount >= 3) {
      player.position = JAIL_POSITION;
      player.inJail = true;
      player.jailTurns = GAME_RULES.JAIL_MAX_TURNS;
      player.doublesRolledCount = 0;
      updatedState.turnPhase = 'AWAITING_ACTION';
      updatedState.logs.push(
        makeLog(`${player.displayName} выбросил 3 дубля подряд и арестован! 👮`, 'jail', player.id)
      );
      return updatedState;
    }
  } else {
    player.doublesRolledCount = 0;
  }

  const oldPos = player.position;
  const newPos = (oldPos + diceTotal) % BOARD_TILES.length;
  player.position = newPos;

  // Прохождение или точное попадание на СТАРТ
  if (newPos === 0) {
    player.balance += GAME_RULES.GO_LAND_BONUS;
    updatedState.logs.push(
      makeLog(`${player.displayName} точно приземлился на поле СТАРТ и сорвал джекпот: +$${GAME_RULES.GO_LAND_BONUS}M! 🎯🚀`, 'bonus', player.id)
    );
  } else if (newPos < oldPos) {
    player.balance += GAME_RULES.GO_PASS_REWARD;
    updatedState.logs.push(
      makeLog(`${player.displayName} прошел круг через поле СТАРТ: +$${GAME_RULES.GO_PASS_REWARD}M! 🚀`, 'bonus', player.id)
    );
  }

  return handleTileLanding(updatedState, state.activePlayerIndex, diceTotal);
}

export function executeBuyProperty(
  state: GameState,
  playerId: string,
  tileIndex: number
): GameState {
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer || activePlayer.id !== playerId || activePlayer.position !== tileIndex) {
    return state;
  }

  const tile = BOARD_TILES[tileIndex];
  if (!tile || !tile.cost || !['street', 'railroad', 'utility'].includes(tile.type)) {
    return state;
  }

  const isAlreadyOwned = state.players.some((p) => p.properties.includes(tileIndex));
  if (isAlreadyOwned || activePlayer.balance < tile.cost) {
    return state;
  }

  const updatedPlayers = [...state.players];
  const player = {
    ...activePlayer,
    balance: activePlayer.balance - tile.cost,
    properties: [...activePlayer.properties, tileIndex]
  };
  updatedPlayers[state.activePlayerIndex] = player;

  const updatedPropertyStates = {
    ...state.propertyStates,
    [tileIndex]: { tileIndex, level: 0, isMortgaged: false }
  };

  return {
    ...state,
    auctionDoneForTurn: true,
    players: updatedPlayers,
    propertyStates: updatedPropertyStates,
    logs: [
      ...state.logs,
      makeLog(`${player.displayName} купил «${tile.name}» за $${tile.cost}M! 🏢`, 'buy', player.id)
    ]
  };
}

// ---------------------------------------------------------------------------
// AUCTION SYSTEM
// ---------------------------------------------------------------------------

// Стартовая цена = 75% от стоимости, округляя до 5
export function calculateAuctionStartPrice(tileCost: number): number {
  return Math.max(5, Math.round((tileCost * 0.75) / 5) * 5);
}

export function executeStartAuction(
  state: GameState,
  tileIndex: number
): GameState {
  const tile = BOARD_TILES[tileIndex];
  if (!tile || !tile.cost || !['street', 'railroad', 'utility'].includes(tile.type)) {
    return state;
  }

  const isAlreadyOwned = state.players.some((p) => p.properties.includes(tileIndex));
  if (isAlreadyOwned) {
    return state;
  }

  const startPrice = calculateAuctionStartPrice(tile.cost);
  const eligiblePlayers = state.players.filter((p) => !p.isBankrupt && !p.isSpectator).map((p) => p.id);

  const auctionState: AuctionState = {
    tileIndex,
    currentBid: startPrice,
    highestBidderId: null,
    activeParticipantIds: eligiblePlayers,
    timeRemaining: 15
  };

  return {
    ...state,
    turnPhase: 'AUCTION',
    auctionState,
    auctionDoneForTurn: true,
    logs: [
      ...state.logs,
      makeLog(
        `Открыт аукцион за «${tile.name}»! Стартовая цена: $${startPrice}M 🔨`,
        'auction'
      )
    ]
  };
}

export function executeAuctionBid(
  state: GameState,
  playerId: string,
  amount: number
): GameState {
  if (state.turnPhase !== 'AUCTION' || !state.auctionState) {
    return state;
  }

  const { tileIndex, currentBid, highestBidderId, activeParticipantIds } = state.auctionState;
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isBankrupt || !activeParticipantIds.includes(playerId)) {
    return state;
  }

  // If first bid, player can match starting price if amount >= currentBid; otherwise must be strictly > currentBid
  const isValidBid = highestBidderId === null ? amount >= currentBid : amount > currentBid;
  if (!isValidBid || player.balance < amount) {
    return state;
  }

  const tile = BOARD_TILES[tileIndex];
  const updatedAuction: AuctionState = {
    ...state.auctionState,
    currentBid: amount,
    highestBidderId: playerId,
    timeRemaining: Math.max(state.auctionState.timeRemaining, 8) // Dynamic reset / extension of timer
  };

  return {
    ...state,
    auctionState: updatedAuction,
    logs: [
      ...state.logs,
      makeLog(`${player.displayName} сделал ставку $${amount}M на «${tile?.name || 'недвижимость'}» 🔨`, 'auction', playerId)
    ]
  };
}

export function executeAuctionPass(
  state: GameState,
  playerId: string
): GameState {
  if (state.turnPhase !== 'AUCTION' || !state.auctionState) {
    return state;
  }

  const updatedParticipants = state.auctionState.activeParticipantIds.filter((id) => id !== playerId);
  const player = state.players.find((p) => p.id === playerId);

  let updatedState: GameState = {
    ...state,
    auctionState: {
      ...state.auctionState,
      activeParticipantIds: updatedParticipants
    },
    logs: player
      ? [...state.logs, makeLog(`${player.displayName} спасовал на аукционе 🙅‍♂️`, 'auction', playerId)]
      : state.logs
  };

  // If nobody left or only 1 left who is the highest bidder, finish auction
  if (
    updatedParticipants.length === 0 ||
    (updatedParticipants.length === 1 &&
      state.auctionState.highestBidderId &&
      updatedParticipants[0] === state.auctionState.highestBidderId)
  ) {
    return executeEndAuction(updatedState);
  }

  return updatedState;
}

export function executeEndAuction(state: GameState): GameState {
  if (!state.auctionState) return state;

  const { tileIndex, currentBid, highestBidderId } = state.auctionState;
  const tile = BOARD_TILES[tileIndex];
  let updatedPlayers = [...state.players];
  let updatedPropertyStates = { ...state.propertyStates };
  let logMsg = '';

  if (highestBidderId) {
    const winnerIdx = updatedPlayers.findIndex((p) => p.id === highestBidderId);
    if (winnerIdx >= 0) {
      const winner = updatedPlayers[winnerIdx];
      updatedPlayers[winnerIdx] = {
        ...winner,
        balance: winner.balance - currentBid,
        properties: [...winner.properties, tileIndex]
      };
      updatedPropertyStates[tileIndex] = {
        tileIndex,
        level: 0,
        isMortgaged: false
      };
      logMsg = `🏆 ${winner.displayName} выиграл аукцион за «${tile?.name}» за $${currentBid}M!`;
    }
  } else {
    logMsg = `Аукцион за «${tile?.name}» завершился без ставок. Карточка осталась у банка.`;
  }

  return {
    ...state,
    players: updatedPlayers,
    propertyStates: updatedPropertyStates,
    turnPhase: 'AWAITING_ACTION',
    turnTimeRemaining: GAME_RULES.TURN_TIMEOUT_SECONDS,
    auctionState: null,
    auctionDoneForTurn: true,
    logs: [
      ...state.logs,
      makeLog(logMsg, 'auction', highestBidderId || undefined)
    ]
  };
}

// ---------------------------------------------------------------------------
// TRADE / EXCHANGE SYSTEM
// ---------------------------------------------------------------------------

function hasBuildingsInColorGroup(
  tileIndex: number,
  propertyStates: Record<number, PlayerPropertyState>
): boolean {
  const tile = BOARD_TILES[tileIndex];
  if (!tile) return false;
  const groupTiles = COLOR_GROUP_MAP[tile.group] || [];
  return groupTiles.some((idx) => (propertyStates[idx]?.level || 0) > 0);
}

export function executeProposeTrade(
  state: GameState,
  initiatorId: string,
  targetId: string,
  offerMoney: number,
  offerProperties: number[],
  requestMoney: number,
  requestProperties: number[]
): GameState {
  const activePlayer = state.players[state.activePlayerIndex];
  // Trade is allowed ONLY on the player's own turn in AWAITING_ACTION
  if (!activePlayer || activePlayer.id !== initiatorId || state.turnPhase !== 'AWAITING_ACTION') {
    return state;
  }

  const initiator = state.players.find((p) => p.id === initiatorId);
  const target = state.players.find((p) => p.id === targetId);
  if (!initiator || !target || initiator.isBankrupt || target.isBankrupt || initiatorId === targetId) {
    return state;
  }

  if (initiator.balance < offerMoney || target.balance < requestMoney) {
    return state;
  }

  const ownsAllOffers = offerProperties.every((idx) => initiator.properties.includes(idx));
  const ownsAllRequests = requestProperties.every((idx) => target.properties.includes(idx));
  if (!ownsAllOffers || !ownsAllRequests) {
    return state;
  }

  // Validate no houses/hotels in the group of any traded properties
  const hasBuildingsOnOffers = offerProperties.some((idx) =>
    hasBuildingsInColorGroup(idx, state.propertyStates)
  );
  const hasBuildingsOnRequests = requestProperties.some((idx) =>
    hasBuildingsInColorGroup(idx, state.propertyStates)
  );
  if (hasBuildingsOnOffers || hasBuildingsOnRequests) {
    return state;
  }

  const tradeOffer: TradeOffer = {
    id: 'trade_' + Math.random().toString(36).substring(2, 8),
    initiatorId,
    targetId,
    offerMoney,
    offerProperties,
    requestMoney,
    requestProperties,
    status: 'PENDING',
    createdAt: Date.now()
  };

  return {
    ...state,
    activeTrade: tradeOffer,
    logs: [
      ...state.logs,
      makeLog(
        `${initiator.displayName} предложил сделку игроку ${target.displayName} 🤝`,
        'trade',
        initiatorId
      )
    ]
  };
}

export function executeAcceptTrade(
  state: GameState,
  playerId: string,
  tradeId: string
): GameState {
  if (!state.activeTrade || state.activeTrade.id !== tradeId || state.activeTrade.targetId !== playerId) {
    return state;
  }

  const trade = state.activeTrade;
  const initiatorIdx = state.players.findIndex((p) => p.id === trade.initiatorId);
  const targetIdx = state.players.findIndex((p) => p.id === trade.targetId);
  if (initiatorIdx < 0 || targetIdx < 0) return state;

  const initiator = state.players[initiatorIdx];
  const target = state.players[targetIdx];

  if (initiator.balance < trade.offerMoney || target.balance < trade.requestMoney) {
    return state;
  }

  const ownsAllOffers = trade.offerProperties.every((idx) => initiator.properties.includes(idx));
  const ownsAllRequests = trade.requestProperties.every((idx) => target.properties.includes(idx));
  if (!ownsAllOffers || !ownsAllRequests) {
    return state;
  }

  const updatedPlayers = [...state.players];

  // Transfer initiator items
  const newInitiatorProps = initiator.properties
    .filter((idx) => !trade.offerProperties.includes(idx))
    .concat(trade.requestProperties);

  // Transfer target items
  const newTargetProps = target.properties
    .filter((idx) => !trade.requestProperties.includes(idx))
    .concat(trade.offerProperties);

  updatedPlayers[initiatorIdx] = {
    ...initiator,
    balance: initiator.balance - trade.offerMoney + trade.requestMoney,
    properties: newInitiatorProps
  };

  updatedPlayers[targetIdx] = {
    ...target,
    balance: target.balance - trade.requestMoney + trade.offerMoney,
    properties: newTargetProps
  };

  return {
    ...state,
    players: updatedPlayers,
    activeTrade: null,
    logs: [
      ...state.logs,
      makeLog(
        `Сделка между ${initiator.displayName} и ${target.displayName} успешно заключена! 🤝🎉`,
        'trade'
      )
    ]
  };
}

export function executeRejectTrade(
  state: GameState,
  playerId: string,
  tradeId: string
): GameState {
  if (!state.activeTrade || state.activeTrade.id !== tradeId) {
    return state;
  }

  const trade = state.activeTrade;
  if (trade.targetId !== playerId && trade.initiatorId !== playerId) {
    return state;
  }

  const rejectingPlayer = state.players.find((p) => p.id === playerId);

  return {
    ...state,
    activeTrade: null,
    logs: [
      ...state.logs,
      makeLog(
        `${rejectingPlayer?.displayName || 'Игрок'} отклонил предложение обмена ❌`,
        'trade',
        playerId
      )
    ]
  };
}

export function executeCancelTrade(
  state: GameState,
  playerId: string,
  tradeId: string
): GameState {
  if (!state.activeTrade || state.activeTrade.id !== tradeId || state.activeTrade.initiatorId !== playerId) {
    return state;
  }

  return {
    ...state,
    activeTrade: null,
    logs: [
      ...state.logs,
      makeLog('Предложение обмена отменено инициатором.', 'trade', playerId)
    ]
  };
}

export function executeUpgradeProperty(
  state: GameState,
  playerId: string,
  tileIndex: number
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.properties.includes(tileIndex)) return state;

  const tile = BOARD_TILES[tileIndex];
  if (!tile || tile.type !== 'street' || !tile.houseCost) return state;

  const isMonopoly = hasFullMonopoly(playerId, tile.group, state.propertyStates, state.players);
  if (!isMonopoly) return state;

  const propState = state.propertyStates[tileIndex] || { tileIndex, level: 0, isMortgaged: false };
  if (propState.level >= 5 || player.balance < tile.houseCost || propState.isMortgaged) return state;

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, balance: p.balance - tile.houseCost! } : p
  );

  const nextLevel = propState.level + 1;
  const levelName = nextLevel === 5 ? 'Головной офис (Отель) 🏨' : `Филиал №${nextLevel} 🏠`;

  return {
    ...state,
    players: updatedPlayers,
    propertyStates: {
      ...state.propertyStates,
      [tileIndex]: { ...propState, level: nextLevel }
    },
    logs: [
      ...state.logs,
      makeLog(
        `${player.displayName} построил ${levelName} на «${tile.name}» за $${tile.houseCost}M`,
        'buy',
        player.id
      )
    ]
  };
}

export function executeMortgageProperty(
  state: GameState,
  playerId: string,
  tileIndex: number
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.properties.includes(tileIndex)) return state;

  const tile = BOARD_TILES[tileIndex];
  if (!tile || !tile.cost) return state;

  const propState = state.propertyStates[tileIndex] || { tileIndex, level: 0, isMortgaged: false };
  if (propState.isMortgaged || propState.level > 0) return state;

  // Проверка: нельзя закладывать если на других карточках этой же группы есть постройки
  const groupTiles = COLOR_GROUP_MAP[tile.group] || [];
  const hasBuildingsInGroup = groupTiles.some(
    (idx) => (state.propertyStates[idx]?.level || 0) > 0
  );
  if (hasBuildingsInGroup) return state;

  const mortgageValue = Math.round(tile.cost * GAME_RULES.MORTGAGE_PERCENT);
  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, balance: p.balance + mortgageValue } : p
  );

  return {
    ...state,
    players: updatedPlayers,
    propertyStates: {
      ...state.propertyStates,
      [tileIndex]: { ...propState, isMortgaged: true, mortgageTurnsLeft: GAME_RULES.MORTGAGE_MAX_TURNS }
    },
    logs: [
      ...state.logs,
      makeLog(`${player.displayName} заложил «${tile.name}» банку и получил +$${mortgageValue}M 🏦`, 'info', player.id)
    ]
  };
}

export function executeUnmortgageProperty(
  state: GameState,
  playerId: string,
  tileIndex: number
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.properties.includes(tileIndex)) return state;

  const tile = BOARD_TILES[tileIndex];
  if (!tile || !tile.cost) return state;

  const propState = state.propertyStates[tileIndex];
  if (!propState || !propState.isMortgaged) return state;

  const unmortgageCost = Math.round(tile.cost * GAME_RULES.UNMORTGAGE_FEE_PERCENT);
  if (player.balance < unmortgageCost) return state;

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, balance: p.balance - unmortgageCost } : p
  );

  return {
    ...state,
    players: updatedPlayers,
    propertyStates: {
      ...state.propertyStates,
      [tileIndex]: { ...propState, isMortgaged: false, mortgageTurnsLeft: undefined }
    },
    logs: [
      ...state.logs,
      makeLog(`${player.displayName} выкупил «${tile.name}» из залога за $${unmortgageCost}M 🔓`, 'buy', player.id)
    ]
  };
}

export function executePayJailFine(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.inJail) return state;

  const bailAmount = GAME_RULES.JAIL_BAIL_OUT;
  if (player.balance < bailAmount) return state;

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId
      ? { ...p, balance: p.balance - bailAmount, inJail: false, jailTurns: 0 }
      : p
  );

  return {
    ...state,
    players: updatedPlayers,
    logs: [
      ...state.logs,
      makeLog(`${player.displayName} заплатил залог $${bailAmount}M и вышел на свободу! 🔓`, 'jail', player.id)
    ]
  };
}

export function executeSurrender(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isBankrupt) return state;

  let nextState = processPlayerBankruptcy(
    state,
    playerId,
    `${player.displayName} сдался и покинул игру 🏳️ (недвижимость возвращена банку)`
  );

  if (state.players[state.activePlayerIndex]?.id === playerId) {
    let nextIndex = (state.activePlayerIndex + 1) % nextState.players.length;
    let attempts = 0;
    while (nextState.players[nextIndex].isBankrupt && attempts < nextState.players.length) {
      nextIndex = (nextIndex + 1) % nextState.players.length;
      attempts++;
    }
    nextState.activePlayerIndex = nextIndex;
    nextState.turnPhase = 'WAITING_FOR_ROLL';
    nextState.turnTimeRemaining = GAME_RULES.TURN_TIMEOUT_SECONDS;
    nextState.lastDiceResult = null;
  }

  return checkBankruptcyAndWinner(nextState);
}

export function executeEndTurn(state: GameState, playerId: string): GameState {
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer || activePlayer.id !== playerId) return state;

  if (state.turnPhase === 'WAITING_FOR_ROLL' || state.turnPhase === 'AUCTION') return state;

  let nextIndex = (state.activePlayerIndex + 1) % state.players.length;
  let attempts = 0;
  while ((state.players[nextIndex].isBankrupt || state.players[nextIndex].isSpectator) && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  const nextPlayer = state.players[nextIndex];

  return {
    ...state,
    turnNumber: state.turnNumber + 1,
    activePlayerIndex: nextIndex,
    turnPhase: 'WAITING_FOR_ROLL',
    turnTimeRemaining: GAME_RULES.TURN_TIMEOUT_SECONDS,
    lastDiceResult: null,
    activeTrade: null,
    auctionDoneForTurn: false,
    logs: [
      ...state.logs,
      makeLog(`Ход переходит к игроку ${nextPlayer.displayName} 🎯`, 'info', nextPlayer.id)
    ]
  };
}
