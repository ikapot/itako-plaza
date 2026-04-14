import React from 'react';
import { Wallet } from 'lucide-react';

interface Props {
  balance: number;
  gainLossPercent: number;
}

export default function Capital({ balance, gainLossPercent }: Props) {
  const isPositive = gainLossPercent >= 0;

  return (
    <div className="py-8 space-y-4">
      <div className="flex items-center gap-4 text-white/50 mb-2">
        <Wallet size={14} />
        <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase">Capital Management / 資産状況</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Net Equity</span>
          <div className="text-4xl font-black text-white">¥{Math.floor(balance).toLocaleString()}</div>
        </div>

        <div className={`p-8 rounded-[40px] border flex flex-col justify-center ${
          isPositive ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'
        }`}>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Performance (vs ¥2,000)</span>
          <div className={`text-4xl font-black ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
