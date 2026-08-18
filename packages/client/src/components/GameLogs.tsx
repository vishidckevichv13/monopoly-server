import React, { useRef, useEffect } from 'react';
import { GameLogEntry } from '@monopoly/shared';

interface GameLogsProps {
  logs: GameLogEntry[];
}

export const GameLogs: React.FC<GameLogsProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className="w-full max-h-24 bg-slate-950/50 backdrop-blur-md border-t border-slate-800/40 px-3 py-1.5 overflow-y-auto no-scrollbar flex flex-col gap-1 text-[11px] z-20 shadow-lg"
      ref={scrollRef}
    >
      {logs.slice(-15).map((log) => {
        return (
          <div
            key={log.id}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-colors backdrop-blur-xs ${
              log.type === 'buy'
                ? 'text-emerald-200 bg-emerald-950/40 border border-emerald-500/20'
                : log.type === 'rent'
                ? 'text-amber-200 bg-amber-950/40 border border-amber-500/20'
                : log.type === 'jail'
                ? 'text-red-200 bg-red-950/40 border border-red-500/20'
                : log.type === 'bonus'
                ? 'text-purple-200 bg-purple-950/40 font-bold border border-purple-500/20'
                : 'text-slate-200 bg-slate-900/30'
            }`}
          >
            <span className="text-[10px] text-slate-400 shrink-0">
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="truncate">{log.message}</span>
          </div>
        );
      })}
    </div>
  );
};
