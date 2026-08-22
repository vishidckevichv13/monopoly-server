import React from 'react';
import {
  GameState,
  ClientAction,
  BOARD_TILES,
  TileDefinition,
  COLOR_GROUP_MAP,
  GAME_RULES,
  hasFullMonopoly
} from '@monopoly/shared';
import {
  Dices,
  Check,
  ShoppingBag,
  ArrowUpCircle,
  XCircle,
  ArrowLeftRight,
  Gavel,
  Lock,
  Unlock,
  AlertTriangle,
  Flame,
  MinusCircle
} from 'lucide-react';
import { triggerHaptic } from '../telegram/tma.js';
import { PropertyCard, IsometricCoin } from './PropertyCard.js';

interface BottomActionSheetProps {
  gameState: GameState;
  myPlayerId: string;
  selectedTileIndex: number | null;
  onCloseInspect: () => void;
  onSendAction: (action: ClientAction) => void;
  onOpenTrade: () => void;
}

export const BottomActionSheet: React.FC<BottomActionSheetProps> = ({
  gameState,
  myPlayerId,
  selectedTileIndex,
  onCloseInspect,
  onSendAction,
  onOpenTrade
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
  const isStandingOnUnowned =
    isMyTurn &&
    gameState.turnPhase === 'AWAITING_ACTION' &&
    currentTile &&
    ['street', 'railroad', 'utility'].includes(currentTile.type) &&
    !gameState.players.some((p) => p.properties.includes(currentTile.index));

  const canBuyCurrent = isStandingOnUnowned && (myPlayer?.balance || 0) >= (currentTile?.cost || 0);

  const isInspectedOwner = inspectedOwner?.id === myPlayerId;
  const isInspectedMortgaged = inspectedPropState?.isMortgaged || false;
  const inspectedLevel = inspectedPropState?.level || 0;

  const alreadyUpgradedThisTurn = inspectedTile
    ? (gameState.upgradedTilesThisTurn || []).includes(inspectedTile.index)
    : false;

  const canUpgradeInspected =
    isMyTurn &&
    gameState.turnPhase === 'AWAITING_ACTION' &&
    inspectedTile &&
    inspectedTile.type === 'street' &&
    isInspectedOwner &&
    !isInspectedMortgaged &&
    !alreadyUpgradedThisTurn &&
    hasFullMonopoly(myPlayerId, inspectedTile.group, gameState.propertyStates, gameState.players) &&
    inspectedLevel < 5 &&
    (myPlayer?.balance || 0) >= (inspectedTile.houseCost || 0);

  // Downgrade / sell house
  const canDowngradeInspected =
    isInspectedOwner &&
    inspectedTile &&
    inspectedTile.type === 'street' &&
    inspectedLevel > 0;
  const downgradeRefund = inspectedTile?.houseCost ? Math.round(inspectedTile.houseCost * 0.5) : 0;

  // Mortgage / Unmortgage
  const groupTiles = inspectedTile ? (COLOR_GROUP_MAP[inspectedTile.group] || []) : [];
  const hasBuildingsInGroup = groupTiles.some(
    (idx) => (gameState.propertyStates[idx]?.level || 0) > 0
  );
  const mortgageValue = inspectedTile?.cost ? Math.round(inspectedTile.cost * GAME_RULES.MORTGAGE_PERCENT) : 0;
  const unmortgageCost = inspectedTile?.cost ? Math.round(inspectedTile.cost * GAME_RULES.UNMORTGAGE_FEE_PERCENT) : 0;

  const canMortgageInspected =
    isInspectedOwner &&
    inspectedTile &&
    !isInspectedMortgaged &&
    inspectedLevel === 0 &&
    !hasBuildingsInGroup;

  const canUnmortgageInspected =
    isInspectedOwner &&
    inspectedTile &&
    isInspectedMortgaged &&
    (myPlayer?.balance || 0) >= unmortgageCost;

  const isPlayerInDebt = (myPlayer?.balance || 0) < 0;

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

              {/* Actions inside Inspect: Upgrade, Downgrade, Mortgage, Unmortgage */}
              <div className="flex flex-col gap-1.5 w-full">
                {/* 1 Upgrade per turn limit notice */}
                {alreadyUpgradedThisTurn && isInspectedOwner && !isInspectedMortgaged && inspectedLevel < 5 && (
                  <div className="w-full py-1.5 px-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-[10px] font-bold text-center">
                    ⏳ Улучшено в этом ходу (1 улучшение за ход)
                  </div>
                )}

                {canUpgradeInspected && (
                  <button
                    onClick={() => {
                      triggerHaptic('heavy');
                      onSendAction({ type: 'UPGRADE_PROPERTY', tileIndex: inspectedTile.index });
                    }}
                    className="w-full py-2.5 btn-3d-blue text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition"
                  >
                    <ArrowUpCircle className="w-4 h-4 text-white" />
                    <span>Построить филиал (${inspectedTile.houseCost}M)</span>
                  </button>
                )}

                {canDowngradeInspected && (
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onSendAction({ type: 'DOWNGRADE_PROPERTY', tileIndex: inspectedTile.index });
                    }}
                    className="w-full py-2 bg-amber-700/80 hover:bg-amber-600 text-amber-100 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 border border-amber-500/50 active:scale-95 transition shadow"
                  >
                    <MinusCircle className="w-4 h-4 text-amber-300" />
                    <span>Продать постройку (+${downgradeRefund}M)</span>
                  </button>
                )}

                {canMortgageInspected && (
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onSendAction({ type: 'MORTGAGE_PROPERTY', tileIndex: inspectedTile.index });
                    }}
                    className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 border border-rose-500/50 active:scale-95 transition shadow"
                  >
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Заложить банку (+${mortgageValue}M)</span>
                  </button>
                )}

                {canUnmortgageInspected && (
                  <button
                    onClick={() => {
                      triggerHaptic('heavy');
                      onSendAction({ type: 'UNMORTGAGE_PROPERTY', tileIndex: inspectedTile.index });
                    }}
                    className="w-full py-2 btn-3d-green text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
                  >
                    <Unlock className="w-4 h-4 text-white" />
                    <span>Выкупить из залога (-${unmortgageCost}M)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Warning Banner */}
      {isPlayerInDebt && (
        <div className="w-full bg-red-950/90 border-2 border-red-500/80 rounded-2xl p-2.5 flex items-center justify-between text-white shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-red-200">Задолженность: ${Math.abs(myPlayer?.balance || 0)}M</span>
              <span className="text-[10px] text-red-300">Заложите недвижимость или продайте постройки</span>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onSendAction({ type: 'SURRENDER' });
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow active:scale-95 transition shrink-0"
          >
            Сдаться
          </button>
        </div>
      )}

      {/* Main Action Controller */}
      <div className="flex flex-col gap-2 w-full">
        {/* Contextual Buy Property / Decline to Auction Actions */}
        {isStandingOnUnowned && currentTile && (
          <div className="flex items-center gap-2 w-full">
            <button
              disabled={!canBuyCurrent}
              onClick={() => {
                triggerHaptic('heavy');
                onSendAction({ type: 'BUY_PROPERTY', tileIndex: currentTile.index });
              }}
              className={`flex-1 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg ${
                canBuyCurrent
                  ? 'btn-3d-green text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{canBuyCurrent ? `Купить за $${currentTile.cost}M` : `Не хватает средств`}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                onSendAction({ type: 'DECLINE_BUY_PROPERTY', tileIndex: currentTile.index });
              }}
              className={`flex-1 py-3.5 btn-3d-amber text-slate-950 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-lg ${
                !canBuyCurrent ? 'animate-bounce ring-4 ring-amber-400/50' : ''
              }`}
            >
              <Gavel className="w-4 h-4" />
              <span>На аукцион 🔨</span>
            </button>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2.5 w-full">
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
            !isStandingOnUnowned ? (
              <div className="flex-1 flex items-center gap-2">
                {/* Trade Button available during player's turn */}
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onOpenTrade();
                  }}
                  className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border-2 border-amber-400/60 text-amber-300 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition shadow-md shrink-0"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Обмен 🤝</span>
                </button>

                {/* End Turn Button */}
                <button
                  disabled={isPlayerInDebt}
                  onClick={() => {
                    triggerHaptic('medium');
                    onSendAction({ type: 'END_TURN' });
                  }}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition ${
                    isPlayerInDebt
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      : 'btn-3d-blue text-white cursor-pointer'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  <span>{isPlayerInDebt ? 'Покройте долг' : 'Завершить ход'}</span>
                </button>
              </div>
            ) : null
          ) : gameState.turnPhase === 'AUCTION' ? (
            <div className="w-full py-3 bg-amber-950/50 rounded-2xl text-center text-xs font-black text-amber-300 border border-amber-500/40 flex items-center justify-center gap-2 animate-pulse">
              <Gavel className="w-4 h-4" />
              <span>Идут открытые торги на аукционе...</span>
            </div>
          ) : (
            <div className="w-full py-3.5 bg-slate-800/80 rounded-2xl text-center text-xs font-black text-slate-300 border border-slate-700/60 shadow-inner">
              {gameState.turnPhase === 'GAME_OVER'
                ? '🏆 Игра завершена!'
                : `⏳ Ожидание хода игрока ${activePlayer?.displayName || ''}...`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
