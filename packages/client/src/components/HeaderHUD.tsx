import React, { useState } from 'react';
import { GameState } from '@monopoly/shared';
import { Timer, Sparkles, LogOut, AlertTriangle, ArrowLeft } from 'lucide-react';
import { triggerHaptic } from '../telegram/tma.js';

interface HeaderHUDProps {
  gameState: GameState;
  myPlayerId: string;
  onConfirmLeave: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  gameState,
  myPlayerId,
  onConfirmLeave
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = activePlayer?.id === myPlayerId;
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const isBankruptOrOver = myPlayer?.isBankrupt || gameState.turnPhase === 'GAME_OVER';

  return (
    <>
      <div className="w-full bg-slate-900/95 backdrop-blur-2xl border-b-2 border-slate-700/70 px-3 py-2 z-30 shadow-2xl">
        {/* Top row: Players balance scroll row & Pot */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {gameState.players.map((p, idx) => {
              const isActive = idx === gameState.activePlayerIndex;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 transition-all shrink-0 ${
                    p.isBankrupt
                      ? 'opacity-40 bg-slate-800 border-red-900/60 grayscale'
                      : isActive
                      ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)] scale-105'
                      : 'bg-slate-800/90 border-slate-600'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[9px] font-black shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs font-bold text-slate-100 truncate max-w-[70px]">
                    {p.displayName.split(' ')[0]}
                  </span>
                  <span className="text-xs font-black text-amber-300 drop-shadow">
                    ${p.balance}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Jackpot & Leave Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-400/60 px-2.5 py-1 rounded-full text-xs text-amber-300 font-black shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>${gameState.jackpot}</span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setShowConfirmModal(true);
              }}
              className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800/90 hover:bg-red-500/20 rounded-full border border-slate-700 hover:border-red-500/50 transition active:scale-90"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom row: Turn Status & Timer Bar */}
        <div className="flex items-center justify-between bg-slate-950/80 rounded-2xl px-3.5 py-1.5 border border-slate-800 shadow-inner">
          <div className="flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded-full border border-white shadow animate-pulse"
              style={{ backgroundColor: activePlayer?.color || '#3b82f6' }}
            />
            <div className="text-xs">
              <span className="text-slate-400 font-bold">Ход: </span>
              <span className="font-black text-white">
                {myPlayer?.isBankrupt ? (
                  <span className="text-slate-400">👀 Наблюдение</span>
                ) : isMyTurn ? (
                  '🌟 Ваш ход!'
                ) : (
                  activePlayer?.displayName
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-indigo-400 animate-spin" />
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                gameState.turnTimeRemaining <= 5
                  ? 'bg-red-500/30 text-red-300 border border-red-500 animate-pulse'
                  : 'text-indigo-200 bg-indigo-950/80 border border-indigo-500/40'
              }`}
            >
              {gameState.turnTimeRemaining}с
            </span>
          </div>
        </div>
      </div>

      {/* Leave / Surrender Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-fade-in">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                isBankruptOrOver
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-400/40'
                  : 'bg-red-500/20 text-red-400 border border-red-400/40'
              }`}
            >
              {isBankruptOrOver ? (
                <ArrowLeft className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7 animate-bounce" />
              )}
            </div>

            <h3 className="text-lg font-black text-white mb-1.5">
              {isBankruptOrOver ? 'Покинуть стол?' : 'Сдаться и покинуть игру?'}
            </h3>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {isBankruptOrOver
                ? 'Вы вернетесь в главное меню. Другие игроки смогут продолжить матч.'
                : 'Вам будет засчитано техническое поражение, а ваше имущество освободится для других игроков.'}
            </p>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  setShowConfirmModal(false);
                  onConfirmLeave();
                }}
                className={`w-full py-3.5 font-black text-xs rounded-2xl text-white shadow-lg active:scale-95 transition ${
                  isBankruptOrOver ? 'btn-3d-blue' : 'btn-3d-red'
                }`}
              >
                {isBankruptOrOver ? 'Да, выйти в меню' : 'Сдаться и выйти'}
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowConfirmModal(false);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl border border-slate-700 active:scale-95 transition"
              >
                {isBankruptOrOver ? 'Остаться наблюдать' : 'Отмена, продолжить игру'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
