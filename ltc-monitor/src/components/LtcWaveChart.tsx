'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Line,
  ComposedChart
} from 'recharts';

interface HistoryItem {
  side: 'BUY' | 'SELL';
  price: number;
  timestamp: string;
  amount: number;
}

interface WavePoint {
  time: string;
  displayTime: string;
  price: number;
  zScore: number;
}

interface LtcWaveChartProps {
  data: WavePoint[];
  history: HistoryItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-3 md:p-4 rounded-2xl shadow-2xl">
        <p className="text-[8px] md:text-[10px] font-black tracking-widest text-white/40 mb-1.5 md:mb-2 uppercase">{label}</p>
        <div className="flex items-baseline gap-2">
            <span className="text-sm md:text-lg font-mono font-bold text-[#f15a24]">¥{payload[0].value.toLocaleString()}</span>
            {payload[1] && (
                <span className="text-[8px] md:text-[10px] font-mono text-cyan-400 opacity-80">Z:{payload[1].value.toFixed(2)}</span>
            )}
        </div>
      </div>
    );
  }
  return null;
};

export default function LtcWaveChart({ data, history }: LtcWaveChartProps) {
  const historyDots = useMemo(() => {
    if (data.length === 0) return [];
    return history.map((h, i) => {
      const hTime = new Date(h.timestamp).getTime();
      const closestPoint = data.reduce((prev, curr) => {
        return Math.abs(new Date(curr.time).getTime() - hTime) < Math.abs(new Date(prev.time).getTime() - hTime) ? curr : prev;
      }, data[0]);

      return {
        ...h,
        x: closestPoint?.displayTime,
        y: h.price,
        id: `dot-${i}`
      };
    }).filter(d => d.x);
  }, [history, data]);

  if (data.length < 2) {
    return (
      <div className="h-[250px] md:h-[400px] w-full bg-white/[0.02] rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 animate-pulse">
        <span className="text-[8px] md:text-[10px] font-black tracking-[0.5em] text-white/20 uppercase">Streaming Tides...</span>
        <div className="w-24 md:w-48 h-[1px] bg-gradient-to-r from-transparent via-[#f15a24]/20 to-transparent" />
      </div>
    );
  }

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.9995;
  const maxPrice = Math.max(...prices) * 1.0005;

  return (
    <div className="w-full group">
      <div className="flex items-center justify-between mb-4 md:mb-8 px-1">
        <div className="flex flex-col">
          <span className="text-[9px] md:text-[11px] font-black tracking-[0.3em] text-[#f15a24] uppercase">Live Market Tide</span>
          <span className="text-[7px] md:text-[9px] font-mono text-white/10 uppercase tracking-widest">Quantum Volatility Analysis</span>
        </div>
        <div className="flex gap-3 md:gap-5">
            <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f15a24] shadow-[0_0_10px_#f15a24]" />
                <span className="text-[7px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest">Price</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                <span className="text-[7px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest">Z-Score</span>
            </div>
        </div>
      </div>

      <div className="h-[250px] md:h-[400px] w-full relative overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f15a24" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#f15a24" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
            <XAxis 
              dataKey="displayTime" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 7, fill: 'rgba(255,255,255,0.15)', fontWeight: 'bold' }}
              minTickGap={40}
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              hide={true}
            />
            <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#f15a24', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }} 
            />
            
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#f15a24" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorWave)" 
              animationDuration={1000}
              isAnimationActive={true}
            />

            <Line 
              type="monotone" 
              dataKey="zScore" 
              stroke="#22d3ee" 
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
              opacity={0.4}
              animationDuration={1500}
              isAnimationActive={true}
            />

            {historyDots.map((dot) => (
              <ReferenceDot
                key={dot.id}
                x={dot.x}
                y={dot.y}
                r={window.innerWidth < 768 ? 3 : 5}
                fill={dot.side === 'BUY' ? '#10b981' : '#ef4444'}
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={1.5}
                className="animate-pulse"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
