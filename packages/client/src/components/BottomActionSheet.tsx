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
import { PropertyCard, IsometricCoin } from './PropertyCard.js';

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
      {/* Inspected Tile Sheet View with Authentic SVG Card Design */}
      {inspectedTile && (
        <div className="bg-slate-800/95 backdrop-blur-md rounded-3xl p-3 border-2 border-slate-600 shadow-2xl flex flex-col items-center gap-3 relative animate-fade-in text-white">
          <button
            onClick={() => {
              triggerHaptic('light');
              onCloseInspect();
            }}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-full transition z-30 bg-slate-900/60"
          >
            <XCircle className="w-5 h-5 text-slate-300" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            {/* Authentic SVG Card Preview */}
            <div className="transform hover:scale-[1.02] transition">
              <PropertyCard
                tile={inspectedTile}
                owner={inspectedOwner}
                level={inspectedPropState?.level || 0}
                isMortgaged={inspectedPropState?.isMortgaged || false}
                variant="full"
              />
            </div>

            {/* Side Rent & Upgrade Details Table */}
            <div className="flex-1 flex flex-col justify-between gap-2.5 w-full max-w-[280px]">
              {inspectedTile.rent && (
                <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-700 flex flex-col gap-1.5 text-xs font-bold shadow-inner">
                  <div className="text-[11px] text-amber-300 font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>Тарифная сетка</span>
                    <IsometricCoin size={14} />
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
                    <span className="text-slate-400">Базовая аренда:</span>
                    <span className="text-emerald-400 font-black">${inspectedTile.rent[0]}</span>
                  </div>
                  {inspectedTile.rent[1] !== undefined && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
                      <span className="text-slate-400">1 филиал:</span>
                      <span className="text-emerald-400 font-black">${inspectedTile.rent[1]}</span>
                    </div>
                  )}
                  {inspectedTile.rent[2] !== undefined && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
                      <span className="text-slate-400">2 филиала:</span>
                      <span className="text-emerald-400 font-black">${inspectedTile.rent[2]}</span>
                    </div>
                  )}
                  {inspectedTile.rent[3] !== undefined && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
                      <span className="text-slate-400">3 филиала:</span>
                      <span className="text-emerald-400 font-black">${inspectedTile.rent[3]}</span>
                    </div>
                  )}
                  {inspectedTile.rent[4] !== undefined && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
                      <span className="text-slate-400">4 филиала:</span>
                      <span className="text-emerald-400 font-black">${inspectedTile.rent[4]}</span>
                    </div>
                  )}
                  {inspectedTile.rent[5] !== undefined && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Главный офис (Отель):</span>
                      <span className="text-amber-400 font-black">${inspectedTile.rent[5]}</span>
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
                  className="w-full py-3 btn-3d-blue text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition"
                >
                  <ArrowUpCircle className="w-5 h-5 text-white" />
                  <span>Построить филиал (${inspectedTile.houseCost})</span>
                </button>
              )}
            </div>
          </div>
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
