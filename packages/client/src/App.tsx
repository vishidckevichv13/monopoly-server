import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerState, ClientAction, TimerTickPayload } from '@monopoly/shared';
import { socket } from './socket/socketClient.js';
import { initTelegramApp, getCurrentUser, triggerHapticNotification } from './telegram/tma.js';
import { HeaderHUD } from './components/HeaderHUD.js';
import { GameBoard } from './components/GameBoard.js';
import { BottomActionSheet } from './components/BottomActionSheet.js';
import { AuctionOverlay } from './components/AuctionOverlay.js';
import { TradeModal } from './components/TradeModal.js';
import { LobbyView } from './components/LobbyView.js';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, ArrowUpRight, TrendingDown, Crown, Eye } from 'lucide-react';
import { recordMatchResult } from './utils/ratingSystem.js';

const ACTIVE_SESSION_KEY = 'mono_active_session_v1';

function saveActiveSession(roomId: string, roomName: string) {
  try {
    localStorage.setItem(
      ACTIVE_SESSION_KEY,
      JSON.stringify({
        roomId,
        roomName,
        timestamp: Date.now()
      })
    );
  } catch (e) {
    console.warn('[Session] Failed to save active session to localStorage:', e);
  }
}

function clearActiveSession() {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (e) {
    console.warn('[Session] Failed to clear active session from localStorage:', e);
  }
}

function getCachedActiveSession(): { roomId: string; roomName: string } | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.roomId && Date.now() - (parsed.timestamp || 0) < 3 * 60 * 60 * 1000) {
      return { roomId: parsed.roomId, roomName: parsed.roomName || `Комната #${parsed.roomId}` };
    }
  } catch (e) {
    console.warn('[Session] Failed to read active session from localStorage:', e);
  }
  return null;
}

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<PlayerState>(() => {
    const u = getCurrentUser();
    return {
      id: u.id,
      telegramId: u.telegramId,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      elo: u.elo || 1000,
      level: u.level || 3,
      color: '#3B82F6',
      tokenIndex: 0,
      balance: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      isBot: false,
      isReady: true,
      doublesRolledCount: 0,
      properties: []
    };
  });

  const [currentRoom, setCurrentRoom] = useState<{
    id: string;
    name: string;
    hostId: string;
    isPrivate?: boolean;
    maxPlayers?: number;
    players: PlayerState[];
    isStarted: boolean;
    isSearching?: boolean;
    searchTimeRemaining?: number;
    searchElapsedSeconds?: number;
    autoStartCountdown?: number | null;
  } | null>(null);

  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeGameRoom, setActiveGameRoom] = useState<{ roomId: string; roomName: string } | null>(() => {
    return getCachedActiveSession();
  });
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false);
  const [matchSummary, setMatchSummary] = useState<ReturnType<typeof recordMatchResult> | null>(null);
  const matchResultRecordedRef = useRef<boolean>(false);
  const prevTurnRef = useRef<number | null>(null);
  const prevActivePlayerRef = useRef<number | null>(null);

  useEffect(() => {
    initTelegramApp();

    const requestActiveSessionCheck = () => {
      const u = getCurrentUser();
      const cached = getCachedActiveSession();
      socket.emit('check_active_game', {
        playerId: u.id,
        telegramId: u.telegramId,
        cachedRoomId: cached?.roomId
      });
    };

    const handleConnect = () => {
      console.log('[Socket] Connected to game server');
      requestActiveSessionCheck();

      // Check for deep link / Telegram start_param to auto-join lobby
      try {
        const startParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
        const urlParam =
          new URLSearchParams(window.location.search).get('startapp') ||
          new URLSearchParams(window.location.search).get('join');
        const roomToJoin = startParam || urlParam;

        if (roomToJoin && /^\d{6}$/.test(roomToJoin)) {
          console.log(`[DeepLink] Auto-joining room via invite: ${roomToJoin}`);
          socket.emit('join_room', {
            roomId: roomToJoin,
            player: currentUser,
            autoReady: true
          });
        }
      } catch (err) {
        console.warn('[DeepLink] Deep link auto-join error:', err);
      }
    };

    socket.on('connect', handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    // When app regains visibility (e.g. user resumes Telegram), re-check active session
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (socket.connected) {
          requestActiveSessionCheck();
        } else {
          socket.connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    socket.on('active_game_found', (data: { roomId: string; roomName: string }) => {
      console.log('[Session] Active match detected:', data);
      setActiveGameRoom(data);
      saveActiveSession(data.roomId, data.roomName);
    });

    socket.on('no_active_game', () => {
      setActiveGameRoom(null);
      clearActiveSession();
    });

    socket.on('room_created', (data: { roomId: string }) => {
      console.log('[Room] Created:', data.roomId);
    });

    socket.on('room_list', (rooms: any[]) => {
      setPublicRooms(rooms || []);
    });

    socket.on('room_updated', (data: any) => {
      setCurrentRoom(data);
      if (data && data.isStarted) {
        saveActiveSession(data.id, data.name);
      }
    });

    socket.on('game_state', (state: GameState) => {
      // Auto-clear inspected tile on new turn or turn phase change so camera tracks the player
      if (
        prevTurnRef.current !== state.turnNumber ||
        prevActivePlayerRef.current !== state.activePlayerIndex
      ) {
        prevTurnRef.current = state.turnNumber;
        prevActivePlayerRef.current = state.activePlayerIndex;
        setSelectedTileIndex(null);
      }

      setGameState(state);
      if (state.roomId) {
        saveActiveSession(state.roomId, `Матч #${state.roomId}`);
      }

      const isSpectator = state.players.find((p) => p.id === currentUser.id)?.isSpectator;

      if (state.turnPhase === 'GAME_OVER') {
        clearActiveSession();
        setActiveGameRoom(null);

        if (state.winnerId && !matchResultRecordedRef.current && !isSpectator) {
          matchResultRecordedRef.current = true;
          const isWinner = state.winnerId === currentUser.id;
          const bankruptCount = state.players.filter((p) => p.isBankrupt && p.id !== currentUser.id).length;
          const summary = recordMatchResult(isWinner, bankruptCount);
          setMatchSummary(summary);

          setCurrentUser((prev) => ({
            ...prev,
            elo: summary.newElo,
            level: summary.newTier.level
          }));

          if (isWinner) {
            triggerHapticNotification('success');
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.55 }
            });
          } else {
            triggerHapticNotification('warning');
          }
        }
      }
    });

    socket.on('timer_tick', (data: TimerTickPayload) => {
      setGameState((prev) => {
        if (!prev) return null;
        let changed = false;
        let updated = prev;

        if (prev.turnTimeRemaining !== data.turnTimeRemaining) {
          updated = { ...updated, turnTimeRemaining: data.turnTimeRemaining };
          changed = true;
        }

        if (
          updated.auctionState &&
          data.auctionTimeRemaining !== undefined &&
          data.auctionTimeRemaining !== null &&
          updated.auctionState.timeRemaining !== data.auctionTimeRemaining
        ) {
          updated = {
            ...updated,
            auctionState: {
              ...updated.auctionState,
              timeRemaining: data.auctionTimeRemaining
            }
          };
          changed = true;
        }

        return changed ? updated : prev;
      });
    });

    socket.on('error_message', (data: { message: string }) => {
      triggerHapticNotification('error');
      alert(data.message);
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('connect', handleConnect);
      socket.off('active_game_found');
      socket.off('no_active_game');
      socket.off('room_created');
      socket.off('room_list');
      socket.off('room_updated');
      socket.off('game_state');
      socket.off('timer_tick');
      socket.off('error_message');
    };
  }, []);

  const handleCreateRoom = (maxPlayers: number = 4, isPrivate: boolean = true) => {
    socket.emit('create_room', { player: currentUser, maxPlayers, isPrivate });
  };

  const handleStartMatchmaking = () => {
    if (currentRoom) {
      socket.emit('start_matchmaking', { roomId: currentRoom.id, playerId: currentUser.id });
    }
  };

  const handleCancelMatchmaking = () => {
    if (currentRoom) {
      socket.emit('cancel_matchmaking', { roomId: currentRoom.id, playerId: currentUser.id });
    }
  };

  const handleRefreshRooms = () => {
    socket.emit('get_rooms');
  };

  const handleJoinRoom = (roomId: string) => {
    socket.emit('join_room', { roomId, player: currentUser, autoReady: true });
  };

  const handleAddBot = () => {
    if (currentRoom) {
      socket.emit('add_bot', { roomId: currentRoom.id });
    }
  };

  const handleStartGame = () => {
    if (currentRoom) {
      socket.emit('start_game', { roomId: currentRoom.id });
    }
  };

  const handleSendAction = (action: ClientAction) => {
    if (currentRoom) {
      socket.emit('game_action', {
        roomId: currentRoom.id,
        playerId: currentUser.id,
        action
      });
    }
  };

  const handleSurrenderAndSpectate = () => {
    const isSpectator = currentRoom?.players.find((p) => p.id === currentUser.id)?.isSpectator;
    if (gameState && gameState.turnPhase !== 'GAME_OVER' && !matchResultRecordedRef.current && !isSpectator) {
      matchResultRecordedRef.current = true;
      const summary = recordMatchResult(false, 0);
      setMatchSummary(summary);
      setCurrentUser((prev) => ({
        ...prev,
        elo: summary.newElo,
        level: summary.newTier.level
      }));
    }

    if (currentRoom) {
      socket.emit('game_action', {
        roomId: currentRoom.id,
        playerId: currentUser.id,
        action: { type: 'SURRENDER' }
      });
    }
  };

  const handleLeaveRoom = () => {
    const isSpectator = currentRoom?.players.find((p) => p.id === currentUser.id)?.isSpectator;

    // If active participant leaves in-progress match, deduct ELO and record loss
    if (gameState && gameState.turnPhase !== 'GAME_OVER' && !matchResultRecordedRef.current && !isSpectator) {
      matchResultRecordedRef.current = true;
      const summary = recordMatchResult(false, 0);
      setMatchSummary(summary);
      setCurrentUser((prev) => ({
        ...prev,
        elo: summary.newElo,
        level: summary.newTier.level
      }));
    }

    if (currentRoom) {
      socket.emit('leave_room', {
        roomId: currentRoom.id,
        playerId: currentUser.id
      });
    }
    clearActiveSession();
    setActiveGameRoom(null);
    setCurrentRoom(null);
    setGameState(null);
    setSelectedTileIndex(null);
    setIsTradeModalOpen(false);
    matchResultRecordedRef.current = false;
  };

  const handleReturnToGame = () => {
    if (!activeGameRoom) return;
    socket.emit('join_room', {
      roomId: activeGameRoom.roomId,
      player: currentUser,
      autoReady: true
    });
  };

  const isUserSpectator = currentRoom?.players.find((p) => p.id === currentUser.id)?.isSpectator;

  return (
    <div className="flex flex-col h-full h-[var(--app-height,100dvh)] min-h-[var(--app-height,100dvh)] max-h-[var(--app-height,100dvh)] w-screen max-w-lg mx-auto bg-slate-950 overflow-hidden relative select-none font-sans">
      {!gameState ? (
        <LobbyView
          currentUser={currentUser}
          currentRoom={currentRoom}
          publicRooms={publicRooms}
          activeGameRoom={activeGameRoom}
          onReturnToGame={handleReturnToGame}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onStartMatchmaking={handleStartMatchmaking}
          onCancelMatchmaking={handleCancelMatchmaking}
          onRefreshRooms={handleRefreshRooms}
          onAddBot={handleAddBot}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full justify-between relative overflow-hidden">
          {/* Top HUD with Confirmation Leave */}
          <HeaderHUD
            gameState={gameState}
            myPlayerId={currentUser.id}
            onConfirmLeave={handleLeaveRoom}
            onSurrenderAndSpectate={handleSurrenderAndSpectate}
          />

          {/* 3D Isometric Game Board with Integrated Floating Event Logs */}
          <GameBoard
            gameState={gameState}
            selectedTileIndex={selectedTileIndex}
            onSelectTile={(tileIdx) => setSelectedTileIndex(tileIdx)}
          />

          {/* Action Area & Selected Tile Bottom Sheet */}
          <BottomActionSheet
            gameState={gameState}
            myPlayerId={currentUser.id}
            selectedTileIndex={selectedTileIndex}
            onCloseInspect={() => setSelectedTileIndex(null)}
            onSendAction={handleSendAction}
            onOpenTrade={() => setIsTradeModalOpen(true)}
          />

          {/* Real-Time Live Auction Overlay */}
          {gameState.turnPhase === 'AUCTION' && gameState.auctionState && (
            <AuctionOverlay
              gameState={gameState}
              myPlayerId={currentUser.id}
              onSendAction={handleSendAction}
            />
          )}

          {/* Trade / Exchange Proposal & Response Modal */}
          {(isTradeModalOpen || !!gameState.activeTrade) && (
            <TradeModal
              gameState={gameState}
              myPlayerId={currentUser.id}
              isOpen={isTradeModalOpen}
              onClose={() => setIsTradeModalOpen(false)}
              onSendAction={handleSendAction}
            />
          )}

          {/* Winner & ELO Match Summary Game Over Modal */}
          {gameState.turnPhase === 'GAME_OVER' && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center animate-fade-in overflow-y-auto">
              {/* Main Icon */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.5)] mb-3">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  {gameState.winnerId === currentUser.id ? (
                    <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                  ) : (
                    <Crown className="w-10 h-10 text-amber-400" />
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-black text-white mb-0.5 font-display">
                {gameState.winnerId === currentUser.id ? '🏆 ПОБЕДА В МАТЧЕ!' : 'МАТЧ ЗАВЕРШЕН'}
              </h2>

              <p className="text-sm font-bold text-slate-300 mb-4">
                Победитель:{' '}
                <span className="text-amber-400 font-black">
                  {gameState.players.find((p) => p.id === gameState.winnerId)?.displayName}
                </span>
              </p>

              {/* Spectator notice */}
              {isUserSpectator && (
                <div className="w-full max-w-xs bg-slate-900/90 border-2 border-blue-500/40 rounded-3xl p-4 mb-4 shadow-xl flex items-center justify-center gap-2 text-blue-300 text-xs font-bold">
                  <Eye className="w-5 h-5 text-blue-400 shrink-0" />
                  <span>Вы смотрели матч как зритель. Рейтинг не изменился.</span>
                </div>
              )}

              {/* ELO Rating Change Card */}
              {matchSummary && !isUserSpectator && (
                <div className="w-full max-w-xs bg-slate-900/90 border-2 border-slate-700/80 rounded-3xl p-4 mb-4 shadow-xl flex flex-col gap-3">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Изменение рейтинга ELO
                  </div>

                  <div className="flex items-center justify-around">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 font-bold">Было</span>
                      <span className="text-sm font-mono font-bold text-slate-300">
                        {matchSummary.oldElo}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1 text-lg font-mono font-black px-3 py-1 rounded-2xl border ${
                        matchSummary.delta >= 0
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                          : 'bg-rose-500/20 text-rose-400 border-rose-400/40'
                      }`}
                    >
                      {matchSummary.delta >= 0 ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span>
                        {matchSummary.delta >= 0 ? `+${matchSummary.delta}` : matchSummary.delta} ELO
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 font-bold">Стало</span>
                      <span className="text-sm font-mono font-black text-amber-400">
                        {matchSummary.newElo}
                      </span>
                    </div>
                  </div>

                  {/* Rank Up / Rank Tier Badge */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xs px-2.5 py-0.5 rounded-lg font-black border ${matchSummary.newTier.badgeBg} ${matchSummary.newTier.badgeBorder} ${matchSummary.newTier.badgeText}`}
                      >
                        LVL {matchSummary.newTier.level}
                      </div>
                      <span className="text-xs font-black text-white">
                        {matchSummary.newTier.title}
                      </span>
                    </div>

                    {matchSummary.rankUp && (
                      <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">
                        🎉 RANK UP!
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  matchResultRecordedRef.current = false;
                  setMatchSummary(null);
                  handleLeaveRoom();
                }}
                className="w-full max-w-xs py-3.5 btn-3d-green text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Вернуться в Лобби</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
