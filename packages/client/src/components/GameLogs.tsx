import React, { useRef, useEffect } from 'react';
import { GameLogEntry } from '@monopoly/shared';

interface GameLogsProps {
  logs: GameLogEntry[];
  className?: string;
}

export const GameLogs: React.FC<GameLogsProps> = ({ logs, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className={`w-full max-h-24 bg-gradient-to-t from-slate-950/70 via-slate-950/45 to-transparent px-3 pb-2 pt-4 flex flex-col gap-1 text-[11px] z-30 pointer-events-auto [mask-image:linear-gradient(to_bottom,transparent_0%,black_25%)] ${className}`}
    >
      <div
        ref={scrollRef}
        className="overflow-y-auto no-scrollbar flex flex-col gap-1 max-h-20"
      >
        {logs.slice(-15).map((log) => {
          return (
            <div
              key={log.id}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-colors backdrop-blur-sm ${
                log.type === 'buy'
                  ? 'text-emerald-200 bg-emerald-950/50 border border-emerald-500/20'
                  : log.type === 'rent'
                  ? 'text-amber-200 bg-amber-950/50 border border-amber-500/20'
                  : log.type === 'jail'
                  ? 'text-red-200 bg-red-950/50 border border-red-500/20'
                  : log.type === 'bonus'
                  ? 'text-purple-200 bg-purple-950/50 font-bold border border-purple-500/20'
                  : 'text-slate-200 bg-slate-900/40 border border-slate-700/20'
              }`}
            >
              <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
              <span className="truncate drop-shadow">{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
