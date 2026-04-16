import React from 'react';
import { History as HistoryIcon, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryItem {
  side: 'BUY' | 'SELL';
  price: number;
  timestamp: string;
  amount: number;
}

interface Props {
  history: HistoryItem[];
}

export default function History({ history }: Props) {
  return (
    <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full stunning-element">
      <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <HistoryIcon size={14} className="text-white/40" />
          <span className="text-[10px] md:text-xs font-black tracking-widest uppercase">Trade Log</span>
        </div>
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Recent 5 Nodes</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="h-32 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Awaiting execution...</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {history.map((item, i) => (
              <div key={i} className="p-3 md:p-4 hover:bg-white/[0.03] transition-colors group">
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md ${
                      item.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {item.side === 'BUY' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    </div>
                    <span className={`text-[10px] md:text-xs font-black tracking-widest ${
                      item.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {item.side}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-30 group-hover:opacity-50 transition-opacity">
                    <Clock size={10} />
                    <span className="text-[8px] md:text-[9px] font-mono">
                      {format(new Date(item.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm md:text-base font-mono font-bold text-white/90">
                    ¥{item.price.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-white/40">
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Qty:</span>
                    <span className="text-[10px] md:text-xs font-black text-white/60">{item.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
