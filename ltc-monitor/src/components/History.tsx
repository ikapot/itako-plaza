import React from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  history: Array<{
    side: 'BUY' | 'SELL';
    price: number;
    timestamp: string;
    amount: number;
  }>;
}

export default function History({ history }: Props) {
  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-4 text-white/50">
        <HistoryIcon size={14} />
        <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase">Operation History / 執行履歴（直近5件）</h2>
      </div>

      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="text-[10px] text-white/20 uppercase tracking-widest italic py-4">No recent operations / 履歴なし</div>
        ) : (
          history.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                  item.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {item.side}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white/80">¥{item.price.toLocaleString()}</span>
                  <span className="text-[8px] text-white/20 font-medium">{format(new Date(item.timestamp), 'MM/dd HH:mm')}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-white/40">{item.amount.toFixed(1)} LTC</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
