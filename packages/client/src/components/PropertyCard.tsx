import React from 'react';
import { TileDefinition, PlayerState, calculateRent, GameState } from '@monopoly/shared';
import { BrandLogo } from './BrandLogo.js';

interface PropertyCardProps {
  tile: TileDefinition;
  owner?: PlayerState;
  level?: number; // 0..5
  isMortgaged?: boolean;
  variant?: 'tile' | 'full' | 'compact';
  isSelected?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// 3D Isometric Green Coin
export const IsometricCoin: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 54 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block filter drop-shadow-sm ${className}`}
    >
      <path
        d="M17.405 38.114L2 29.179V20.655L36.095 0.938L51.5 9.872V18.396L17.405 38.114Z"
        fill="#2ECC71"
      />
      <path
        d="M17.405 38.114L2 29.179V20.655L17.405 29.641V38.114Z"
        fill="#2EBF69"
      />
      <path
        d="M51.5 18.396L17.405 38.114V29.59L51.5 9.905V18.396Z"
        fill="#30B265"
      />
      {/* Dollar symbol / Gold inner pattern */}
      <path
        d="M27.007 24.044V32.561L30.806 30.363V21.836L15.453 12.875L11.551 15.132L27.007 24.044Z"
        fill="#F1C40F"
      />
    </svg>
  );
};

// Isometric House Icon (from Card Buy.svg)
export const IsometricHouseIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 14
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block drop-shadow-md ${className}`}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.818 0.159C18.592 0.253 18.29 0.412 18.148 0.51C18.006 0.609 14.443 4.141 10.23 8.359C4.049 14.547 2.535 16.098 2.387 16.396C1.708 17.76 1.934 19.257 2.974 20.298C3.621 20.944 4.446 21.279 5.392 21.279H5.87V26.915C5.87 30.731 5.895 32.672 5.948 32.925C6.214 34.21 7.254 35.371 8.536 35.814C9.004 35.976 9.036 35.977 12.439 35.977C15.795 35.977 15.875 35.974 16.065 35.832C16.172 35.752 16.325 35.599 16.405 35.492C16.548 35.301 16.551 35.206 16.586 30.591L16.621 25.885L16.835 25.538C17.102 25.106 17.646 24.76 18.162 24.696C18.361 24.672 19.349 24.662 20.357 24.675L22.19 24.698L22.561 24.903C22.914 25.099 23.142 25.332 23.36 25.72C23.441 25.865 23.466 26.738 23.494 30.597C23.529 35.206 23.532 35.301 23.675 35.492C23.755 35.599 23.908 35.752 24.015 35.832C24.205 35.974 24.286 35.977 27.641 35.977C31.044 35.977 31.077 35.976 31.544 35.814C32.826 35.371 33.866 34.21 34.132 32.925C34.185 32.672 34.21 30.731 34.21 26.915V21.279H34.688C36.014 21.279 37.17 20.572 37.739 19.412C37.979 18.925 37.981 18.91 37.981 17.966C37.981 16.358 38.792 17.312 29.743 8.263C20.745 -0.735 21.646 0.038 20.113 0.006C19.312 -0.011 19.191 0.003 18.818 0.159Z"
        fill="white"
      />
    </svg>
  );
};

// Hotel / Crown Icon
export const HotelIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 18
}) => {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black rounded-lg shadow-lg border border-white px-1.5 py-0.5 ${className}`}
      style={{ fontSize: `${size * 0.7}px` }}
    >
      <span>🏨</span>
    </div>
  );
};

// Map group name to primary brand banner background color
export const GROUP_BACKGROUND_COLORS: Record<string, string> = {
  brown: '#8D5B4C',
  light_blue: '#23AEEC', // SVG exact
  pink: '#E1306C',
  orange: '#F97316',
  red: '#DC2626',
  yellow: '#EAB308',
  green: '#10B981',
  dark_blue: '#1E3A8A',
  railroad: '#0F172A',
  utility: '#334155',
  special: '#6366F1'
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  tile,
  owner,
  level = 0,
  isMortgaged = false,
  variant = 'tile',
  isSelected = false,
  className = '',
  onClick
}) => {
  const isStreetOrBuyable = ['street', 'railroad', 'utility'].includes(tile.type);
  const isBought = !!owner;
  const borderColor = owner ? owner.color : '#CBD5E1';
  const groupBgColor = tile.brandColor || GROUP_BACKGROUND_COLORS[tile.group] || '#23AEEC';

  // Calculate current rent or display price
  const displayPrice = isBought
    ? calculateRent(
        {
          propertyStates: { [tile.index]: { tileIndex: tile.index, level, isMortgaged } },
          players: owner ? [owner] : []
        } as unknown as GameState,
        tile.index,
        7
      )
    : tile.cost || 0;

  const labelText = isBought ? 'Плата' : 'Стоимость';

  if (variant === 'full') {
    // Large full-fidelity Card matching Сard Default / Сard Buy SVGs (288 x 424 ratio)
    return (
      <div
        onClick={onClick}
        className={`relative w-[288px] h-[424px] rounded-[24px] p-[2px] transition-all shadow-2xl select-none overflow-hidden ${className}`}
        style={{
          backgroundColor: borderColor,
          boxShadow: owner
            ? `0 12px 32px ${owner.color}40, 0 4px 12px rgba(0,0,0,0.3)`
            : '0 12px 32px rgba(0,0,0,0.3)'
        }}
      >
        {/* Inner White Container */}
        <div className="w-full h-full rounded-[22px] bg-white flex flex-col overflow-hidden relative">
          {/* Upper Brand Section (284 x 284) */}
          <div
            className="w-full h-[284px] relative flex flex-col items-center justify-center p-4 overflow-hidden"
            style={{ backgroundColor: groupBgColor }}
          >
            {/* Top-left soft highlight glow */}
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/50 blur-2xl pointer-events-none" />

            {/* Houses / Hotel in top-right if bought */}
            {isBought && level > 0 && (
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-20">
                {level === 5 ? (
                  <HotelIcon size={22} />
                ) : (
                  Array.from({ length: level }).map((_, i) => (
                    <IsometricHouseIcon key={i} size={18} />
                  ))
                )}
              </div>
            )}

            {/* Owner badge top left */}
            {owner && (
              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full z-20 border border-white/30">
                <div
                  className="w-2.5 h-2.5 rounded-full border border-white"
                  style={{ backgroundColor: owner.color }}
                />
                <span className="text-[10px] font-black text-white truncate max-w-[100px]">
                  {owner.displayName}
                </span>
              </div>
            )}

            {/* Brand Logo in center */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-2 transform hover:scale-105 transition">
              <BrandLogo name={tile.name} ticker={tile.ticker} size="lg" />
              <span className="text-white font-black text-lg tracking-wide drop-shadow-md text-center line-clamp-1">
                {tile.name}
              </span>
            </div>
          </div>

          {/* Bottom Price & Label Section */}
          <div className="flex-1 w-full bg-white flex flex-col justify-center px-6 py-2">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {labelText}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
                {displayPrice}
              </span>
              <IsometricCoin size={32} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // On-Board Tile Variant (Optimized for 3D Isometric Board Grid)
  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full flex flex-col rounded-[14px] p-[2px] cursor-pointer transition-all duration-200 select-none overflow-hidden tile-3d-card ${
        isSelected ? 'tile-3d-card-selected ring-4 ring-amber-400' : ''
      } ${className}`}
      style={{
        backgroundColor: borderColor,
        boxShadow: owner
          ? `0 4px 12px ${owner.color}50, inset 0 1px 0 rgba(255,255,255,0.6)`
          : undefined
      }}
    >
      {/* Inner White Base */}
      <div className="w-full h-full rounded-[12px] bg-white flex flex-col overflow-hidden">
        {/* Top Brand Banner */}
        <div
          className="w-full flex-1 relative flex flex-col items-center justify-center p-1 overflow-hidden"
          style={{ backgroundColor: isStreetOrBuyable ? groupBgColor : '#F1F5F9' }}
        >
          {/* Subtle soft highlight */}
          {isStreetOrBuyable && (
            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-white/40 blur-md pointer-events-none" />
          )}

          {/* Upgrades (Houses / Hotel) Top-Right Indicator */}
          {isBought && level > 0 && (
            <div className="absolute top-1 right-1 flex items-center gap-0.5 z-20">
              {level === 5 ? (
                <span className="text-[10px] filter drop-shadow animate-bounce">🏨</span>
              ) : (
                Array.from({ length: Math.min(level, 4) }).map((_, i) => (
                  <IsometricHouseIcon key={i} size={8} />
                ))
              )}
            </div>
          )}

          {/* Owner Dot Top-Left */}
          {owner && (
            <div
              className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full border border-white shadow-sm z-20 animate-pulse"
              style={{ backgroundColor: owner.color }}
              title={`Владелец: ${owner.displayName}`}
            />
          )}

          {/* Brand Logo / Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full px-0.5">
            {isStreetOrBuyable ? (
              <BrandLogo name={tile.name} ticker={tile.ticker} size="sm" className="w-6 h-6 scale-90" />
            ) : (
              <span className="text-xl leading-none filter drop-shadow">
                {tile.icon || '🏷️'}
              </span>
            )}
            <span
              className={`text-[9px] leading-[1.1] font-black tracking-tight text-center line-clamp-1 w-full mt-0.5 ${
                isStreetOrBuyable ? 'text-white drop-shadow' : 'text-slate-900'
              }`}
            >
              {tile.name}
            </span>
          </div>
        </div>

        {/* Bottom Section: Label & Price + Coin */}
        <div className="w-full bg-white px-1 py-0.5 flex flex-col justify-center items-center border-t border-slate-100">
          {tile.cost && (
            <div className="flex items-center justify-center gap-1 w-full">
              <span className="text-[10px] font-black text-slate-900 leading-none">
                {displayPrice}
              </span>
              <IsometricCoin size={11} />
            </div>
          )}
          {tile.type === 'go' && (
            <span className="text-[9px] font-black text-emerald-700 leading-none">
              +$200
            </span>
          )}
          {tile.type === 'tax' && tile.taxAmount && (
            <span className="text-[9px] font-black text-red-600 leading-none">
              -${tile.taxAmount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
