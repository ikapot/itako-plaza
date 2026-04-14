import React from 'react';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';

interface Props {
  price: number;
  timestamp: string;
  status: string;
}

export default function Header({ price, timestamp, status }: Props) {
  return (
    <div className="space-y-2 border-b border-white/5 pb-8">
      <div className="flex items-center justify-between text-[#f15a24]/60 font-mono text-[10px] tracking-[0.3em] uppercase">
        <div className="flex items-center gap-2">
          <Activity size={12} className={status === 'ACTIVE' ? 'animate-pulse text-emerald-500' : ''} />
          {status} MONITOR / LTC_JPY
        </div>
        <div>
          {timestamp ? format(new Date(timestamp), 'HH:mm:ss') : '--:--:--'}
        </div>
      </div>
      
      <div className="flex flex-col">
        <span className="text-7xl font-black tracking-tighter tabular-nums text-white leading-none">
          ¥{Math.floor(price).toLocaleString()}
        </span>
        <span className="text-[10px] font-bold text-white/20 tracking-[0.5em] uppercase mt-2">
          Real-time Pricing / リアルタイム価格
        </span>
      </div>
    </div>
  );
}
