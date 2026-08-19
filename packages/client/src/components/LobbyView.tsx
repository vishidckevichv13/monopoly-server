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
  Coins,
  ArrowRight,
  TrendingUp,
  Award,
  LogOut,
  Flame,
  Gamepad2,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { triggerHaptic, triggerHapticNotification } from '../telegram/tma.js';

interface LobbyViewProps {
  currentUser: PlayerState;
  currentRoom: {
    id: string;
    name: string;
    hostId: string;
    players: PlayerState[];
    isStarted: boolean;
  } | null;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onAddBot: () => void;
  onStartGame: () => void;
  onLeaveRoom?: () => void;
}

type TabType = 'home' | 'leaderboard' | 'stats';

export const LobbyView: React.FC<LobbyViewProps> = ({
  currentUser,
  currentRoom,
  onCreateRoom,
  onJoinRoom,
  onAddBot,
  onStartGame,
  onLeaveRoom
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [inputRoomId, setInputRoomId] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [userCoins, setUserCoins] = useState(1500);

  const isHost = currentRoom ? currentRoom.hostId === currentUser.id : false;
  const canStart = currentRoom ? currentRoom.players.length >= 2 : false;

  const handleCopyRoomId = (code: string) => {
    triggerHaptic('medium');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareInvite = () => {
    triggerHaptic('heavy');
    if (!currentRoom) return;

    const shareText = `🎮 Заходи играть со мной в Монополию TMA!\nКод комнаты: ${currentRoom.id}\nПрисоединяйся!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(currentRoom.id);
      alert(`Код комнаты ${currentRoom.id} скопирован в буфер обмена!`);
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

  const handleClaimDailyBonus = () => {
    if (!dailyBonusClaimed) {
      triggerHapticNotification('success');
      setUserCoins((prev) => prev + 250);
      setDailyBonusClaimed(true);
    }
  };

  // -------------------------------------------------------------
  // 1. WAITING ROOM SCREEN (WHEN ROOM IS JOINED / CREATED)
  // -------------------------------------------------------------
  if (currentRoom) {
    const emptySlotsCount = Math.max(0, 4 - currentRoom.players.length);

    return (
      <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full relative overflow-y-auto">
        {/* Top Header & Back Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onLeaveRoom) onLeaveRoom();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold active:scale-95 transition"
          >
            <LogOut className="w-3.5 h-3.5 rotate-180 text-red-400" />
            <span>Выйти</span>
          </button>

          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-black text-amber-300">Ожидание игроков</span>
          </div>
        </div>

        {/* Room PIN Code Banner */}
        <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/95 border-2 border-slate-700 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-2xl relative overflow-hidden">
          <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
            {currentRoom.name}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
              {currentRoom.id}
            </span>
            <button
              onClick={() => handleCopyRoomId(currentRoom.id)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-600 transition flex items-center justify-center"
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
              className="w-full py-2.5 px-4 btn-3d-blue text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Поделиться в Telegram</span>
            </button>
          </div>
        </div>

        {/* Players Grid / Slots (4 max) */}
        <div className="flex-1 my-4 flex flex-col gap-2.5">
          <div className="text-xs font-black text-slate-300 flex items-center justify-between px-1">
            <span>Участники ({currentRoom.players.length}/4)</span>
            {isHost && currentRoom.players.length < 4 && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onAddBot();
                }}
                className="text-amber-300 hover:text-amber-200 flex items-center gap-1 text-xs font-black bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-400/50 active:scale-95 transition"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Добавить бота</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentRoom.players.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl border-2 border-white/80 shadow-md flex items-center justify-center font-black text-sm text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>{p.displayName}</span>
                      {p.id === currentRoom.hostId && (
                        <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold">
                      {p.isBot ? '🤖 Сбер AI Бот' : `@${p.username}`}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/40">
                  Готов
                </div>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-between p-3 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    Свободный слот
                  </div>
                </div>
                {isHost && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onAddBot();
                    }}
                    className="text-[11px] font-bold text-amber-400/80 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-400/30 active:scale-95"
                  >
                    + Бот
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Juicy 3D Green Button */}
        <div className="flex flex-col gap-2 pt-2">
          {isHost ? (
            <button
              onClick={() => {
                if (canStart) {
                  triggerHaptic('heavy');
                  onStartGame();
                }
              }}
              disabled={!canStart}
              className="w-full py-4 btn-3d-green disabled:opacity-40 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer shadow-xl"
            >
              <Play className="w-6 h-6 text-white fill-current" />
              <span className="font-display">НАЧАТЬ ИГРУ</span>
            </button>
          ) : (
            <div className="w-full py-4 bg-slate-900/90 rounded-2xl text-center text-xs font-black text-slate-400 border border-slate-800 shadow-inner">
              ⏳ Ожидание запуска игры создателем комнаты...
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MAIN LOBBY HUB (TABS: HOME / LEADERBOARD / STATS)
  // -------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full relative overflow-hidden">
      {/* Top Profile & Currency Header HUD */}
      <div className="bg-slate-900/90 border-2 border-slate-800/90 rounded-3xl p-3.5 shadow-xl flex items-center justify-between gap-3 mb-3">
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
            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-white shadow">
              L14
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-sm font-black text-white flex items-center gap-1 truncate max-w-[120px] sm:max-w-[150px]">
              <span>{currentUser.displayName}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-bold">
              @{currentUser.username}
            </div>
          </div>
        </div>

        {/* Currency & Bonus Button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300 font-mono">
              {userCoins.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleClaimDailyBonus}
            disabled={dailyBonusClaimed}
            className={`p-2 rounded-2xl border text-xs font-black flex items-center justify-center transition active:scale-90 ${
              dailyBonusClaimed
                ? 'bg-slate-800/60 border-slate-700 text-slate-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-[0_3px_0_#9a3412]'
            }`}
            title="Ежедневный бонус"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-2 scrollbar-none">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-3.5 animate-fade-in">
            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-to-b from-purple-900/40 to-slate-900/90 border border-purple-500/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-md">
                <Crown className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Ранг</span>
                <span className="text-sm font-black text-white">Магнат III</span>
              </div>

              <div className="bg-gradient-to-b from-emerald-900/40 to-slate-900/90 border border-emerald-500/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-md">
                <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Винрейт</span>
                <span className="text-sm font-black text-emerald-300">68% (19W)</span>
              </div>

              <div className="bg-gradient-to-b from-blue-900/40 to-slate-900/90 border border-blue-500/30 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-md">
                <Gamepad2 className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Игр</span>
                <span className="text-sm font-black text-blue-200">28 матчей</span>
              </div>
            </div>

            {/* BIG JUICY GREEN PLAY / CREATE ROOM BUTTON */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onCreateRoom();
                }}
                className="w-full py-4 btn-3d-green text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer shadow-2xl"
              >
                <Sparkles className="w-6 h-6 text-yellow-200 fill-yellow-200 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="font-display tracking-wide">СОЗДАТЬ КОМНАТУ</span>
              </button>
            </div>

            {/* JOIN ROOM BY 6-DIGIT CODE CARD */}
            <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-3.5 shadow-lg flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Вход по 6-значному PIN-коду</span>
                </span>
                <button
                  onClick={handlePasteCode}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-400/30 active:scale-95"
                >
                  Вставить из буфера
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 цифр (напр. 482910)"
                  value={inputRoomId}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setInputRoomId(val);
                  }}
                  className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3 text-sm text-center font-mono font-black text-amber-300 tracking-widest placeholder-slate-600 outline-none focus:border-emerald-400"
                />
                <button
                  onClick={() => {
                    if (inputRoomId.trim()) {
                      triggerHaptic('medium');
                      onJoinRoom(inputRoomId.trim());
                    }
                  }}
                  disabled={inputRoomId.trim().length < 6}
                  className="px-5 py-3.5 btn-3d-blue disabled:opacity-40 text-white font-black text-xs rounded-2xl active:scale-95 transition flex items-center gap-1.5"
                >
                  <span>Войти</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SOLO PRACTICE VS BOTS */}
            <div
              onClick={() => {
                triggerHaptic('heavy');
                onCreateRoom();
                setTimeout(() => {
                  onAddBot();
                  onAddBot();
                  onAddBot();
                }, 300);
              }}
              className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/30 hover:border-indigo-500/60 rounded-3xl p-3.5 shadow-md flex items-center justify-between cursor-pointer active:scale-98 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Одиночная игра с Ботами</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold">AI</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold">
                    Быстрый матч против 3 Сбер AI
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
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Топ Игроков Недели</span>
              </span>
              <span className="text-[11px] text-slate-400 font-bold">Обновлено сегодня</span>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-3 gap-2 my-1">
              {/* Place 2 */}
              <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl p-2.5 flex flex-col items-center text-center relative mt-3 shadow-md">
                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center -mt-6 border-2 border-slate-700 shadow">
                  🥈 2
                </div>
                <div className="text-xs font-black text-white mt-1 truncate max-w-[80px]">Александр</div>
                <div className="text-[10px] text-amber-400 font-bold">1,890 PTS</div>
                <div className="text-[9px] text-slate-400">42 победы</div>
              </div>

              {/* Place 1 */}
              <div className="bg-gradient-to-b from-amber-950/60 to-slate-900/95 border-2 border-amber-500/60 rounded-2xl p-2.5 flex flex-col items-center text-center relative shadow-xl">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center -mt-6 border-2 border-white shadow-lg">
                  👑 1
                </div>
                <div className="text-xs font-black text-amber-300 mt-1 truncate max-w-[80px]">Павел_Дуров</div>
                <div className="text-[10px] text-amber-400 font-bold">2,450 PTS</div>
                <div className="text-[9px] text-emerald-400 font-bold">65 побед</div>
              </div>

              {/* Place 3 */}
              <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl p-2.5 flex flex-col items-center text-center relative mt-4 shadow-md">
                <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center -mt-6 border-2 border-slate-700 shadow">
                  🥉 3
                </div>
                <div className="text-xs font-black text-white mt-1 truncate max-w-[80px]">Магнат_PRO</div>
                <div className="text-[10px] text-amber-400 font-bold">1,720 PTS</div>
                <div className="text-[9px] text-slate-400">38 побед</div>
              </div>
            </div>

            {/* Places 4-10 List */}
            <div className="flex flex-col gap-2">
              {[
                { rank: 4, name: 'CryptoWhale', pts: '1,640', wins: 34 },
                { rank: 5, name: 'MonopolyKing', pts: '1,590', wins: 31 },
                { rank: 6, name: 'InvestGuy', pts: '1,520', wins: 29 },
                { rank: 7, name: 'SberTrader', pts: '1,480', wins: 27 }
              ].map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 font-mono text-xs font-black text-slate-400 text-center">
                      #{item.rank}
                    </span>
                    <span className="text-xs font-bold text-white">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-bold">{item.wins} побед</span>
                    <span className="text-xs font-black text-amber-400">{item.pts} PTS</span>
                  </div>
                </div>
              ))}
            </div>

            {/* User Rank Pinned Footer */}
            <div className="mt-1 p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                  #14
                </div>
                <div>
                  <div className="text-xs font-black text-white">{currentUser.displayName} (Вы)</div>
                  <div className="text-[10px] text-slate-400">Входите в топ 5% игроков</div>
                </div>
              </div>
              <span className="text-xs font-black text-amber-300">1,420 PTS</span>
            </div>
          </div>
        )}

        {/* TAB 3: STATS */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Подробная статистика</span>
              </span>
              <span className="text-[11px] text-slate-400 font-bold">Личный кабинет</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Сыграно матчей</span>
                <span className="text-xl font-black text-white font-mono">28</span>
                <span className="text-[10px] text-slate-500">19 побед / 9 поражений</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Винрейт</span>
                <span className="text-xl font-black text-emerald-400 font-mono">67.8%</span>
                <span className="text-[10px] text-emerald-500 font-bold">Выше среднего на 18%</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Банкротств соперников</span>
                <span className="text-xl font-black text-amber-400 font-mono">42</span>
                <span className="text-[10px] text-slate-500">Успешных выбиваний</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Рекорд баланса</span>
                <span className="text-xl font-black text-blue-400 font-mono">$14,850</span>
                <span className="text-[10px] text-slate-500">Максимум за матч</span>
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
              <span>Честная игра: Все броски рассчитываются сервером на 100% Authoritative Engine</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION TAB BAR */}
      <div className="pt-2">
        <div className="bg-slate-900/95 border-2 border-slate-800/90 rounded-3xl p-1.5 flex items-center justify-around shadow-2xl backdrop-blur-md">
          {/* Home Tab */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('home');
            }}
            className={`flex-1 py-2.5 px-3 rounded-2xl flex flex-col items-center gap-1 transition cursor-pointer ${
              activeTab === 'home'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black shadow-inner'
                : 'text-slate-400 hover:text-slate-200 font-bold'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Главная</span>
          </button>

          {/* Leaderboard Tab */}
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

          {/* Stats Tab */}
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
    </div>
  );
};
