import { TrendingUp, TrendingDown, Zap, Activity } from 'lucide-react';

interface Props {
  atr: number;
  emaDirection: 'UP' | 'DOWN' | 'NEUTRAL';
  rsi: number;
}

export default function Indicators({ atr, emaDirection, rsi }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 py-4 md:py-8">
      {/* ATR: Volatility */}
      <div className="p-4 md:p-6 bg-white/5 backdrop-blur-3xl rounded-3xl space-y-2 md:space-y-4 border border-white/5 hover:border-[#f15a24]/30 transition-all duration-700 group">
        <div className="flex items-center justify-between">
          <span className="text-[8px] md:text-[10px] font-bold text-white/30 tracking-widest uppercase">ATR (Volatility)</span>
          <Zap size={12} className="text-[#f15a24] group-hover:scale-125 transition-transform" />
        </div>
        <div className="text-2xl md:text-4xl font-black text-white">{atr.toFixed(1)}</div>
        <div className="text-[7px] md:text-[9px] font-medium text-white/10 uppercase tracking-tighter">Market Breath / 潮の満ち引き</div>
      </div>

      {/* EMA: Trend Direction */}
      <div className={`p-4 md:p-6 rounded-3xl space-y-2 md:space-y-4 border transition-all duration-1000 group ${
        emaDirection === 'UP' 
          ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' 
          : emaDirection === 'DOWN'
          ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
          : 'bg-white/5 border-white/5'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[8px] md:text-[10px] font-bold text-white/30 tracking-widest uppercase">EMA Trend</span>
          {emaDirection === 'UP' ? <TrendingUp size={12} className="text-emerald-500 group-hover:translate-y-[-2px] transition-transform" /> : 
           emaDirection === 'DOWN' ? <TrendingDown size={12} className="text-red-500 group-hover:translate-y-[2px] transition-transform" /> :
           <Activity size={12} className="text-white/20" />}
        </div>
        <div className={`text-2xl md:text-4xl font-black transition-colors duration-1000 ${
          emaDirection === 'UP' ? 'text-emerald-400' : 
          emaDirection === 'DOWN' ? 'text-red-400' : 
          'text-white/20'
        }`}>
          {emaDirection}
        </div>
        <div className="text-[7px] md:text-[9px] font-medium text-white/10 uppercase tracking-tighter">Current Momentum / 勢い</div>
      </div>

      {/* RSI: Overheating */}
      <div className="p-4 md:p-6 bg-white/5 backdrop-blur-3xl rounded-3xl space-y-4 md:space-y-6 border border-white/5 col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[8px] md:text-[10px] font-bold text-white/30 tracking-widest uppercase">System RSI</span>
          <span className={`text-[10px] font-mono font-bold ${rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-emerald-400' : 'text-white/60'}`}>{Math.round(rsi)}</span>
        </div>
        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`absolute inset-y-0 left-0 transition-all duration-1000 rounded-full ${
              rsi > 70 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 
              rsi < 30 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 
              'bg-[#f15a24] shadow-[0_0_10px_#f15a24]'
            }`}
            style={{ width: `${rsi}%` }}
          />
        </div>
        <div className="flex justify-between text-[6px] md:text-[8px] font-bold text-white/10 uppercase tracking-[0.2em]">
          <span>Low</span>
          <span>Balanced</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
