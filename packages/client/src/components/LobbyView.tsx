import React, { useState } from 'react';
import { PlayerState } from '@monopoly/shared';
import { Play, Share2, Crown, Sparkles, Bot } from 'lucide-react';
import { triggerHaptic } from '../telegram/tma.js';

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
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  currentUser,
  currentRoom,
  onCreateRoom,
  onJoinRoom,
  onAddBot,
  onStartGame
}) => {
  const [inputRoomId, setInputRoomId] = useState('');

  const isHost = currentRoom ? currentRoom.hostId === currentUser.id : false;
  const canStart = currentRoom ? currentRoom.players.length >= 2 : false;

  const handleShareInvite = () => {
    triggerHaptic('medium');
    if (navigator.clipboard && currentRoom) {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка на комнату скопирована в буфер обмена!');
    }
  };

  if (!currentRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        {/* 3D Animated Monopoly Logo Banner */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-[0_8px_0_#9a3412,0_16px_32px_rgba(234,88,12,0.4)] border-4 border-white mb-5 animate-bounce">
          <span className="text-5xl filter drop-shadow">🎲</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 font-display drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
          МОНОПОЛИЯ <span className="text-amber-400">TMA</span>
        </h1>
        <p className="text-xs text-slate-300 mb-8 max-w-xs leading-relaxed font-bold">
          Мобильная казуальная экономическая игра в Telegram
        </p>

        <div className="w-full flex flex-col gap-3.5">
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onCreateRoom();
            }}
            className="w-full py-4 btn-3d-red text-white font-black text-lg flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-6 h-6 text-yellow-200" />
            <span className="font-display">СОЗДАТЬ КОМНАТУ</span>
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="h-[2px] flex-1 bg-slate-700/60" />
            <span className="text-xs text-slate-400 font-extrabold uppercase">или</span>
            <div className="h-[2px] flex-1 bg-slate-700/60" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="ID комнаты (напр. room_abc123)"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="flex-1 bg-slate-900/90 border-2 border-slate-700 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 font-bold"
            />
            <button
              onClick={() => {
                if (inputRoomId.trim()) {
                  triggerHaptic('medium');
                  onJoinRoom(inputRoomId.trim());
                }
              }}
              disabled={!inputRoomId.trim()}
              className="px-5 py-3.5 btn-3d-blue disabled:opacity-50 text-white font-black text-xs rounded-2xl active:scale-95 transition"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full">
      {/* Room Header Card */}
      <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-3xl p-4 flex flex-col gap-2 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-400 font-extrabold uppercase">Комната</div>
            <div className="text-lg font-black text-white">{currentRoom.name}</div>
          </div>
          <button
            onClick={handleShareInvite}
            className="flex items-center gap-1.5 px-3.5 py-2 btn-3d-blue text-white text-xs font-black rounded-xl active:scale-95 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Пригласить</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800">
          ID: {currentRoom.id}
        </div>
      </div>

      {/* Players in Room List */}
      <div className="flex-1 my-4 flex flex-col gap-2.5">
        <div className="text-xs font-black text-slate-300 flex items-center justify-between px-1">
          <span>Участники ({currentRoom.players.length}/4)</span>
          {isHost && currentRoom.players.length < 4 && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onAddBot();
              }}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs font-black bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/40"
            >
              <Bot className="w-4 h-4" />
              <span>+ Добавить бота</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {currentRoom.players.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3.5 bg-slate-900/80 border-2 border-slate-700/60 rounded-2xl shadow-md"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full border-2 border-white shadow-md flex items-center justify-center font-black text-sm text-white"
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
                    {p.isBot ? '🤖 Искусственный интеллект' : `@${p.username}`}
                  </div>
                </div>
              </div>

              <div className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/40">
                Готов
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex flex-col gap-2">
        {isHost ? (
          <button
            onClick={() => {
              if (canStart) {
                triggerHaptic('heavy');
                onStartGame();
              }
            }}
            disabled={!canStart}
            className="w-full py-4 btn-3d-green disabled:opacity-40 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
          >
            <Play className="w-6 h-6 text-white fill-current" />
            <span className="font-display">НАЧАТЬ ИГРУ</span>
          </button>
        ) : (
          <div className="w-full py-4 bg-slate-900/80 rounded-2xl text-center text-xs font-black text-slate-400 border border-slate-800 shadow-inner">
            ⏳ Ожидание запуска игры хостом...
          </div>
        )}
      </div>
    </div>
  );
};
