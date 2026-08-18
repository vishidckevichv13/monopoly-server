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
    <div className="w-full max-h-24 bg-slate-950/60 backdrop-blur-sm border-t border-slate-800/80 px-3 py-1.5 overflow-y-auto no-scrollbar flex flex-col gap-1 text-[11px]" ref={scrollRef}>
      {logs.slice(-15).map((log) => {
        return (
          <div
            key={log.id}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-colors ${
              log.type === 'buy'
                ? 'text-emerald-300 bg-emerald-950/30'
                : log.type === 'rent'
                ? 'text-amber-300 bg-amber-950/30'
                : log.type === 'jail'
                ? 'text-red-300 bg-red-950/30'
                : log.type === 'bonus'
                ? 'text-purple-300 bg-purple-950/30 font-bold'
                : 'text-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-500 shrink-0">
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="truncate">{log.message}</span>
          </div>
        );
      })}
    </div>
  );
};
