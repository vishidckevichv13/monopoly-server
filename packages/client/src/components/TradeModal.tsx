import React, { useState } from 'react';
import { GameState, ClientAction, BOARD_TILES, COLOR_GROUP_MAP } from '@monopoly/shared';
import { ArrowLeftRight, Check, X, ShieldAlert, Plus, Minus, UserCheck } from 'lucide-react';
import { IsometricCoin } from './PropertyCard.js';
import { triggerHaptic } from '../telegram/tma.js';

interface TradeModalProps {
  gameState: GameState;
  myPlayerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSendAction: (action: ClientAction) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  gameState,
  myPlayerId,
  isOpen,
  onClose,
  onSendAction
}) => {
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const activeTrade = gameState.activeTrade;

  // Other non-bankrupt players available for trade
  const otherPlayers = gameState.players.filter(
    (p) => p.id !== myPlayerId && !p.isBankrupt
  );

  const [targetPlayerId, setTargetPlayerId] = useState<string>(
    otherPlayers[0]?.id || ''
  );
  const [offerMoney, setOfferMoney] = useState<number>(0);
  const [offerProperties, setOfferProperties] = useState<number[]>([]);
  const [requestMoney, setRequestMoney] = useState<number>(0);
  const [requestProperties, setRequestProperties] = useState<number[]>([]);

  const targetPlayer = gameState.players.find((p) => p.id === targetPlayerId);

  // Check if any property in group has buildings
  const isPropertyLockedByBuildings = (tileIndex: number) => {
    const tile = BOARD_TILES[tileIndex];
    if (!tile) return false;
    const groupTiles = COLOR_GROUP_MAP[tile.group] || [];
    return groupTiles.some((idx) => (gameState.propertyStates[idx]?.level || 0) > 0);
  };

  const handleToggleOfferProp = (idx: number) => {
    if (isPropertyLockedByBuildings(idx)) return;
    triggerHaptic('light');
    setOfferProperties((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleToggleRequestProp = (idx: number) => {
    if (isPropertyLockedByBuildings(idx)) return;
    triggerHaptic('light');
    setRequestProperties((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handlePropose = () => {
    if (!targetPlayerId) return;
    triggerHaptic('heavy');
    onSendAction({
      type: 'PROPOSE_TRADE',
      targetPlayerId,
      offerMoney,
      offerProperties,
      requestMoney,
      requestProperties
    });
    onClose();
  };

  // 1. If there's an active trade where I am the TARGET
  if (activeTrade && activeTrade.targetId === myPlayerId) {
    const initiator = gameState.players.find((p) => p.id === activeTrade.initiatorId);
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
        <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white shadow"
                style={{ backgroundColor: initiator?.color || '#3B82F6' }}
              />
              <span className="font-black text-sm">
                Предложение от {initiator?.displayName}
              </span>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
              Сделка 🤝
            </span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* What you will receive */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex flex-col gap-1.5">
              <span className="text-emerald-300 font-black uppercase text-[10px] tracking-wider">
                Вам предлагают:
              </span>
              {activeTrade.offerMoney > 0 && (
                <div className="flex items-center gap-1.5 font-black text-white text-sm">
                  <span>+${activeTrade.offerMoney}M</span>
                  <IsometricCoin size={18} />
                </div>
              )}
              {activeTrade.offerProperties.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeTrade.offerProperties.map((idx) => {
                    const t = BOARD_TILES[idx];
                    return (
                      <span
                        key={idx}
                        className="bg-slate-800/90 px-2 py-0.5 rounded-md font-bold text-slate-200 border border-slate-700"
                      >
                        {t?.name}
                      </span>
                    );
                  })}
                </div>
              ) : activeTrade.offerMoney === 0 ? (
                <span className="text-slate-400 italic">Ничего</span>
              ) : null}
            </div>

            {/* What they ask in return */}
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-1.5">
              <span className="text-amber-300 font-black uppercase text-[10px] tracking-wider">
                В обмен на ваше:
              </span>
              {activeTrade.requestMoney > 0 && (
                <div className="flex items-center gap-1.5 font-black text-white text-sm">
                  <span>-${activeTrade.requestMoney}M</span>
                  <IsometricCoin size={18} />
                </div>
              )}
              {activeTrade.requestProperties.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeTrade.requestProperties.map((idx) => {
                    const t = BOARD_TILES[idx];
                    return (
                      <span
                        key={idx}
                        className="bg-slate-800/90 px-2 py-0.5 rounded-md font-bold text-slate-200 border border-slate-700"
                      >
                        {t?.name}
                      </span>
                    );
                  })}
                </div>
              ) : activeTrade.requestMoney === 0 ? (
                <span className="text-slate-400 italic">Ничего</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onSendAction({ type: 'ACCEPT_TRADE', tradeId: activeTrade.id });
              }}
              className="flex-1 py-3 btn-3d-green text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Принять</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('medium');
                onSendAction({ type: 'REJECT_TRADE', tradeId: activeTrade.id });
              }}
              className="flex-1 py-3 btn-3d-red text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <X className="w-4 h-4" />
              <span>Отклонить</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If there's an active trade where I am the INITIATOR
  if (activeTrade && activeTrade.initiatorId === myPlayerId) {
    const target = gameState.players.find((p) => p.id === activeTrade.targetId);
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-white text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto">
            <ArrowLeftRight className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <h3 className="font-black text-base">Ожидание ответа</h3>
          <p className="text-xs text-slate-300">
            Предложение отправлено игроку <span className="font-black text-amber-300">{target?.displayName}</span>. Ожидаем его решения...
          </p>
          <button
            onClick={() => {
              triggerHaptic('medium');
              onSendAction({ type: 'CANCEL_TRADE', tradeId: activeTrade.id });
            }}
            className="w-full py-3 bg-slate-800 hover:bg-red-950/50 border border-slate-700 text-slate-300 hover:text-red-300 rounded-xl font-black text-xs active:scale-95 transition"
          >
            Отменить предложение
          </button>
        </div>
      </div>
    );
  }

  // 3. Propose Trade Modal
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 max-w-md w-full shadow-2xl flex flex-col gap-3 text-white max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm">Предложить обмен</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Player Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Выберите партнера по сделке:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {otherPlayers.map((p) => {
              const isSelected = p.id === targetPlayerId;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setTargetPlayerId(p.id);
                    setRequestProperties([]);
                    setRequestMoney(0);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-black transition shrink-0 ${
                    isSelected
                      ? 'bg-amber-500/30 border-amber-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.displayName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trade Columns: You Offer vs You Request */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* You Offer */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2">
            <span className="text-emerald-400 font-black text-[11px] uppercase tracking-wider">
              Вы отдаете:
            </span>

            {/* Money to offer */}
            <div className="flex items-center justify-between bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold">Деньги:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOfferMoney((m) => Math.max(0, m - 50))}
                  className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90"
                >
                  -
                </button>
                <span className="font-black text-amber-300 text-xs w-12 text-center">
                  ${offerMoney}
                </span>
                <button
                  onClick={() =>
                    setOfferMoney((m) =>
                      Math.min(myPlayer?.balance || 0, m + 50)
                    )
                  }
                  className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90"
                >
                  +
                </button>
              </div>
            </div>

            {/* My Properties */}
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto no-scrollbar">
              <span className="text-[10px] text-slate-500 font-bold">Ваши карточки:</span>
              {myPlayer?.properties.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">Нет карточек</span>
              ) : (
                myPlayer?.properties.map((idx) => {
                  const t = BOARD_TILES[idx];
                  const isLocked = isPropertyLockedByBuildings(idx);
                  const isChecked = offerProperties.includes(idx);
                  return (
                    <button
                      key={idx}
                      disabled={isLocked}
                      onClick={() => handleToggleOfferProp(idx)}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-bold transition text-left ${
                        isChecked
                          ? 'bg-emerald-600/30 border border-emerald-500 text-white'
                          : isLocked
                          ? 'bg-slate-900/40 text-slate-600 border border-transparent opacity-50 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span className="truncate max-w-[110px]">{t?.name}</span>
                      {isLocked ? (
                        <span title="Дома в группе!"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /></span>
                      ) : (
                        <span className="text-[10px] text-slate-400">${t?.cost}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* You Request */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2">
            <span className="text-amber-400 font-black text-[11px] uppercase tracking-wider">
              Вы хотите получить:
            </span>

            {/* Money to request */}
            <div className="flex items-center justify-between bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold">Деньги:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRequestMoney((m) => Math.max(0, m - 50))}
                  className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90"
                >
                  -
                </button>
                <span className="font-black text-amber-300 text-xs w-12 text-center">
                  ${requestMoney}
                </span>
                <button
                  onClick={() =>
                    setRequestMoney((m) =>
                      Math.min(targetPlayer?.balance || 0, m + 50)
                    )
                  }
                  className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90"
                >
                  +
                </button>
              </div>
            </div>

            {/* Target Properties */}
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto no-scrollbar">
              <span className="text-[10px] text-slate-500 font-bold">Карточки оппонента:</span>
              {!targetPlayer || targetPlayer.properties.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">Нет карточек</span>
              ) : (
                targetPlayer.properties.map((idx) => {
                  const t = BOARD_TILES[idx];
                  const isLocked = isPropertyLockedByBuildings(idx);
                  const isChecked = requestProperties.includes(idx);
                  return (
                    <button
                      key={idx}
                      disabled={isLocked}
                      onClick={() => handleToggleRequestProp(idx)}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-bold transition text-left ${
                        isChecked
                          ? 'bg-amber-600/30 border border-amber-500 text-white'
                          : isLocked
                          ? 'bg-slate-900/40 text-slate-600 border border-transparent opacity-50 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span className="truncate max-w-[110px]">{t?.name}</span>
                      {isLocked ? (
                        <span title="Дома в группе!"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /></span>
                      ) : (
                        <span className="text-[10px] text-slate-400">${t?.cost}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Submit Offer Button */}
        <button
          disabled={
            !targetPlayerId ||
            (offerMoney === 0 &&
              offerProperties.length === 0 &&
              requestMoney === 0 &&
              requestProperties.length === 0)
          }
          onClick={handlePropose}
          className="w-full py-3.5 btn-3d-amber text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Отправить предложение обмена</span>
        </button>
      </div>
    </div>
  );
};
