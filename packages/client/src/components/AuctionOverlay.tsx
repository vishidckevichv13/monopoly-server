import React from 'react';
import { GameState, BOARD_TILES, ClientAction } from '@monopoly/shared';
import { Gavel, Timer, ArrowUp, X, Trophy } from 'lucide-react';
import { PropertyCard, IsometricCoin } from './PropertyCard.js';
import { triggerHaptic } from '../telegram/tma.js';

interface AuctionOverlayProps {
  gameState: GameState;
  myPlayerId: string;
  onSendAction: (action: ClientAction) => void;
}

export const AuctionOverlay: React.FC<AuctionOverlayProps> = ({
  gameState,
  myPlayerId,
  onSendAction
}) => {
  const auction = gameState.auctionState;
  if (!auction || gameState.turnPhase !== 'AUCTION') return null;

  const tile = BOARD_TILES[auction.tileIndex];
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const highestBidder = auction.highestBidderId
    ? gameState.players.find((p) => p.id === auction.highestBidderId)
    : null;

  const isParticipant = auction.activeParticipantIds.includes(myPlayerId);
  const isHighestBidder = auction.highestBidderId === myPlayerId;
  const myBalance = myPlayer?.balance || 0;

  // Base bid increments
  const increments = [5, 10, 25, 50];

  const handlePlaceBid = (increment: number) => {
    triggerHaptic('heavy');
    // If no bids yet, player can match starting price if increment is 0 or bid startPrice + increment
    const newBid = (auction.highestBidderId ? auction.currentBid : auction.currentBid) + increment;
    onSendAction({ type: 'AUCTION_BID', amount: newBid });
  };

  const handlePass = () => {
    triggerHaptic('medium');
    onSendAction({ type: 'AUCTION_PASS' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border-2 border-amber-400/80 rounded-[28px] p-4 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(251,191,36,0.3)] flex flex-col items-center text-center relative overflow-hidden">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between w-full mb-3 px-1">
          <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/50 text-xs font-black">
            <Gavel className="w-4 h-4 animate-bounce" />
            <span>ОТКРЫТЫЙ АУКЦИОН</span>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-1.5 bg-red-500/20 text-red-300 px-3 py-1 rounded-full border border-red-500/40 text-xs font-black">
            <Timer className="w-4 h-4 animate-spin" />
            <span>{auction.timeRemaining}с</span>
          </div>
        </div>

        {/* Property Card Miniature Preview */}
        {tile && (
          <div className="transform scale-90 mb-2">
            <PropertyCard
              tile={tile}
              variant="tile"
              className="w-24 h-32 pointer-events-none"
            />
          </div>
        )}

        {/* Current Bid Display */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 w-full mb-3 flex flex-col items-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Текущая ставка
          </span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-amber-300 font-display">
              ${auction.currentBid}
            </span>
            <IsometricCoin size={24} />
          </div>

          <div className="mt-1.5 text-xs flex items-center gap-1.5">
            {highestBidder ? (
              <>
                <span className="text-slate-400">Лидер:</span>
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: highestBidder.color }}
                />
                <span className="font-black text-white">{highestBidder.displayName}</span>
                {isHighestBidder && (
                  <span className="text-emerald-400 font-black ml-1">(Вы)</span>
                )}
              </>
            ) : (
              <span className="text-amber-400/80 font-bold">Ставок пока нет (Старт: ${auction.currentBid})</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        {isParticipant && !myPlayer?.isBankrupt ? (
          <div className="w-full flex flex-col gap-2.5">
            {/* Quick Bid Increments */}
            <div className="grid grid-cols-4 gap-1.5 w-full">
              {increments.map((inc) => {
                const targetBid = (auction.highestBidderId ? auction.currentBid : auction.currentBid) + inc;
                const canAfford = myBalance >= targetBid;
                return (
                  <button
                    key={inc}
                    disabled={!canAfford}
                    onClick={() => handlePlaceBid(inc)}
                    className={`py-2 rounded-xl font-black text-xs flex flex-col items-center justify-center transition active:scale-95 shadow-md ${
                      canAfford
                        ? 'btn-3d-green text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-600 border border-slate-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-[10px] opacity-80 leading-none">+$ {inc}</span>
                    <span className="leading-none text-xs font-display font-black">${targetBid}</span>
                  </button>
                );
              })}
            </div>

            {/* If no bid placed yet, button to place exactly starting bid */}
            {!auction.highestBidderId && myBalance >= auction.currentBid && (
              <button
                onClick={() => handlePlaceBid(0)}
                className="w-full py-2.5 btn-3d-amber text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <Trophy className="w-4 h-4" />
                <span>Сделать стартовую ставку (${auction.currentBid})</span>
              </button>
            )}

            {/* Pass / Fold Button */}
            <button
              onClick={handlePass}
              className="w-full py-2 bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <X className="w-4 h-4" />
              <span>Пас (Выйти из торгов)</span>
            </button>
          </div>
        ) : (
          <div className="w-full py-3 bg-slate-800/80 rounded-2xl text-center text-xs font-black text-slate-400 border border-slate-700">
            {myPlayer?.isBankrupt ? '💀 Вы обанкротились' : '🙅‍♂️ Вы спасовали на этом аукционе'}
          </div>
        )}
      </div>
    </div>
  );
};
