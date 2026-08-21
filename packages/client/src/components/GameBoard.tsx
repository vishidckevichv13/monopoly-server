import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameState, BOARD_TILES, PlayerState } from '@monopoly/shared';
import { triggerHaptic } from '../telegram/tma.js';
import { Eye, Focus, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { PropertyCard } from './PropertyCard.js';
import { GameLogs } from './GameLogs.js';

interface GameBoardProps {
  gameState: GameState;
  selectedTileIndex: number | null;
  onSelectTile: (tileIndex: number) => void;
}

// Flat 2D square board dimensions
const BOARD_SIZE = 960;
const TILE_COUNT_PER_SIDE = 11;
const TILE_SIZE = BOARD_SIZE / TILE_COUNT_PER_SIDE; // ~87.27px

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  selectedTileIndex,
  onSelectTile
}) => {
  // Camera state: 'overview' (whole square board fits screen) vs 'follow' (focused on active token)
  const [cameraMode, setCameraMode] = useState<'follow' | 'overview'>('overview');
  const [isManualControl, setIsManualControl] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 400,
    height: typeof window !== 'undefined' ? window.innerHeight * 0.65 : 600
  });

  const hasDraggedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const dragOffsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const autoResetTimerRef = useRef<any>(null);
  const hopIntervalRef = useRef<any>(null);

  // Measure container and board dimensions for responsive auto-fit and diagnostic validation
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerDimensions({ width: clientWidth, height: clientHeight });
        }
        if (boardRef.current) {
          const boardRect = boardRef.current.getBoundingClientRect();
          const boardStyle = window.getComputedStyle(boardRef.current);
          console.log('🔍 [DIAGNOSTIC] Board Metrics:', {
            containerWidth: clientWidth,
            containerHeight: clientHeight,
            boardClientWidth: boardRef.current.clientWidth,
            boardClientHeight: boardRef.current.clientHeight,
            boardBoundingRectWidth: boardRect.width,
            boardBoundingRectHeight: boardRect.height,
            boardAspectRatio: (boardRect.width / (boardRect.height || 1)).toFixed(3),
            flexShrink: boardStyle.flexShrink,
            widthCss: boardStyle.width,
            heightCss: boardStyle.height
          });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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

  const animatedPositionsRef = useRef<Record<string, number>>({});
  const hopStateRef = useRef<{ playerId: string; targetPos: number } | null>(null);

  // Initial sync of ref
  useEffect(() => {
    gameState.players.forEach((p) => {
      if (animatedPositionsRef.current[p.id] === undefined) {
        animatedPositionsRef.current[p.id] = p.position;
      }
    });
  }, []);

  // Track hopping token and landing token
  const [hoppingPlayerId, setHoppingPlayerId] = useState<string | null>(null);
  const [landingPlayerId, setLandingPlayerId] = useState<string | null>(null);

  const prevDiceRef = useRef(gameState.lastDiceResult);
  const prevTurnRef = useRef(gameState.turnNumber);
  const prevActivePlayerRef = useRef(gameState.activePlayerIndex);

  // Calculate pixel center for each tile index (0..39) on the 11x11 flat square board
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
      setManualZoom(null);
    }, 7000);
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
      setManualZoom(null);
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    }
  }, [gameState.lastDiceResult, gameState.turnNumber, gameState.activePlayerIndex]);

  // Step-by-step token hopping animation and synchronized camera tracking
  useEffect(() => {
    // Check if any player's server position differs from their tracked animated position
    const movingPlayer = gameState.players.find((player) => {
      const currentPos = animatedPositionsRef.current[player.id] ?? player.position;
      return currentPos !== player.position;
    });

    if (movingPlayer) {
      const currentPos = animatedPositionsRef.current[movingPlayer.id] ?? movingPlayer.position;
      const targetPos = movingPlayer.position;

      // If already hopping to this exact target position, do not interrupt the animation!
      if (
        hopStateRef.current &&
        hopStateRef.current.playerId === movingPlayer.id &&
        hopStateRef.current.targetPos === targetPos
      ) {
        return;
      }

      // Calculate forward distance
      const distance = (targetPos - currentPos + 40) % 40;

      // Direct teleport for Jail (e.g. Go To Jail) or long jumps (> 12 tiles)
      const isTeleport = distance > 12 || (movingPlayer.inJail && targetPos === 10);

      if (isTeleport) {
        if (hopIntervalRef.current) {
          clearInterval(hopIntervalRef.current);
          hopIntervalRef.current = null;
        }
        hopStateRef.current = null;
        setHoppingPlayerId(null);
        animatedPositionsRef.current[movingPlayer.id] = targetPos;
        setAnimatedPositions((prev) => ({ ...prev, [movingPlayer.id]: targetPos }));
        setLandingPlayerId(movingPlayer.id);
        triggerHaptic('heavy');
        setTimeout(() => setLandingPlayerId(null), 400);
        return;
      }

      // Calculate step-by-step clockwise path
      const steps: number[] = [];
      let stepPos = currentPos;
      while (stepPos !== targetPos) {
        stepPos = (stepPos + 1) % 40;
        steps.push(stepPos);
      }

      if (steps.length > 0) {
        if (hopIntervalRef.current) clearInterval(hopIntervalRef.current);

        hopStateRef.current = { playerId: movingPlayer.id, targetPos };
        setHoppingPlayerId(movingPlayer.id);
        setIsManualControl(false);
        setDragOffset({ x: 0, y: 0 });
        setManualZoom(null);

        let currentStepIdx = 0;
        hopIntervalRef.current = setInterval(() => {
          if (currentStepIdx < steps.length) {
            const nextTile = steps[currentStepIdx];
            animatedPositionsRef.current[movingPlayer.id] = nextTile;
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
            hopStateRef.current = null;
            animatedPositionsRef.current[movingPlayer.id] = targetPos;
            setAnimatedPositions((prev) => ({ ...prev, [movingPlayer.id]: targetPos }));
            setHoppingPlayerId(null);
            setLandingPlayerId(movingPlayer.id);
            triggerHaptic('heavy');
            setTimeout(() => setLandingPlayerId(null), 350);
          }
        }, 140);
      }
    } else {
      // Sync any static player positions to eliminate drift
      const currentHoppingId = hopStateRef.current?.playerId;
      let changed = false;
      const newMap = { ...animatedPositionsRef.current };

      gameState.players.forEach((p) => {
        if (currentHoppingId !== p.id && newMap[p.id] !== p.position) {
          newMap[p.id] = p.position;
          animatedPositionsRef.current[p.id] = p.position;
          changed = true;
        }
      });

      if (changed) {
        setAnimatedPositions({ ...newMap });
      }
    }
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

    if (dist > 6) {
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

  // Calculate exact scale to fit 960px square board into the container with margin
  const overviewScale = useMemo(() => {
    const margin = 12;
    const availableW = Math.max(containerDimensions.width - margin, 240);
    const availableH = Math.max(containerDimensions.height - margin, 240);
    const scale = Math.min(availableW / BOARD_SIZE, availableH / BOARD_SIZE);
    return Math.min(Math.max(scale, 0.28), 1.0);
  }, [containerDimensions.width, containerDimensions.height]);

  const defaultFollowScale = Math.min(overviewScale * 2.2, 1.45);
  const currentScale = manualZoom ?? (cameraMode === 'overview' ? overviewScale : defaultFollowScale);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsManualControl(true);
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setManualZoom((prev) => {
      const current = prev ?? currentScale;
      return Math.min(Math.max(current + delta, overviewScale * 0.8), 1.8);
    });
    resetIdleTimer();
  };

  // Calculate Camera Position in 2D Screen Space
  const targetTileCoords = getTileCenterCoords(focusedTileIndex);
  // Center-relative offsets on flat 2D board
  const targetOffsetX = targetTileCoords.x - BOARD_SIZE / 2;
  const targetOffsetY = targetTileCoords.y - BOARD_SIZE / 2;

  const baseCameraX = cameraMode === 'overview' ? 0 : -targetOffsetX * currentScale;
  const baseCameraY = cameraMode === 'overview' ? 0 : -targetOffsetY * currentScale;

  const totalCameraX = isManualControl ? baseCameraX + dragOffset.x : baseCameraX;
  const totalCameraY = isManualControl ? baseCameraY + dragOffset.y : baseCameraY;

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1 flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Background Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none z-0 opacity-90"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-slate-900/10 to-slate-950/70 pointer-events-none z-0" />

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
          {/* Snap Back to Active Token Button */}
          {isManualControl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                setIsManualControl(false);
                setDragOffset({ x: 0, y: 0 });
                setManualZoom(null);
                setCameraMode('follow');
              }}
              className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-xl border border-amber-200 transition-all active:scale-95 animate-pulse"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>К фишке</span>
            </button>
          )}

          {/* Zoom In Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setIsManualControl(true);
              setManualZoom((prev) => Math.min((prev ?? currentScale) + 0.2, 1.8));
              resetIdleTimer();
            }}
            className="bg-white/95 hover:bg-white text-slate-900 p-2 rounded-full border border-slate-200 shadow-xl active:scale-90 transition-all flex items-center justify-center"
            title="Приблизить"
          >
            <ZoomIn className="w-4 h-4 text-slate-700" />
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setIsManualControl(true);
              setManualZoom((prev) => Math.max((prev ?? currentScale) - 0.2, 0.35));
              resetIdleTimer();
            }}
            className="bg-white/95 hover:bg-white text-slate-900 p-2 rounded-full border border-slate-200 shadow-xl active:scale-90 transition-all flex items-center justify-center"
            title="Отдалить"
          >
            <ZoomOut className="w-4 h-4 text-slate-700" />
          </button>

          {/* Toggle Full Overview / Follow Mode Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setCameraMode((prev) => (prev === 'follow' ? 'overview' : 'follow'));
              setIsManualControl(false);
              setDragOffset({ x: 0, y: 0 });
              setManualZoom(null);
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

      {/* 2D Camera Layer: Handles smooth 2D panning, zooming, and tracking */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate3d(${totalCameraX}px, ${totalCameraY}px, 0px) scale(${currentScale})`,
          transformOrigin: '50% 50%',
          transition: isDragging
            ? 'none'
            : hoppingPlayerId
            ? 'transform 0.16s linear'
            : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Flat 2D Board Container - Strict 1:1 Aspect Ratio (960px x 960px) */}
        <div
          ref={boardRef}
          className="relative rounded-[28px] overflow-hidden bg-slate-900 border-[6px] border-slate-800 pointer-events-auto shadow-[0_24px_70px_rgba(0,0,0,0.6)] shrink-0 flex-shrink-0 aspect-square"
          style={{
            width: `${BOARD_SIZE}px`,
            height: `${BOARD_SIZE}px`,
            minWidth: `${BOARD_SIZE}px`,
            minHeight: `${BOARD_SIZE}px`,
            maxWidth: `${BOARD_SIZE}px`,
            maxHeight: `${BOARD_SIZE}px`,
            flexShrink: 0
          }}
        >
          {/* Central Velvet Board Tray with Monopoly Banner & Dice */}
          <div className="absolute inset-[13.5%] rounded-[24px] bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 border-[5px] border-amber-600/70 flex flex-col items-center justify-center p-6 text-center shadow-[inset_0_10px_40px_rgba(0,0,0,0.8),0_12px_24px_rgba(0,0,0,0.5)] z-0 pointer-events-auto">
            {/* Monopoly Banner */}
            <div className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-red-700 border-2 border-white/80 shadow-[0_5px_0_#991b1b,0_10px_20px_rgba(0,0,0,0.5)] transform -rotate-1 mb-2">
              <div className="text-2xl sm:text-3xl font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-display">
                MONOPOLY
              </div>
            </div>
            <div className="text-[11px] text-emerald-200 font-extrabold uppercase tracking-widest drop-shadow">
              Telegram Mini App Edition
            </div>

            {/* Central Card Decks (Chance & Community Chest) */}
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

            {/* Physical Dice Display */}
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

          {/* 11x11 Grid: Square corner tiles + Rectantic portrait street tiles */}
          <div className="grid grid-cols-[1.35fr_repeat(9,1fr)_1.35fr] grid-rows-[1.35fr_repeat(9,1fr)_1.35fr] w-full h-full gap-1 p-2.5 relative z-10">
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
                            {/* Pawn Shadow */}
                            <div
                              className={`w-8 h-3.5 rounded-full bg-slate-950/75 blur-[1px] absolute -bottom-2 ${
                                isCurrentlyHopping ? 'animate-pawn-shadow-pulse' : ''
                              }`}
                            />
                            {/* Pawn Figurine */}
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

      {/* Integrated Game Logs Pinned to Bottom of Board Area with Soft Fade */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <GameLogs logs={gameState.logs} />
      </div>
    </div>
  );
};
