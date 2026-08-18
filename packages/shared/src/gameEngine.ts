import {
  GameState,
  PlayerState,
  DiceResult,
  GameLogEntry,
  PlayerPropertyState
} from './types.js';
import {
  BOARD_TILES,
  COLOR_GROUP_MAP,
  GO_REWARD,
  JAIL_FINE,
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
  initialBalance: number = 1500
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
    turnTimeRemaining: 30,
    lastDiceResult: null,
    players: initializedPlayers,
    propertyStates: {},
    winnerId: null,
    logs: [
      makeLog('Игра началась! Удачи всем участникам.', 'info')
    ],
    jackpot: 100
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
  propertyStates: Record<number, PlayerPropertyState>,
  players: PlayerState[]
): boolean {
  const groupTiles = COLOR_GROUP_MAP[group];
  if (!groupTiles) return false;

  const player = players.find((p) => p.id === playerId);
  if (!player) return false;

  return groupTiles.every((idx) => player.properties.includes(idx));
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

  if (tile.type === 'street' && tile.rent) {
    if (propState.level === 0) {
      const isMonopoly = hasFullMonopoly(owner.id, tile.group, state.propertyStates, state.players);
      return isMonopoly ? tile.rent[0] * 2 : tile.rent[0];
    }
    return tile.rent[propState.level] || tile.rent[0];
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

export function checkBankruptcyAndWinner(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.isBankrupt);
  if (activePlayers.length <= 1) {
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
  const player = state.players[playerIndex];
  const tile = BOARD_TILES[player.position];
  let updatedState = { ...state };

  if (tile.type === 'go_to_jail') {
    player.position = JAIL_POSITION;
    player.inJail = true;
    player.jailTurns = 3;
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
      makeLog(`${player.displayName} заплатил налог $${tax}`, 'tax', player.id)
    );

    if (player.balance < 0) {
      player.isBankrupt = true;
      updatedState.logs.push(
        makeLog(`${player.displayName} обанкротился на налогах! 💀`, 'bankrupt', player.id)
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
        makeLog(`${player.displayName} забрал джекпот со стоянки: +$${bonus}! 💰`, 'bonus', player.id)
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
      ? `${player.displayName} получил карту «${tile.name}»: +$${picked} 🎁`
      : `${player.displayName} получил карту «${tile.name}»: штраф $${Math.abs(picked)} ⚠️`;
    updatedState.logs.push(makeLog(msg, picked >= 0 ? 'bonus' : 'tax', player.id));

    if (player.balance < 0) {
      player.isBankrupt = true;
      updatedState.logs.push(
        makeLog(`${player.displayName} обанкротился! 💀`, 'bankrupt', player.id)
      );
    }
    updatedState.turnPhase = 'AWAITING_ACTION';
    return checkBankruptcyAndWinner(updatedState);
  }

  if (['street', 'railroad', 'utility'].includes(tile.type)) {
    const owner = updatedState.players.find((p) => p.properties.includes(tile.index));
    if (!owner) {
      // Free property to buy
      updatedState.turnPhase = 'AWAITING_ACTION';
      return updatedState;
    }

    if (owner.id !== player.id) {
      const rent = calculateRent(updatedState, tile.index, diceTotal);
      if (rent > 0) {
        player.balance -= rent;
        owner.balance += rent;
        updatedState.logs.push(
          makeLog(
            `${player.displayName} заплатил $${rent} аренды игроку ${owner.displayName} за «${tile.name}»`,
            'rent',
            player.id
          )
        );

        if (player.balance < 0) {
          player.isBankrupt = true;
          owner.properties.push(...player.properties);
          player.properties = [];
          updatedState.logs.push(
            makeLog(`${player.displayName} обанкротился и отдал всё ${owner.displayName}! 💀`, 'bankrupt', player.id)
          );
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
    players: updatedPlayers,
    lastDiceResult: dice,
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
        makeLog(`${player.displayName} выбросил дубль и выходит из тюрьмы! 🔓`, 'jail', player.id)
      );
    } else {
      player.jailTurns -= 1;
      if (player.jailTurns <= 0) {
        player.inJail = false;
        player.balance -= JAIL_FINE;
        updatedState.logs.push(
          makeLog(`${player.displayName} оплатил штраф $${JAIL_FINE} и вышел из тюрьмы.`, 'jail', player.id)
        );
      } else {
        updatedState.logs.push(
          makeLog(`${player.displayName} остается в тюрьме (осталось ходов: ${player.jailTurns})`, 'jail', player.id)
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
      player.jailTurns = 3;
      player.doublesRolledCount = 0;
      updatedState.turnPhase = 'AWAITING_ACTION';
      updatedState.logs.push(
        makeLog(`${player.displayName} выбросил 3 дубля подряд и отправлен в тюрьму! 👮`, 'jail', player.id)
      );
      return updatedState;
    }
  } else {
    player.doublesRolledCount = 0;
  }

  const oldPos = player.position;
  const newPos = (oldPos + diceTotal) % BOARD_TILES.length;
  player.position = newPos;

  // Passed GO check
  if (newPos < oldPos) {
    player.balance += GO_REWARD;
    updatedState.logs.push(
      makeLog(`${player.displayName} прошел поле СТАРТ и получил $${GO_REWARD}! 🚀`, 'bonus', player.id)
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
    players: updatedPlayers,
    propertyStates: updatedPropertyStates,
    logs: [
      ...state.logs,
      makeLog(`${player.displayName} купил «${tile.name}» за $${tile.cost}! 🏢`, 'buy', player.id)
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
  const levelName = nextLevel === 5 ? 'Отель 🏨' : `Филиал №${nextLevel} 🏠`;

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
        `${player.displayName} построил ${levelName} на «${tile.name}» за $${tile.houseCost}`,
        'buy',
        player.id
      )
    ]
  };
}

export function executeSurrender(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isBankrupt) return state;

  // Mark bankrupt and release all properties to the bank
  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, isBankrupt: true, properties: [] } : p
  );

  const updatedPropertyStates = { ...state.propertyStates };
  player.properties.forEach((propIdx) => {
    delete updatedPropertyStates[propIdx];
  });

  let nextState: GameState = {
    ...state,
    players: updatedPlayers,
    propertyStates: updatedPropertyStates,
    logs: [
      ...state.logs,
      makeLog(`${player.displayName} сдался и покинул игру 🏳️`, 'bankrupt', player.id)
    ]
  };

  // If it was their active turn, pass turn to next player
  if (state.players[state.activePlayerIndex]?.id === playerId) {
    let nextIndex = (state.activePlayerIndex + 1) % updatedPlayers.length;
    let attempts = 0;
    while (updatedPlayers[nextIndex].isBankrupt && attempts < updatedPlayers.length) {
      nextIndex = (nextIndex + 1) % updatedPlayers.length;
      attempts++;
    }
    nextState.activePlayerIndex = nextIndex;
    nextState.turnPhase = 'WAITING_FOR_ROLL';
    nextState.turnTimeRemaining = 30;
    nextState.lastDiceResult = null;
  }

  return checkBankruptcyAndWinner(nextState);
}

export function executeEndTurn(state: GameState, playerId: string): GameState {
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer || activePlayer.id !== playerId) return state;

  if (state.turnPhase === 'WAITING_FOR_ROLL') return state;

  // Next player index that is not bankrupt
  let nextIndex = (state.activePlayerIndex + 1) % state.players.length;
  let attempts = 0;
  while (state.players[nextIndex].isBankrupt && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  const nextPlayer = state.players[nextIndex];

  return {
    ...state,
    turnNumber: state.turnNumber + 1,
    activePlayerIndex: nextIndex,
    turnPhase: 'WAITING_FOR_ROLL',
    turnTimeRemaining: 30,
    lastDiceResult: null,
    logs: [
      ...state.logs,
      makeLog(`Ход переходит к игроку ${nextPlayer.displayName} 🎯`, 'info', nextPlayer.id)
    ]
  };
}
