import React, { useState } from 'react';
import { PlayerState } from '@monopoly/shared';
import {
  Play,
  Share2,
  Crown,
  Sparkles,
  Bot,
  Trophy,
  BarChart3,
  Home,
  Copy,
  Check,
  Zap,
  ArrowRight,
  TrendingUp,
  Award,
  LogOut,
  Flame,
  Gamepad2,
  ShieldCheck,
  UserPlus,
  Users,
  Globe,
  Eye,
  Search,
  X,
  RefreshCw,
  Radio,
  Swords
} from 'lucide-react';
import { triggerHaptic } from '../telegram/tma.js';
import {
  getRankTier,
  calculateLevelProgress,
  getUserRating,
  getUserStats,
  getIntegratedLeaderboard
} from '../utils/ratingSystem.js';

interface LobbyViewProps {
  currentUser: PlayerState;
  currentRoom: {
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
  } | null;
  publicRooms: any[];
  activeGameRoom?: { roomId: string; roomName: string } | null;
  onReturnToGame?: () => void;
  onCreateRoom: (maxPlayers?: number, isPrivate?: boolean) => void;
  onJoinRoom: (roomId: string) => void;
  onStartMatchmaking: () => void;
  onCancelMatchmaking: () => void;
  onRefreshRooms: () => void;
  onAddBot: () => void;
  onStartGame: () => void;
  onLeaveRoom?: () => void;
}

type TabType = 'home' | 'leaderboard' | 'stats';
type LeaderboardScope = 'global' | 'friends';

export const LobbyView: React.FC<LobbyViewProps> = ({
  currentUser,
  currentRoom,
  publicRooms,
  activeGameRoom,
  onReturnToGame,
  onCreateRoom,
  onJoinRoom,
  onStartMatchmaking,
  onCancelMatchmaking,
  onRefreshRooms,
  onAddBot,
  onStartGame: _onStartGame,
  onLeaveRoom
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [leaderboardScope, setLeaderboardScope] = useState<LeaderboardScope>('global');
  const [inputRoomId, setInputRoomId] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Play modal state
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [playModalTab, setPlayModalTab] = useState<'create' | 'join'>('create');
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState<2 | 3 | 4>(4);

  const isHost = currentRoom ? currentRoom.hostId === currentUser.id : false;
  const isSpectator = currentRoom?.players.find((p) => p.id === currentUser.id)?.isSpectator;
  const activePlayers = currentRoom ? currentRoom.players.filter((p) => !p.isSpectator) : [];
  const maxRoomPlayers = currentRoom?.maxPlayers || 4;

  // Rating and Tier
  const currentElo = currentUser.elo || getUserRating();
  const currentTier = getRankTier(currentElo);
  const progress = calculateLevelProgress(currentElo);
  const userStats = getUserStats();

  const handleCopyRoomId = (code: string) => {
    triggerHaptic('medium');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getBotUsername = () => {
    try {
      return (window as any).Telegram?.WebApp?.initDataUnsafe?.bot_username || 'monopoly_game_bot';
    } catch {
      return 'monopoly_game_bot';
    }
  };

  const handleShareInvite = () => {
    triggerHaptic('heavy');
    if (!currentRoom) return;

    const botName = getBotUsername();
    const tmaLink = `https://t.me/${botName}/app?startapp=${currentRoom.id}`;
    const shareText = `🎲 Я создал комнату в Монополии! PIN: ${currentRoom.id}\nЗаходи играть со мной!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(tmaLink)}&text=${encodeURIComponent(shareText)}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(tmaLink);
      alert(`Ссылка на комнату скопирована в буфер обмена!\n${tmaLink}`);
    }
  };

  const handleShareFriendInvite = () => {
    triggerHaptic('heavy');
    const botName = getBotUsername();
    const tmaLink = `https://t.me/${botName}/app`;
    const shareText = `🔥 Я играю в Монополию Онлайн! Мой рейтинг: ${currentElo} ELO («${currentTier.title}»). Попробуй победить меня!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(tmaLink)}&text=${encodeURIComponent(shareText)}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(tmaLink);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };

  const handlePasteCode = async () => {
    triggerHaptic('light');
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const clean = text.replace(/\D/g, '').slice(0, 6);
        if (clean) {
          setInputRoomId(clean);
        }
      }
    } catch {
      // Ignore clipboard access denied
    }
  };

  // Helper for Rank Level Badge
  const renderRankBadge = (level: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const tier = getRankTier(level <= 10 ? (level === 1 ? 500 : (level - 1) * 200 + 800) : level);
    const sizeClasses = {
      sm: 'text-[9px] px-1.5 py-0.5 rounded-md font-black',
      md: 'text-[10px] px-2 py-0.5 rounded-lg font-black',
      lg: 'text-xs px-2.5 py-1 rounded-xl font-black'
    };

    return (
      <div
        className={`inline-flex items-center gap-1 border shadow-sm ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeText} ${sizeClasses[size]}`}
      >
        <span>LVL {level}</span>
      </div>
    );
  };

  // -------------------------------------------------------------
  // 1. WAITING ROOM SCREEN (WHEN ROOM IS JOINED / CREATED)
  // -------------------------------------------------------------
  if (currentRoom) {
    const activeCount = currentRoom.players.filter((p) => !p.isSpectator).length;
    const emptySlotsCount = Math.max(0, maxRoomPlayers - activeCount);
    const isSearching = !!currentRoom.isSearching;
    const isAutoStarting = currentRoom.autoStartCountdown !== null && currentRoom.autoStartCountdown !== undefined;
    const searchSeconds = currentRoom.searchElapsedSeconds ?? 1;

    return (
      <div className="flex-1 flex flex-col justify-between px-4 pt-[max(var(--safe-top),14px)] pb-[max(var(--safe-bottom),14px)] max-w-md mx-auto w-full relative overflow-y-auto">
        {/* Top Header & Back Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onLeaveRoom) onLeaveRoom();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold active:scale-95 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 rotate-180 text-red-400" />
            <span>Выйти</span>
          </button>

          {isSpectator ? (
            <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/40 px-3 py-1 rounded-full">
              <Eye className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
              <span className="text-[11px] font-black text-blue-200">Режим зрителя</span>
            </div>
          ) : isAutoStarting ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/60 px-3 py-1 rounded-full animate-bounce">
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span className="text-[11px] font-black text-emerald-300">
                Запуск через {currentRoom.autoStartCountdown} сек...
              </span>
            </div>
          ) : isSearching ? (
            <div className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/50 px-3 py-1 rounded-full animate-pulse">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span className="text-[11px] font-black text-indigo-300 font-mono">
                Поиск... {searchSeconds}s
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-black text-amber-300">
                Ожидание игроков ({activeCount}/{maxRoomPlayers})
              </span>
            </div>
          )}
        </div>

        {/* Room PIN Code Banner */}
        <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/95 border-2 border-slate-700 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              {currentRoom.name}
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
              {maxRoomPlayers === 2 ? '2 игрока (Дуэль)' : maxRoomPlayers === 3 ? '3 игрока (Трио)' : '4 игрока'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
              {currentRoom.id}
            </span>
            <button
              onClick={() => handleCopyRoomId(currentRoom.id)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-600 transition flex items-center justify-center cursor-pointer"
              title="Скопировать PIN-код"
            >
              {copiedCode ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5 text-slate-300" />
              )}
            </button>
          </div>

          <div className="w-full flex items-center justify-center gap-2 pt-1">
            <button
              onClick={handleShareInvite}
              className="w-full py-2.5 px-4 btn-3d-blue text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <span>Пригласить друга в Telegram</span>
            </button>
          </div>
        </div>

        {/* Players Grid / Slots */}
        <div className="flex-1 my-3.5 flex flex-col gap-2.5">
          <div className="text-xs font-black text-slate-300 flex items-center justify-between px-1">
            <span>Участники ({activeCount}/{maxRoomPlayers})</span>
            {isHost && activeCount < maxRoomPlayers && !isSearching && !isAutoStarting && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onAddBot();
                }}
                className="text-amber-300 hover:text-amber-200 flex items-center gap-1 text-xs font-black bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-400/50 active:scale-95 transition cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Добавить AI</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentRoom.players.map((p, idx) => {
              const pElo = p.elo || 1000;
              const pTier = getRankTier(pElo);

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl shadow-md border-2 transition-all ${
                    p.isSpectator
                      ? 'bg-slate-900/60 border-blue-900/50'
                      : 'bg-slate-900/90 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="w-10 h-10 rounded-2xl border-2 border-white/80 object-cover shadow-md"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-2xl border-2 border-white/80 shadow-md flex items-center justify-center font-black text-sm text-white"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.isSpectator ? <Eye className="w-5 h-5 text-white" /> : p.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-black text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {idx + 1}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{p.displayName}</span>
                        {p.id === currentRoom.hostId && (
                          <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 font-bold">
                          @{p.username}
                        </span>
                        {!p.isSpectator && (
                          <span className="text-[11px] font-mono font-bold text-amber-400">
                            {pElo} ELO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {p.isSpectator ? (
                      <span className="text-[10px] font-black text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-400/40">
                        Зритель
                      </span>
                    ) : (
                      <>
                        <div
                          className={`text-[10px] px-2 py-0.5 rounded-md font-black border ${pTier.badgeBg} ${pTier.badgeBorder} ${pTier.badgeText}`}
                        >
                          LVL {pTier.level}
                        </div>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/40">
                          Готов
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className={`flex items-center justify-between p-3 border-2 border-dashed rounded-2xl transition ${
                  isSearching
                    ? 'bg-indigo-950/30 border-indigo-500/50 animate-pulse shadow-inner'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isSearching ? 'bg-indigo-900/50 border border-indigo-400/60 text-indigo-300 shadow-md' : 'bg-slate-800/80 border border-slate-700 text-slate-500'
                  }`}>
                    {isSearching ? <Search className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isSearching ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {isSearching ? 'Поиск соперника...' : 'Свободный слот'}
                    </span>
                    {isSearching && (
                      <span className="text-[10px] text-indigo-400/80">
                        Подключение игроков / ботов
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unified Single Action Button in Waiting Room */}
        <div className="flex flex-col gap-2 pt-1">
          {isAutoStarting ? (
            <div className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse font-display">
              <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              <span>ЗАПУСК ЧЕРЕЗ {currentRoom.autoStartCountdown} СЕК...</span>
            </div>
          ) : isHost ? (
            isSearching ? (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onCancelMatchmaking();
                }}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(129,140,248,0.45)] active:scale-95 cursor-pointer transition border border-indigo-300/40 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none" />
                <Radio className="w-6 h-6 text-indigo-200 animate-spin shrink-0" />
                <span className="font-display tracking-wide drop-shadow">
                  Поиск... {searchSeconds}s
                </span>
                <span className="text-[11px] font-semibold text-indigo-200/90 bg-black/40 px-2.5 py-1 rounded-xl ml-1 border border-indigo-300/30">
                  Отмена
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onStartMatchmaking();
                }}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(99,102,241,0.4)] active:scale-95 cursor-pointer transition border border-indigo-400/40 font-display"
              >
                <Search className="w-6 h-6 text-indigo-200" />
                <span className="tracking-wide">ПОИСК ИГРОКОВ</span>
              </button>
            )
          ) : (
            <div className="w-full py-4 bg-slate-900/90 rounded-2xl text-center text-xs font-black text-slate-400 border border-slate-800 shadow-inner flex items-center justify-center gap-2">
              {isSearching ? (
                <>
                  <Radio className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span className="text-indigo-300 font-mono">Поиск игроков... {searchSeconds}s</span>
                </>
              ) : (
                <span>⏳ Ожидание запуска создателем комнаты...</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Leaderboard data calculation
  const leaderboardResult = getIntegratedLeaderboard(leaderboardScope, {
    displayName: currentUser.displayName,
    username: currentUser.username,
    avatarUrl: currentUser.avatarUrl,
    elo: currentElo,
    level: currentTier.level
  });

  const podiumPlayers = leaderboardResult.list.slice(0, 3);
  const listPlayers = leaderboardResult.list.slice(3, 10);

  // -------------------------------------------------------------
  // 2. MAIN LOBBY HUB (TABS: HOME / LEADERBOARD / STATS)
  // -------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col justify-between px-4 pt-[max(var(--safe-top),14px)] pb-[max(var(--safe-bottom),14px)] max-w-md mx-auto w-full relative overflow-hidden">
      {/* Top Profile Header HUD */}
      <div className="bg-slate-900/90 border-2 border-slate-800/90 rounded-3xl p-3.5 shadow-xl flex flex-col gap-2.5 mb-3">
        <div className="flex items-center justify-between gap-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-md">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-full h-full rounded-[14px] object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-slate-800 flex items-center justify-center text-white font-black text-base">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className={`absolute -bottom-1 -right-1.5 text-[9px] font-black px-1.5 py-0.2 rounded-md border border-white/80 shadow ${currentTier.badgeBg} ${currentTier.badgeText}`}
              >
                LVL {currentTier.level}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-sm font-black text-white flex items-center gap-1 truncate max-w-[160px] sm:max-w-[190px]">
                <span>{currentUser.displayName}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-mono font-black text-amber-400">
                  {currentElo.toLocaleString()} ELO
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  • {currentTier.title}
                </span>
              </div>
            </div>
          </div>

          {/* User Rank Title Badge */}
          <div className="flex items-center">
            <div className={`px-3 py-1.5 rounded-2xl border text-xs font-black shadow-md ${currentTier.badgeBg} ${currentTier.badgeBorder} ${currentTier.badgeText}`}>
              {currentTier.title}
            </div>
          </div>
        </div>

        {/* ELO Progress Bar to next Rank Tier */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-400 flex items-center gap-1">
              <span>Уровень {currentTier.level}</span>
              <span className="text-slate-600">→</span>
              <span className="text-amber-300 font-black">
                {progress.nextLevel ? `LVL ${progress.nextLevel}` : 'MAX'}
              </span>
            </span>
            <span className="text-amber-400 font-mono">
              {progress.nextLevel
                ? `${progress.neededForNext} ELO до повышения`
                : 'Максимальный ранг'}
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${currentTier.badgeBg}`}
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-2 scrollbar-none">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-3.5 animate-fade-in">
            {/* Active Game Return Banner */}
            {activeGameRoom && onReturnToGame && (
              <div className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-3xl p-4 border-2 border-emerald-300 shadow-[0_8px_24px_rgba(16,185,129,0.4)] flex items-center justify-between text-white animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-black/25 flex items-center justify-center text-2xl shadow-inner">
                    🎲
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-emerald-100 uppercase tracking-wider">
                      Матч в процессе
                    </div>
                    <div className="text-sm font-black text-white">
                      {activeGameRoom.roomName || `Комната #${activeGameRoom.roomId}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    onReturnToGame();
                  }}
                  className="px-4 py-2.5 bg-white text-emerald-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Вернуться в игру</span>
                  <ArrowRight className="w-4 h-4 text-emerald-700" />
                </button>
              </div>
            )}

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-to-b from-purple-900/40 to-slate-900/90 border border-purple-500/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-md">
                <Crown className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Ранг</span>
                <span className="text-xs font-black text-white truncate max-w-full">
                  {currentTier.title}
                </span>
              </div>

              <div className="bg-gradient-to-b from-emerald-900/40 to-slate-900/90 border border-emerald-500/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-md">
                <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Винрейт</span>
                <span className="text-xs font-black text-emerald-300">
                  {userStats.matches > 0
                    ? `${Math.round((userStats.wins / userStats.matches) * 100)}% (${userStats.wins}W)`
                    : '67% (8W)'}
                </span>
              </div>

              <div className="bg-gradient-to-b from-blue-900/40 to-slate-900/90 border border-blue-500/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-md">
                <Gamepad2 className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Матчей</span>
                <span className="text-xs font-black text-blue-200">
                  {userStats.matches} игр
                </span>
              </div>
            </div>

            {/* BIG JUICY PLAY BUTTON */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onRefreshRooms();
                  setIsPlayModalOpen(true);
                }}
                className="w-full py-4 btn-3d-green text-white font-black text-xl rounded-2xl flex items-center justify-center gap-3 active:scale-95 cursor-pointer shadow-2xl"
              >
                <Play className="w-7 h-7 text-white fill-white" />
                <span className="font-display tracking-wider text-2xl drop-shadow">ИГРАТЬ</span>
              </button>
            </div>

            {/* QUICK ACTIVE ROOMS PREVIEW BANNER */}
            {publicRooms && publicRooms.length > 0 && (
              <div
                onClick={() => {
                  triggerHaptic('light');
                  setPlayModalTab('join');
                  setIsPlayModalOpen(true);
                }}
                className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border-2 border-indigo-500/40 rounded-3xl p-3.5 flex items-center justify-between shadow-md cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-2">
                      <span>Доступные группы</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-black">
                        {publicRooms.length} активных
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold">
                      Нажмите, чтобы присоединиться к матчу
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-400" />
              </div>
            )}

            {/* SOLO PRACTICE VS AI */}
            <div
              onClick={() => {
                triggerHaptic('heavy');
                onCreateRoom(4, true);
                setTimeout(() => {
                  onAddBot();
                  onAddBot();
                  onAddBot();
                }, 400);
              }}
              className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/30 hover:border-indigo-500/60 rounded-3xl p-3.5 shadow-md flex items-center justify-between cursor-pointer active:scale-98 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Одиночная игра с AI</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold">Быстро</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold">
                    Тренировочный матч против 3 AI
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* Filter switch: Global vs Friends */}
            <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800 flex items-center">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setLeaderboardScope('global');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  leaderboardScope === 'global'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Глобальный Топ</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setLeaderboardScope('friends');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  leaderboardScope === 'friends'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Среди друзей</span>
              </button>
            </div>

            {/* Top 3 Podium Cards */}
            {podiumPlayers.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 my-1">
                {/* Place 2 */}
                <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl p-2.5 flex flex-col items-center text-center relative mt-3 shadow-md">
                  <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center -mt-6 border-2 border-slate-700 shadow">
                    🥈 2
                  </div>
                  <div className="mt-1">
                    {renderRankBadge(podiumPlayers[1].level, 'sm')}
                  </div>
                  <div className="text-xs font-black text-white mt-1 truncate max-w-[85px]">
                    {podiumPlayers[1].name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono font-bold">
                    {podiumPlayers[1].elo} ELO
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {podiumPlayers[1].winrate}% WR
                  </div>
                </div>

                {/* Place 1 */}
                <div className="bg-gradient-to-b from-amber-950/60 to-slate-900/95 border-2 border-amber-500/60 rounded-2xl p-2.5 flex flex-col items-center text-center relative shadow-xl">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center -mt-6 border-2 border-white shadow-lg">
                    👑 1
                  </div>
                  <div className="mt-1">
                    {renderRankBadge(podiumPlayers[0].level, 'sm')}
                  </div>
                  <div className="text-xs font-black text-amber-300 mt-1 truncate max-w-[85px]">
                    {podiumPlayers[0].name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono font-black">
                    {podiumPlayers[0].elo} ELO
                  </div>
                  <div className="text-[9px] text-emerald-400 font-bold">
                    🔥 {podiumPlayers[0].winrate}% WR
                  </div>
                </div>

                {/* Place 3 */}
                <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl p-2.5 flex flex-col items-center text-center relative mt-4 shadow-md">
                  <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center -mt-6 border-2 border-slate-700 shadow">
                    🥉 3
                  </div>
                  <div className="mt-1">
                    {renderRankBadge(podiumPlayers[2].level, 'sm')}
                  </div>
                  <div className="text-xs font-black text-white mt-1 truncate max-w-[85px]">
                    {podiumPlayers[2].name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono font-bold">
                    {podiumPlayers[2].elo} ELO
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {podiumPlayers[2].winrate}% WR
                  </div>
                </div>
              </div>
            )}

            {/* Invite Friend Banner (shown in Friends tab) */}
            {leaderboardScope === 'friends' && (
              <div
                onClick={handleShareFriendInvite}
                className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-blue-900/40 border border-blue-500/40 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer active:scale-98 transition shadow"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Пригласить друзей в рейтинг</div>
                    <div className="text-[10px] text-blue-300">Узнайте, кто сильнее в Монополии!</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-blue-500 text-white text-[11px] font-black rounded-xl cursor-pointer">
                  Позвать
                </button>
              </div>
            )}

            {/* Places 4-10 List */}
            <div className="flex flex-col gap-1.5">
              {listPlayers.map((item) => {
                const itemTier = getRankTier(item.elo);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
                      item.isCurrentUser
                        ? 'bg-amber-500/20 border-amber-500/50 shadow-md'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 font-mono text-xs font-black text-slate-400 text-center">
                        #{item.rank}
                      </span>

                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.avatarBg} flex items-center justify-center text-white font-black text-xs shadow-inner`}
                      >
                        {item.name.charAt(0)}
                      </div>

                      <div className="flex flex-col">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.isCurrentUser && (
                            <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                              ВЫ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @{item.username}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-black border ${itemTier.badgeBg} ${itemTier.badgeBorder} ${itemTier.badgeText}`}
                      >
                        LVL {itemTier.level}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-black text-amber-400">
                          {item.elo} ELO
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {item.winrate}% WR
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* User Rank Pinned Footer */}
            <div className="mt-1 p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                  #{leaderboardResult.userRank}
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{currentUser.displayName} (Вы)</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${currentTier.badgeBg} ${currentTier.badgeBorder} ${currentTier.badgeText}`}
                    >
                      LVL {currentTier.level}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {leaderboardScope === 'global'
                      ? 'Входите в топ 5% игроков'
                      : `Ваше место среди друзей: #${leaderboardResult.userRank}`}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-amber-300">
                {currentElo} ELO
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: STATS */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Личный кабинет и статистика</span>
              </span>
              <span className="text-[11px] text-amber-400 font-bold">Рейтинг ELO</span>
            </div>

            {/* Rank Card Banner */}
            <div className={`p-4 rounded-2xl border-2 ${currentTier.badgeBg} ${currentTier.badgeBorder} flex items-center justify-between shadow-xl`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black/30 border border-white/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                    Ранг: Уровень {currentTier.level}
                  </div>
                  <div className="text-lg font-black text-white">
                    {currentTier.title}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black font-mono text-amber-300">
                  {currentElo}
                </div>
                <div className="text-[10px] font-bold text-white/70 uppercase">
                  Рейтинг ELO
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Сыграно матчей</span>
                <span className="text-xl font-black text-white font-mono">{userStats.matches}</span>
                <span className="text-[10px] text-slate-500">
                  {userStats.wins} побед / {userStats.losses} поражений
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Винрейт</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {userStats.matches > 0
                    ? `${Math.round((userStats.wins / userStats.matches) * 100)}%`
                    : '67%'}
                </span>
                <span className="text-[10px] text-emerald-500 font-bold">
                  {userStats.winStreak > 0 ? `🔥 Серия: ${userStats.winStreak} побед(ы)` : 'Готов к новым победам'}
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Банкротств соперников</span>
                <span className="text-xl font-black text-amber-400 font-mono">{userStats.bankruptcies}</span>
                <span className="text-[10px] text-slate-500">Выбиваний из игры</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Рекорд ELO</span>
                <span className="text-xl font-black text-blue-400 font-mono">{userStats.bestElo}</span>
                <span className="text-[10px] text-slate-500">Максимум за всё время</span>
              </div>
            </div>

            {/* Favorite Monopolies & Achievements Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Любимые корпорации</span>
              </span>

              <div className="flex items-center justify-between text-xs p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-300">🍎 Apple & 💻 Microsoft (IT)</span>
                <span className="font-mono font-black text-amber-400">84% сборов</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-300">✈️ Авиалинии & Космос</span>
                <span className="font-mono font-black text-amber-400">62% сборов</span>
              </div>
            </div>

            {/* Integrity Badge */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-[11px] font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Честная игра: игровой сервер рассчитывает ELO и все броски кубиков без читов</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION TAB BAR (Home in Center) */}
      <div className="pt-2">
        <div className="bg-slate-900/95 border-2 border-slate-800/90 rounded-3xl p-1.5 flex items-center justify-around shadow-2xl backdrop-blur-md">
          {/* Leaderboard Tab (Left) */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('leaderboard');
            }}
            className={`flex-1 py-2.5 px-3 rounded-2xl flex flex-col items-center gap-1 transition cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black shadow-inner'
                : 'text-slate-400 hover:text-slate-200 font-bold'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px]">Рейтинг</span>
          </button>

          {/* Home Tab (Center, prominent) */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('home');
            }}
            className={`flex-1 py-2.5 px-3 rounded-2xl flex flex-col items-center gap-1 transition cursor-pointer ${
              activeTab === 'home'
                ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/50 font-black shadow-inner scale-105'
                : 'text-slate-400 hover:text-slate-200 font-bold'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Главная</span>
          </button>

          {/* Stats Tab (Right) */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('stats');
            }}
            className={`flex-1 py-2.5 px-3 rounded-2xl flex flex-col items-center gap-1 transition cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-black shadow-inner'
                : 'text-slate-400 hover:text-slate-200 font-bold'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px]">Статистика</span>
          </button>
        </div>
      </div>

      {/* PLAY / MATCH SELECTION MODAL */}
      {isPlayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 max-w-md w-full mx-auto max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <span className="text-base font-black text-white font-display">
                  ВЫБОР РЕЖИМА ИГРЫ
                </span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsPlayModalOpen(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs: Create vs Join */}
            <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setPlayModalTab('create');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  playModalTab === 'create'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Создать комнату</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setPlayModalTab('join');
                  onRefreshRooms();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  playModalTab === 'join'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Присоединиться</span>
              </button>
            </div>

            {/* TAB CONTENT: CREATE ROOM (SELECT MAX PLAYERS) */}
            {playModalTab === 'create' && (
              <div className="flex flex-col gap-3">
                <div className="text-xs font-bold text-slate-300">
                  Выберите количество участников:
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* 2 Players */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMaxPlayers(2);
                    }}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                      selectedMaxPlayers === 2
                        ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Swords className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-black">2 Игрока</span>
                    <span className="text-[10px] text-slate-400">Дуэль 1х1</span>
                  </button>

                  {/* 3 Players */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMaxPlayers(3);
                    }}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                      selectedMaxPlayers === 3
                        ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-black">3 Игрока</span>
                    <span className="text-[10px] text-slate-400">Трио</span>
                  </button>

                  {/* 4 Players */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMaxPlayers(4);
                    }}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                      selectedMaxPlayers === 4
                        ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-black">4 Игрока</span>
                    <span className="text-[10px] text-slate-400">Классика</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    onCreateRoom(selectedMaxPlayers, true);
                    setIsPlayModalOpen(false);
                  }}
                  className="w-full py-3.5 btn-3d-green text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-xl mt-1"
                >
                  <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                  <span className="font-display">СОЗДАТЬ КОМНАТУ НА {selectedMaxPlayers}</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT: JOIN BY PIN */}
            {playModalTab === 'join' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Введите 6-значный PIN:
                  </span>
                  <button
                    onClick={handlePasteCode}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-400/30 active:scale-95 cursor-pointer"
                  >
                    Вставить из буфера
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 цифр"
                    value={inputRoomId}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setInputRoomId(val);
                    }}
                    className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-center font-mono font-black text-amber-300 tracking-widest placeholder-slate-600 outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={() => {
                      if (inputRoomId.trim()) {
                        triggerHaptic('medium');
                        onJoinRoom(inputRoomId.trim());
                        setIsPlayModalOpen(false);
                      }
                    }}
                    disabled={inputRoomId.trim().length < 6}
                    className="px-5 py-3 btn-3d-blue disabled:opacity-40 text-white font-black text-xs rounded-2xl active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Войти</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PUBLIC AVAILABLE ROOMS LIST */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Открытые группы ({publicRooms ? publicRooms.length : 0})</span>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onRefreshRooms();
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Обновить список"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto flex flex-col gap-2 scrollbar-none">
                {publicRooms && publicRooms.length > 0 ? (
                  publicRooms.map((room) => {
                    const modeLabel = room.maxPlayers === 2 ? '1х1' : room.maxPlayers === 3 ? 'Трио' : '4 игрока';
                    return (
                      <div
                        key={room.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-xs text-white">
                            {room.hostDisplayName?.charAt(0).toUpperCase() || '🎲'}
                          </div>
                          <div>
                            <div className="text-xs font-black text-white truncate max-w-[140px]">
                              {room.name || `Комната #${room.id}`}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                              <span>{room.hostDisplayName || 'Хост'}</span>
                              <span>•</span>
                              <span className="text-indigo-300 font-mono font-bold">
                                👥 {room.playerCount}/{room.maxPlayers} ({modeLabel})
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            triggerHaptic('medium');
                            onJoinRoom(room.id);
                            setIsPlayModalOpen(false);
                          }}
                          className="px-3 py-1.5 btn-3d-green text-white font-black text-xs rounded-xl active:scale-95 transition cursor-pointer"
                        >
                          Войти
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-center text-[11px] text-slate-500 font-medium">
                    Нет активных открытых комнат. Создайте свою и нажмите «Поиск игроков»!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
