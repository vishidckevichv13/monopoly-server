import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameState, BOARD_TILES, PlayerState } from '@monopoly/shared';
import { triggerHaptic } from '../telegram/tma.js';
import { Eye, Focus, Sparkles } from 'lucide-react';
import { PropertyCard } from './PropertyCard.js';

interface GameBoardProps {
  gameState: GameState;
  selectedTileIndex: number | null;
  onSelectTile: (tileIndex: number) => void;
}

const GROUP_COLORS: Record<string, { bg: string; border: string; text: string; header: string }> = {
  brown: {
    bg: 'from-amber-100 to-amber-50',
    border: 'border-amber-700',
    text: 'text-amber-950',
    header: 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800'
  },
  light_blue: {
    bg: 'from-sky-100 to-sky-50',
    border: 'border-sky-400',
    text: 'text-sky-950',
    header: 'bg-gradient-to-r from-sky-400 via-sky-300 to-sky-500'
  },
  pink: {
    bg: 'from-pink-100 to-pink-50',
    border: 'border-pink-400',
    text: 'text-pink-950',
    header: 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600'
  },
  orange: {
    bg: 'from-orange-100 to-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-950',
    header: 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600'
  },
  red: {
    bg: 'from-red-100 to-red-50',
    border: 'border-red-500',
    text: 'text-red-950',
    header: 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600'
  },
  yellow: {
    bg: 'from-yellow-100 to-amber-50',
    border: 'border-yellow-400',
    text: 'text-yellow-950',
    header: 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500'
  },
  green: {
    bg: 'from-emerald-100 to-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-950',
    header: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
  },
  dark_blue: {
    bg: 'from-blue-100 to-indigo-50',
    border: 'border-blue-600',
    text: 'text-blue-950',
    header: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'
  },
  railroad: {
    bg: 'from-slate-100 to-slate-50',
    border: 'border-slate-400',
    text: 'text-slate-900',
    header: 'bg-gradient-to-r from-slate-600 via-slate-500 to-slate-700'
  },
  utility: {
    bg: 'from-cyan-100 to-cyan-50',
    border: 'border-cyan-400',
    text: 'text-cyan-950',
    header: 'bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600'
  },
  special: {
    bg: 'from-purple-100 to-indigo-50',
    border: 'border-purple-400',
    text: 'text-purple-950',
    header: 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600'
  }
};

// Generous square board dimension in pixels
const BOARD_SIZE = 960;
const TILE_COUNT_PER_SIDE = 11;
const TILE_SIZE = BOARD_SIZE / TILE_COUNT_PER_SIDE; // ~87.27px

// 3D Isometric View Parameters
const BOARD_ROTATION_Z_DEG = -35; // Yaw
const BOARD_TILT_X_DEG = 45;      // Pitch
const PERSPECTIVE_PX = 2000;      // Gentle 3D perspective depth

// Calculates the exact projected 2D screen coordinates relative to board center
export function projectBoardPointToScreen(
  boardX: number,
  boardY: number,
  boardSize = BOARD_SIZE,
  rotZDeg = BOARD_ROTATION_Z_DEG,
  tiltXDeg = BOARD_TILT_X_DEG,
  perspective = PERSPECTIVE_PX
) {
  // Center relative coords (origin at board center)
  const u = boardX - boardSize / 2;
  const v = boardY - boardSize / 2;

  const theta = (rotZDeg * Math.PI) / 180;
  const phi = (tiltXDeg * Math.PI) / 180;

  // 1. Rotate around Z
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const u1 = u * cosTheta - v * sinTheta;
  const v1 = u * sinTheta + v * cosTheta;

  // 2. Rotate around X (Tilt)
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const xScreen = u1;
  const yScreen = v1 * cosPhi;
  const zDepth = v1 * sinPhi;

  // CSS 3D perspective scaling factor
  const pScale = perspective > 0 ? perspective / (perspective - zDepth) : 1;

  return {
    x: xScreen * pScale,
    y: yScreen * pScale
  };
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  selectedTileIndex,
  onSelectTile
}) => {
  // Camera state: 'follow' (focused on active token) vs 'overview' (whole board)
  const [cameraMode, setCameraMode] = useState<'follow' | 'overview'>('follow');
  const [isManualControl, setIsManualControl] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const hasDraggedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const dragOffsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const autoResetTimerRef = useRef<any>(null);
  const hopIntervalRef = useRef<any>(null);

  // Floating Start Reward (+200$) animation
  const [showGoReward, setShowGoReward] = useState<{ id: string; name: string } | null>(null);

  // Animated token positions: map playerId -> display position (tile index 0..39)
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    gameState.players.forEach((p) => {
      init[p.id] = p.position;
    });
    return init;
  });

  // Track hopping token and landing token
  const [hoppingPlayerId, setHoppingPlayerId] = useState<string | null>(null);
  const [landingPlayerId, setLandingPlayerId] = useState<string | null>(null);

  const prevPlayersRef = useRef<PlayerState[]>(gameState.players);
  const prevDiceRef = useRef(gameState.lastDiceResult);
  const prevTurnRef = useRef(gameState.turnNumber);
  const prevActivePlayerRef = useRef(gameState.activePlayerIndex);

  // Calculate pixel center for each tile index (0..39) on the 11x11 square board
  const getTileCenterCoords = (index: number) => {
    let row = 0;
    let col = 0;
    if (index >= 0 && index <= 10) {
      row = 10;
      col = 10 - index;
    } else if (index > 10 && index <= 20) {
      row = 10 - (index - 10);
      col = 0;
    } else if (index > 20 && index <= 30) {
      row = 0;
      col = index - 20;
    } else {
      row = index - 30;
      col = 10;
    }
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    return { x, y, row, col };
  };

  // Determine active player
  const activePlayer = gameState.players[gameState.activePlayerIndex] || gameState.players[0];

  // Camera focus follows the active player token step-by-step
  const focusedTileIndex = useMemo(() => {
    // If a specific tile is clicked by the user to inspect
    if (selectedTileIndex !== null) return selectedTileIndex;

    // If a token is currently hopping, focus on its current hop tile
    if (hoppingPlayerId && animatedPositions[hoppingPlayerId] !== undefined) {
      return animatedPositions[hoppingPlayerId];
    }

    // Default: focus on active player's current token position
    if (activePlayer) {
      return animatedPositions[activePlayer.id] ?? activePlayer.position;
    }

    return 0;
  }, [selectedTileIndex, hoppingPlayerId, animatedPositions, activePlayer]);

  // Reset manual control after idle
  const resetIdleTimer = () => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
    }
    autoResetTimerRef.current = setTimeout(() => {
      setIsManualControl(false);
      setDragOffset({ x: 0, y: 0 });
    }, 6000);
  };

  // When dice are rolled or turn changes, return camera to follow the active player
  useEffect(() => {
    const diceChanged = gameState.lastDiceResult !== prevDiceRef.current;
    const turnChanged = gameState.turnNumber !== prevTurnRef.current || gameState.activePlayerIndex !== prevActivePlayerRef.current;

    if (diceChanged || turnChanged) {
      prevDiceRef.current = gameState.lastDiceResult;
      prevTurnRef.current = gameState.turnNumber;
      prevActivePlayerRef.current = gameState.activePlayerIndex;

      setIsManualControl(false);
      setDragOffset({ x: 0, y: 0 });
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    }
  }, [gameState.lastDiceResult, gameState.turnNumber, gameState.activePlayerIndex]);

  // Step-by-step token hopping animation and synchronized camera tracking
  useEffect(() => {
    const prevPlayers = prevPlayersRef.current;
    prevPlayersRef.current = gameState.players;

    // Check if active player or another player changed positions
    const movingPlayer = gameState.players.find((player) => {
      const prev = prevPlayers.find((p) => p.id === player.id);
      const currentPos = animatedPositions[player.id] ?? player.position;
      return prev && prev.position !== player.position && currentPos !== player.position;
    });

    if (movingPlayer) {
      const currentPos = animatedPositions[movingPlayer.id] ?? movingPlayer.position;
      const targetPos = movingPlayer.position;

      // Calculate clockwise step-by-step path
      const steps: number[] = [];
      let stepPos = currentPos;
      while (stepPos !== targetPos) {
        stepPos = (stepPos + 1) % 40;
        steps.push(stepPos);
      }

      if (steps.length > 0) {
        if (hopIntervalRef.current) clearInterval(hopIntervalRef.current);

        setHoppingPlayerId(movingPlayer.id);
        setIsManualControl(false);
        setDragOffset({ x: 0, y: 0 });

        let currentStepIdx = 0;
        hopIntervalRef.current = setInterval(() => {
          if (currentStepIdx < steps.length) {
            const nextTile = steps[currentStepIdx];
            setAnimatedPositions((prevMap) => ({
              ...prevMap,
              [movingPlayer.id]: nextTile
            }));

            triggerHaptic('light');

            // Passed Start / GO bonus detection
            if (nextTile === 0) {
              setShowGoReward({ id: movingPlayer.id, name: movingPlayer.displayName });
              setTimeout(() => setShowGoReward(null), 2500);
            }

            currentStepIdx++;
          } else {
            clearInterval(hopIntervalRef.current);
            hopIntervalRef.current = null;
            setHoppingPlayerId(null);
            setLandingPlayerId(movingPlayer.id);
            triggerHaptic('heavy');
            setTimeout(() => setLandingPlayerId(null), 350);
          }
        }, 160); // Snappy, smooth 160ms per step
      }
    } else {
      // Sync any static player positions
      setAnimatedPositions((prevMap) => {
        let changed = false;
        const newMap = { ...prevMap };
        gameState.players.forEach((p) => {
          if (newMap[p.id] !== p.position && hoppingPlayerId !== p.id) {
            newMap[p.id] = p.position;
            changed = true;
          }
        });
        return changed ? newMap : prevMap;
      });
    }

    return () => {
      if (hopIntervalRef.current) {
        clearInterval(hopIntervalRef.current);
        hopIntervalRef.current = null;
      }
    };
  }, [gameState.players]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      if (hopIntervalRef.current) clearInterval(hopIntervalRef.current);
    };
  }, []);

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    hasDraggedRef.current = false;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    dragOffsetStartRef.current = { ...dragOffset };
  };

  // Pointer Move handler with drag threshold (distinguish tap from drag)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      hasDraggedRef.current = true;
      if (!isDragging) {
        setIsDragging(true);
        setIsManualControl(true);
      }
      setDragOffset({
        x: dragOffsetStartRef.current.x + dx,
        y: dragOffsetStartRef.current.y + dy
      });
      resetIdleTimer();
    }
  };

  // Pointer Up handler
  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      resetIdleTimer();
    }
    pointerStartRef.current = null;
  };

  // Calculate Camera Position in 2D Screen Space
  const cameraScale = cameraMode === 'overview' ? 0.44 : 0.95;
  const targetTileCoords = getTileCenterCoords(focusedTileIndex);
  const targetProjected = projectBoardPointToScreen(targetTileCoords.x, targetTileCoords.y);

  // Optical vertical offset (-24px) so focused tile is positioned nicely above the bottom HUD
  const VIEWPORT_OFFSET_Y = -24;

  const baseCameraX = cameraMode === 'overview'
    ? 0
    : -targetProjected.x * cameraScale;

  const baseCameraY = cameraMode === 'overview'
    ? 0
    : -targetProjected.y * cameraScale + VIEWPORT_OFFSET_Y;

  const totalCameraX = isManualControl ? baseCameraX + dragOffset.x : baseCameraX;
  const totalCameraY = isManualControl ? baseCameraY + dragOffset.y : baseCameraY;

  return (
    <div
      className="relative w-full flex-1 flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Background Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none z-0 opacity-90"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-slate-900/10 to-slate-950/60 pointer-events-none z-0" />

      {/* Floating Top Controls: Active Player status & Camera Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-40 pointer-events-none">
        {/* Active Player / Turn Status Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border-2 border-amber-400/40 shadow-xl flex items-center gap-2 pointer-events-auto">
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md animate-pulse"
            style={{ backgroundColor: activePlayer?.color || '#3B82F6' }}
          />
          <span className="text-xs font-black text-white truncate max-w-[130px]">
            {activePlayer?.displayName || 'Игрок'}
          </span>
          {hoppingPlayerId && (
            <span className="text-xs text-amber-300 font-black flex items-center gap-0.5 animate-pulse">
              🏃 Шагает...
            </span>
          )}
        </div>

        {/* Camera Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isManualControl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                setIsManualControl(false);
                setDragOffset({ x: 0, y: 0 });
              }}
              className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-xl border border-amber-200 transition-all active:scale-95 animate-pulse"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>К фишке</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setCameraMode((prev) => (prev === 'follow' ? 'overview' : 'follow'));
              setIsManualControl(false);
              setDragOffset({ x: 0, y: 0 });
            }}
            className="bg-white/95 hover:bg-white text-slate-900 p-2.5 rounded-full border-2 border-slate-200 shadow-xl active:scale-90 transition-all flex items-center justify-center"
            title={cameraMode === 'follow' ? 'Обзор всей доски' : 'Следить за ходом'}
          >
            {cameraMode === 'follow' ? (
              <Eye className="w-4 h-4 text-indigo-600" />
            ) : (
              <Focus className="w-4 h-4 text-amber-600" />
            )}
          </button>
        </div>
      </div>

      {/* Floating Pass Start (+200$) Notification Banner */}
      {showGoReward && (
        <div className="absolute top-16 z-50 pointer-events-none animate-float-reward flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 px-5 py-2.5 rounded-2xl border-2 border-emerald-200 shadow-2xl">
          <Sparkles className="w-6 h-6 text-yellow-200 animate-spin" />
          <div className="text-white font-black text-sm sm:text-base drop-shadow-md">
            {showGoReward.name} прошел СТАРТ! +$200
          </div>
        </div>
      )}

      {/* 2D Camera Layer: Handles clean 2D panning, zooming, and smooth tracking */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate3d(${totalCameraX}px, ${totalCameraY}px, 0px) scale(${cameraScale})`,
          transformOrigin: '50% 50%',
          transition: isDragging
            ? 'none'
            : hoppingPlayerId
            ? 'transform 0.16s linear'
            : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* 3D Perspective Viewport */}
        <div
          className="board-perspective"
          style={{
            perspective: `${PERSPECTIVE_PX}px`,
            perspectiveOrigin: '50% 50%'
          }}
        >
          {/* 3D Isometric Board Container */}
          <div
            className="relative board-isometric-3d rounded-[32px] overflow-hidden bg-slate-900 border-[6px] border-slate-800 pointer-events-auto"
            style={{
              width: `${BOARD_SIZE}px`,
              height: `${BOARD_SIZE}px`,
              transform: `rotateX(${BOARD_TILT_X_DEG}deg) rotateZ(${BOARD_ROTATION_Z_DEG}deg)`,
              transformOrigin: '50% 50%'
            }}
          >
            {/* Central Velvet Board Tray with 3D Monopoly Banner & Dice */}
            <div className="absolute inset-[13.5%] rounded-[30px] bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 border-[5px] border-amber-600/70 flex flex-col items-center justify-center p-6 text-center shadow-[inset_0_10px_40px_rgba(0,0,0,0.8),0_12px_24px_rgba(0,0,0,0.5)] z-0 pointer-events-auto">
              {/* Monopoly 3D Banner */}
              <div className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-red-700 border-2 border-white/80 shadow-[0_5px_0_#991b1b,0_10px_20px_rgba(0,0,0,0.5)] transform -rotate-1 mb-2">
                <div className="text-2xl sm:text-3xl font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-display">
                  MONOPOLY
                </div>
              </div>
              <div className="text-[11px] text-emerald-200 font-extrabold uppercase tracking-widest drop-shadow">
                Telegram Mini App Edition
              </div>

              {/* Central 3D Card Decks (Chance & Community Chest) */}
              <div className="w-full flex items-center justify-around px-8 mt-3">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white shadow-[0_4px_0_#b45309,0_8px_16px_rgba(0,0,0,0.4)] flex items-center justify-center text-white font-black text-xs sm:text-sm">
                    ❓ ШАНС
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-20 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 border-2 border-white shadow-[0_4px_0_#1d4ed8,0_8px_16px_rgba(0,0,0,0.4)] flex items-center justify-center text-white font-black text-xs sm:text-sm">
                    🎁 КАЗНА
                  </div>
                </div>
              </div>

              {/* Central 3D Physical Dice Display */}
              {gameState.lastDiceResult && (
                <div className="mt-4 flex flex-col items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-amber-400/40 shadow-2xl">
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300">
                    Результат броска
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white text-slate-950 font-black text-2xl flex items-center justify-center shadow-[0_5px_0_#cbd5e1,0_8px_16px_rgba(0,0,0,0.4)] border-2 border-slate-100 transform hover:scale-110 transition">
                      {gameState.lastDiceResult.die1}
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white text-slate-950 font-black text-2xl flex items-center justify-center shadow-[0_5px_0_#cbd5e1,0_8px_16px_rgba(0,0,0,0.4)] border-2 border-slate-100 transform hover:scale-110 transition">
                      {gameState.lastDiceResult.die2}
                    </div>
                  </div>
                  {gameState.lastDiceResult.isDouble && (
                    <span className="text-[11px] font-black text-amber-300 bg-amber-500/30 px-3 py-0.5 rounded-full border border-amber-300 shadow animate-pulse">
                      ✨ ДУБЛЬ! ✨
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 11x11 Grid of Large, Chunky, High-Readability 3D Tiles */}
            <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-1 p-2.5 relative z-10">
              {BOARD_TILES.map((tile) => {
                const coords = getTileCenterCoords(tile.index);
                const isSelected = selectedTileIndex === tile.index;
                const propState = gameState.propertyStates[tile.index];
                const owner = gameState.players.find((p) => p.properties.includes(tile.index));

                // Find all players currently on this tile (using animated position)
                const playersHere = gameState.players.filter(
                  (p) => (animatedPositions[p.id] ?? p.position) === tile.index && !p.isBankrupt
                );

                return (
                  <div
                    key={tile.index}
                    style={{
                      gridRow: coords.row + 1,
                      gridColumn: coords.col + 1
                    }}
                    className="relative w-full h-full"
                  >
                    <PropertyCard
                      tile={tile}
                      owner={owner}
                      level={propState?.level || 0}
                      isMortgaged={propState?.isMortgaged || false}
                      isSelected={isSelected}
                      variant="tile"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasDraggedRef.current) return;
                        triggerHaptic('light');
                        onSelectTile(tile.index);
                      }}
                    />

                    {/* Player Pawns / Hopping Tokens */}
                    {playersHere.length > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center gap-1 pointer-events-none z-30">
                        {playersHere.map((p) => {
                          const isCurrentlyHopping = hoppingPlayerId === p.id;
                          const isLanding = landingPlayerId === p.id;
                          return (
                            <div
                              key={p.id}
                              className="relative flex flex-col items-center justify-center"
                            >
                              {/* 3D Pawn Shadow */}
                              <div
                                className={`w-8 h-3.5 rounded-full bg-slate-950/75 blur-[1px] absolute -bottom-2 ${
                                  isCurrentlyHopping ? 'animate-pawn-shadow-pulse' : ''
                                }`}
                              />
                              {/* 3D Pawn Figurine */}
                              <div
                                className={`w-9 h-9 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-xs font-black text-white ${
                                  isCurrentlyHopping
                                    ? 'animate-pawn-hop-arc'
                                    : isLanding
                                    ? 'animate-pawn-land-squish'
                                    : ''
                                }`}
                                style={{
                                  backgroundColor: p.color,
                                  boxShadow: `0 6px 14px ${p.color}aa, inset 0 2px 4px rgba(255,255,255,0.9)`
                                }}
                              >
                                {p.displayName.slice(0, 1).toUpperCase()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
