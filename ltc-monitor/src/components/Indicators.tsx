import React from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface Props {
  atr: number;
  emaDirection: 'UP' | 'DOWN';
  rsi: number;
}

export default function Indicators({ atr, emaDirection, rsi }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
      {/* ATR: Volatility */}
      <div className="p-6 bg-white/5 rounded-3xl space-y-4 border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">ATR (Volatility)</span>
          <Zap size={14} className="text-[#f15a24]" />
        </div>
        <div className="text-3xl font-black text-white">{atr.toFixed(1)}</div>
        <div className="text-[9px] font-medium text-white/20 uppercase">Market Breath / 市場の深呼吸</div>
      </div>

      {/* EMA: Trend Direction */}
      <div className={`p-6 rounded-3xl space-y-4 border transition-all duration-500 ${
        emaDirection === 'UP' 
          ? 'bg-emerald-500/10 border-emerald-500/20' 
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">EMA Trend</span>
          {emaDirection === 'UP' ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />}
        </div>
        <div className={`text-3xl font-black ${emaDirection === 'UP' ? 'text-emerald-500' : 'text-red-500'}`}>
          {emaDirection}
        </div>
        <div className="text-[9px] font-medium text-white/20 uppercase">Current Bias / 現在のモメンタム</div>
      </div>

      {/* RSI: Overheating */}
      <div className="p-6 bg-white/5 rounded-3xl space-y-4 border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">RSI (14)</span>
          <span className={`text-xs font-bold ${rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-emerald-400' : 'text-white/60'}`}>{Math.round(rsi)}</span>
        </div>
        <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
              rsi > 70 ? 'bg-red-500' : rsi < 30 ? 'bg-emerald-500' : 'bg-[#f15a24]'
            }`}
            style={{ width: `${rsi}%` }}
          />
        </div>
        <div className="flex justify-between text-[8px] font-bold text-white/10 uppercase tracking-widest">
          <span>Oversold</span>
          <span>Overbought</span>
        </div>
      </div>
    </div>
  );
}
