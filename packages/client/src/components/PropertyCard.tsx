import React from 'react';
import { TileDefinition, PlayerState, calculateRent, GameState } from '@monopoly/shared';
import { BrandLogo } from './BrandLogo.js';

export type TileSide = 'bottom' | 'left' | 'top' | 'right' | 'corner';

export function getTileSide(index: number): TileSide {
  if (index === 0 || index === 10 || index === 20 || index === 30) {
    return 'corner';
  }
  if (index > 0 && index < 10) {
    return 'bottom'; // Bottom row (tiles 1..9): Upright vertical card, points UP (inward)
  }
  if (index > 10 && index < 20) {
    return 'left'; // Left column (tiles 11..19): Rotated-90 vertical card, points RIGHT (inward)
  }
  if (index > 20 && index < 30) {
    return 'top'; // Top row (tiles 21..29): Upright vertical card, points UP (outward)
  }
  return 'right'; // Right column (tiles 31..39): Rotated-90 vertical card, points RIGHT (outward)
}

interface PropertyCardProps {
  tile: TileDefinition;
  owner?: PlayerState;
  level?: number; // 0..5
  isMortgaged?: boolean;
  variant?: 'tile' | 'full' | 'compact';
  side?: TileSide;
  isSelected?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// 3D Isometric Green Coin (Vector)
export const IsometricCoin: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 54 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block filter drop-shadow-sm flex-shrink-0 select-none ${className}`}
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
      <path
        d="M27.007 24.044V32.561L30.806 30.363V21.836L15.453 12.875L11.551 15.132L27.007 24.044Z"
        fill="#F1C40F"
      />
    </svg>
  );
};

// Vector House Icon
export const HouseIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 12
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block text-white filter drop-shadow ${className}`}
    >
      <path d="M12 3L2 12h3v8h14v-8h3L12 3z" />
    </svg>
  );
};

// Hotel Badge
export const HotelBadge: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({
  className = '',
  size = 'sm'
}) => {
  if (size === 'sm') {
    return (
      <span
        className={`bg-gradient-to-tr from-amber-500 to-red-500 text-white font-black text-[8px] px-1 py-0.5 rounded shadow ${className}`}
      >
        ★
      </span>
    );
  }
  return (
    <span
      className={`bg-gradient-to-tr from-amber-500 to-red-500 text-white font-black text-xs px-2 py-0.5 rounded-md shadow uppercase tracking-wider ${className}`}
    >
      HOTEL ★
    </span>
  );
};

// Map group name to primary brand banner background color (from Figma)
export const GROUP_BACKGROUND_COLORS: Record<string, string> = {
  brown: '#5A0C38',
  light_blue: '#87A5D7',
  pink: '#F03878',
  orange: '#F38023',
  red: '#EE3A23',
  yellow: '#FCE604',
  green: '#12A45D',
  dark_blue: '#294FA2',
  railroad: '#BF00FF',
  utility: '#BF00FF',
  special: '#BF00FF'
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  tile,
  owner,
  level = 0,
  isMortgaged = false,
  variant = 'tile',
  side,
  isSelected = false,
  className = '',
  onClick
}) => {
  const computedSide = side || getTileSide(tile.index);
  const isStreetOrBuyable = ['street', 'railroad', 'utility'].includes(tile.type);
  const isBought = !!owner;
  const podlozhkaColor = owner ? owner.color : '#D9D9D9';
  const groupBgColor = tile.brandColor || GROUP_BACKGROUND_COLORS[tile.group] || '#87A5D7';

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

  // =========================================================================
  // 1. FULL VARIANT (Large Inspection / Bottom Sheet Card: 220px x 312px)
  // =========================================================================
  if (variant === 'full') {
    return (
      <div
        onClick={onClick}
        className={`relative w-[220px] h-[312px] rounded-[26px] transition-all duration-200 select-none overflow-hidden ${
          isSelected ? 'ring-4 ring-amber-400' : ''
        } ${className}`}
        style={{
          backgroundColor: podlozhkaColor,
          padding: '2px 2px 24px 2px',
          boxShadow: owner
            ? `0 10px 28px rgba(0,0,0,0.4), 0 0 16px ${owner.color}60`
            : '0 8px 24px rgba(0,0,0,0.35)'
        }}
      >
        {/* Inner White Container */}
        <div className="w-full h-full rounded-[20px] bg-white flex flex-col overflow-hidden relative">
          {/* Upper Brand Section (68% height) */}
          <div
            className="w-full h-[68%] relative flex items-center justify-center p-3 overflow-hidden"
            style={{ backgroundColor: groupBgColor }}
          >
            {/* Houses / Hotel in top-right if bought */}
            {isBought && level > 0 && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-20 bg-black/25 backdrop-blur-md px-1.5 py-1 rounded-lg border border-white/30">
                {level === 5 ? (
                  <HotelBadge size="md" />
                ) : (
                  Array.from({ length: Math.min(level, 4) }).map((_, i) => (
                    <HouseIcon key={i} size={16} />
                  ))
                )}
              </div>
            )}

            {/* Owner badge top left */}
            {owner && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full z-20 border border-white/30">
                <div
                  className="w-2.5 h-2.5 rounded-full border border-white"
                  style={{ backgroundColor: owner.color }}
                />
                <span className="text-[10px] font-black text-white truncate max-w-[80px]">
                  {owner.displayName}
                </span>
              </div>
            )}

            {/* Clean 1:1 SVG Brand Logo */}
            <div className="relative z-10 flex items-center justify-center w-full h-full p-2">
              <BrandLogo name={tile.name} ticker={tile.ticker} size="lg" />
            </div>
          </div>

          {/* Bottom Price & Label Section (32% height) */}
          <div className="w-full h-[32%] bg-white flex flex-col justify-center items-center px-4 py-1">
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider leading-none mb-1">
              {labelText}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-display">
                {displayPrice.toLocaleString()}
              </span>
              <IsometricCoin size={24} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. TILE VARIANT (On-Board Tiles)
  // =========================================================================

  // 2A. CORNER TILES (Square: Start, Jail, Free Parking, Go to Jail)
  if (computedSide === 'corner') {
    return (
      <div
        onClick={onClick}
        className={`relative w-full h-full flex flex-col rounded-[14px] cursor-pointer transition-all duration-200 select-none overflow-hidden ${
          isSelected ? 'ring-4 ring-amber-400 scale-[1.03]' : ''
        } ${className}`}
        style={{
          backgroundColor: '#E2E8F0',
          padding: '2px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
        }}
      >
        <div className="w-full h-full rounded-[12px] bg-slate-50 flex flex-col items-center justify-center p-1 relative overflow-hidden text-center border border-slate-200">
          <span className="text-2xl leading-none filter drop-shadow mb-0.5">
            {tile.icon || '📍'}
          </span>
          <span className="text-[9px] font-black text-slate-800 uppercase leading-tight tracking-tight px-1">
            {tile.name}
          </span>
          {tile.type === 'go' && (
            <span className="text-[9px] font-black text-emerald-600 leading-none mt-0.5 bg-emerald-100 px-1.5 py-0.5 rounded-full">
              +$200
            </span>
          )}
        </div>
      </div>
    );
  }

  // Card Content Component (Identical Vertical Card structure for all edges)
  const renderCardContent = () => (
    <div className="w-full h-full rounded-[10px] bg-white flex flex-col overflow-hidden relative shadow-sm">
      {/* Top Brand Banner Section (66% height) */}
      <div
        className="w-full h-[66%] relative flex items-center justify-center p-1 overflow-hidden"
        style={{ backgroundColor: isStreetOrBuyable ? groupBgColor : '#F1F5F9' }}
      >
        {/* Upgrades (Houses / Hotel) Top-Right Indicator */}
        {isBought && level > 0 && (
          <div className="absolute top-1 right-1 flex items-center gap-0.5 z-20 bg-black/30 backdrop-blur-sm px-1 py-0.5 rounded border border-white/30">
            {level === 5 ? (
              <HotelBadge size="sm" />
            ) : (
              Array.from({ length: Math.min(level, 4) }).map((_, i) => (
                <HouseIcon key={i} size={8} />
              ))
            )}
          </div>
        )}

        {/* Clean 1:1 SVG Brand Logo or Special Tile Icon */}
        <div className="relative z-10 flex items-center justify-center w-full h-full p-1">
          {isStreetOrBuyable ? (
            <BrandLogo
              name={tile.name}
              ticker={tile.ticker}
              size="sm"
              className="w-full h-full max-h-10 max-w-10 object-contain"
            />
          ) : (
            <span className="text-xl leading-none filter drop-shadow">
              {tile.icon || '🏷️'}
            </span>
          )}
        </div>
      </div>

      {/* Base Section (Bottom: 34% height) - Price & Currency */}
      <div className="w-full h-[34%] bg-white px-1 py-0.5 flex flex-col justify-center items-center">
        {tile.cost ? (
          <div className="flex items-center justify-center gap-0.5 w-full">
            <span className="text-[10px] font-black text-slate-900 leading-none">
              {displayPrice}
            </span>
            <IsometricCoin size={11} />
          </div>
        ) : tile.type === 'go' ? (
          <span className="text-[9px] font-black text-emerald-700 leading-none">
            +$200
          </span>
        ) : tile.type === 'tax' && tile.taxAmount ? (
          <span className="text-[9px] font-black text-red-600 leading-none">
            -${tile.taxAmount}
          </span>
        ) : (
          <span className="text-[8px] font-bold text-slate-500 uppercase leading-none">
            {tile.name}
          </span>
        )}
      </div>
    </div>
  );

  // 2B. ROTATED TILES (Left & Right Board Edges)
  // Left: 90° clockwise -> Header faces RIGHT (towards center)
  // Right: -90° (270°) -> Header faces LEFT (towards center)
  if (computedSide === 'left' || computedSide === 'right') {
    const rotationClass = computedSide === 'left' ? 'rotate-90' : '-rotate-90';
    return (
      <div
        onClick={onClick}
        className={`relative w-full h-full flex items-center justify-center select-none overflow-visible ${className}`}
      >
        <div
          className={`absolute flex flex-col rounded-[12px] cursor-pointer transition-all duration-200 overflow-hidden transform ${rotationClass} ${
            isSelected ? 'ring-4 ring-amber-400 scale-[1.03]' : ''
          }`}
          style={{
            backgroundColor: podlozhkaColor,
            padding: '1.5px 1.5px 11px 1.5px', // Exact colored podlozhka bar at base of card
            boxShadow: owner
              ? `0 4px 14px ${owner.color}60, 0 2px 6px rgba(0,0,0,0.3)`
              : '0 4px 10px rgba(0,0,0,0.25)',
            width: 'calc(100% * 0.74)',
            height: 'calc(100% * 1.35)'
          }}
        >
          {renderCardContent()}
        </div>
      </div>
    );
  }

  // 2C. TOP EDGE TILES (Upright so brand header faces OUTWARD away from center)
  if (computedSide === 'top') {
    return (
      <div
        onClick={onClick}
        className={`relative w-full h-full flex flex-col rounded-[12px] cursor-pointer transition-all duration-200 select-none overflow-hidden ${
          isSelected ? 'ring-4 ring-amber-400 scale-[1.03]' : ''
        } ${className}`}
        style={{
          backgroundColor: podlozhkaColor,
          padding: '1.5px 1.5px 11px 1.5px', // Exact colored podlozhka bar at base of card
          boxShadow: owner
            ? `0 4px 14px ${owner.color}60, 0 2px 6px rgba(0,0,0,0.3)`
            : '0 4px 10px rgba(0,0,0,0.25)'
        }}
      >
        {renderCardContent()}
      </div>
    );
  }

  // 2D. BOTTOM EDGE TILES (Upright 0° so header faces UP towards center)
  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full flex flex-col rounded-[12px] cursor-pointer transition-all duration-200 select-none overflow-hidden ${
        isSelected ? 'ring-4 ring-amber-400 scale-[1.03]' : ''
      } ${className}`}
      style={{
        backgroundColor: podlozhkaColor,
        padding: '1.5px 1.5px 11px 1.5px', // Exact colored podlozhka bar at base of card
        boxShadow: owner
          ? `0 4px 14px ${owner.color}60, 0 2px 6px rgba(0,0,0,0.3)`
          : '0 4px 10px rgba(0,0,0,0.25)'
      }}
    >
      {renderCardContent()}
    </div>
  );
};
