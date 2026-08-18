import React from 'react';
import {
  GameState,
  ClientAction,
  BOARD_TILES,
  TileDefinition,
  hasFullMonopoly
} from '@monopoly/shared';
import { Dices, Check, ShoppingBag, ArrowUpCircle, XCircle } from 'lucide-react';
import { triggerHaptic } from '../telegram/tma.js';

interface BottomActionSheetProps {
  gameState: GameState;
  myPlayerId: string;
  selectedTileIndex: number | null;
  onCloseInspect: () => void;
  onSendAction: (action: ClientAction) => void;
}

export const BottomActionSheet: React.FC<BottomActionSheetProps> = ({
  gameState,
  myPlayerId,
  selectedTileIndex,
  onCloseInspect,
  onSendAction
}) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = activePlayer?.id === myPlayerId;
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);

  const inspectedTile: TileDefinition | undefined =
    selectedTileIndex !== null ? BOARD_TILES[selectedTileIndex] : undefined;
  const inspectedPropState =
    selectedTileIndex !== null ? gameState.propertyStates[selectedTileIndex] : undefined;
  const inspectedOwner =
    selectedTileIndex !== null
      ? gameState.players.find((p) => p.properties.includes(selectedTileIndex))
      : undefined;

  const currentTile = myPlayer ? BOARD_TILES[myPlayer.position] : null;
  const canBuyCurrent =
    isMyTurn &&
    gameState.turnPhase === 'AWAITING_ACTION' &&
    currentTile &&
    ['street', 'railroad', 'utility'].includes(currentTile.type) &&
    !gameState.players.some((p) => p.properties.includes(currentTile.index)) &&
    (myPlayer?.balance || 0) >= (currentTile.cost || 0);

  const canUpgradeInspected =
    isMyTurn &&
    gameState.turnPhase === 'AWAITING_ACTION' &&
    inspectedTile &&
    inspectedTile.type === 'street' &&
    inspectedOwner?.id === myPlayerId &&
    hasFullMonopoly(myPlayerId, inspectedTile.group, gameState.propertyStates, gameState.players) &&
    (inspectedPropState?.level || 0) < 5 &&
    (myPlayer?.balance || 0) >= (inspectedTile.houseCost || 0);

  const [multiplier, setMultiplier] = React.useState<number>(1);

  const toggleMultiplier = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    setMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : prev === 3 ? 5 : 1));
  };

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-2xl border-t-2 border-slate-700/80 p-3 pb-6 flex flex-col gap-2.5 z-40 rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
      {/* Inspected Tile Sheet View */}
      {inspectedTile && (
        <div className="bg-white rounded-2xl p-3.5 border-2 border-amber-300 shadow-xl flex flex-col gap-2 relative animate-fade-in text-slate-900">
          <button
            onClick={() => {
              triggerHaptic('light');
              onCloseInspect();
            }}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 p-1 rounded-full transition"
          >
            <XCircle className="w-5 h-5 text-slate-500" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-2xl filter drop-shadow">{inspectedTile.icon || '🏷️'}</span>
            <div>
              <div className="text-sm font-black text-slate-900 leading-none">
                {inspectedTile.name}
              </div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">
                {inspectedOwner
                  ? `Владелец: ${inspectedOwner.displayName}`
                  : 'Свободно для покупки'}
              </div>
            </div>
          </div>

          {/* Rent info table */}
          {inspectedTile.rent && (
            <div className="grid grid-cols-3 gap-1.5 text-xs bg-slate-100 p-2.5 rounded-xl border border-slate-200 font-bold">
              <div className="text-slate-600">
                Базовая: <span className="text-emerald-700">${inspectedTile.rent[0]}</span>
              </div>
              {inspectedTile.rent[1] && (
                <div className="text-slate-600">
                  1 филиал: <span className="text-emerald-700">${inspectedTile.rent[1]}</span>
                </div>
              )}
              {inspectedTile.rent[5] && (
                <div className="text-slate-600">
                  Отель: <span className="text-red-600 font-black">${inspectedTile.rent[5]}</span>
                </div>
              )}
            </div>
          )}

          {/* Upgrade Action inside Inspect */}
          {canUpgradeInspected && (
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onSendAction({ type: 'UPGRADE_PROPERTY', tileIndex: inspectedTile.index });
              }}
              className="w-full py-2.5 btn-3d-blue text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <ArrowUpCircle className="w-4 h-4 text-white" />
              <span>Построить филиал (${inspectedTile.houseCost})</span>
            </button>
          )}
        </div>
      )}

      {/* Main Action Controller */}
      <div className="flex items-center justify-between gap-3">
        {/* Contextual Buy Property Action */}
        {canBuyCurrent && currentTile && (
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onSendAction({ type: 'BUY_PROPERTY', tileIndex: currentTile.index });
            }}
            className="flex-1 py-3.5 btn-3d-green text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <ShoppingBag className="w-5 h-5 text-white" />
            <span>Купить за ${currentTile.cost}</span>
          </button>
        )}

        {/* Big Juicy Arcade 3D Roll Button */}
        {isMyTurn && gameState.turnPhase === 'WAITING_FOR_ROLL' ? (
          <div className="flex-1 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onSendAction({ type: 'ROLL_DICE' });
              }}
              className="flex-1 py-4 btn-3d-red text-white font-black text-lg flex items-center justify-center gap-2.5 active:scale-95 tracking-wide drop-shadow-md cursor-pointer"
            >
              <Dices className="w-7 h-7 text-white animate-bounce" />
              <span className="font-display">БРОСОК</span>
            </button>

            {/* Multiplier Badge Button */}
            <button
              onClick={toggleMultiplier}
              className="px-3.5 py-4 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border-2 border-amber-200 text-slate-950 font-black text-sm rounded-2xl shadow-[0_5px_0_#92400e,0_8px_16px_rgba(245,158,11,0.4)] active:translate-y-1 active:shadow-none transition flex items-center gap-1"
              title="Множитель броска"
            >
              <span className="text-xs">⚡</span>
              <span>x{multiplier}</span>
            </button>
          </div>
        ) : isMyTurn && gameState.turnPhase === 'AWAITING_ACTION' ? (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onSendAction({ type: 'END_TURN' });
            }}
            className="flex-1 py-3.5 btn-3d-blue text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Check className="w-5 h-5" />
            <span>Завершить ход</span>
          </button>
        ) : (
          <div className="w-full py-3.5 bg-slate-800/80 rounded-2xl text-center text-xs font-black text-slate-300 border border-slate-700/60 shadow-inner">
            {gameState.turnPhase === 'GAME_OVER'
              ? '🏆 Игра завершена!'
              : `⏳ Ожидание хода игрока ${activePlayer?.displayName || ''}...`}
          </div>
        )}
      </div>
    </div>
  );
};
