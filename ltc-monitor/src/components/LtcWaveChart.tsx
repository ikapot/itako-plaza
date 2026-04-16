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
import { format } from 'date-fns';

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
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black tracking-widest text-white/40 mb-2 uppercase">{label}</p>
        <p className="text-lg font-mono text-[#f15a24]">¥{payload[0].value.toLocaleString()}</p>
        {payload[1] && (
          <p className="text-[10px] font-mono text-cyan-400 mt-1">Z_SCORE: {payload[1].value.toFixed(2)}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function LtcWaveChart({ data, history }: LtcWaveChartProps) {
  // マッチングする価格データがない履歴をフィルタリング
  // チャート上に表示するドットの座標を計算
  const historyDots = useMemo(() => {
    return history.map((h, i) => {
      // 最も近い時間帯のデータを探す（簡易版）
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
      <div className="h-[300px] w-full bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 animate-pulse">
        <span className="text-[10px] font-black tracking-[0.5em] text-white/20 uppercase">Waiting for waves...</span>
        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    );
  }

  // 価格の最小・最大を計算してレンジを最適化
  const minPrice = Math.min(...data.map(d => d.price)) * 0.999;
  const maxPrice = Math.max(...data.map(d => d.price)) * 1.001;

  return (
    <div className="w-full mt-12 group">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-[0.3em] text-[#f15a24] uppercase">Live Market Tide</span>
          <span className="text-[8px] font-mono text-white/20 uppercase">Real-time LTC/JPY Volatility</span>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f15a24] shadow-[0_0_10px_#f15a24]" />
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Price</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Z-Score</span>
            </div>
        </div>
      </div>

      <div className="h-[350px] w-full bg-black/40 backdrop-blur-sm rounded-3xl border border-white/5 p-4 overflow-hidden relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f15a24" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f15a24" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis 
              dataKey="displayTime" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
              minTickGap={30}
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              hide={true}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(241, 90, 36, 0.2)', strokeWidth: 1 }} />
            
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#f15a24" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={1500}
            />

            <Line 
              type="monotone" 
              dataKey="zScore" 
              stroke="#22d3ee" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="5 5"
              yAxisId={0} // 同一スケールだと見にくいので後で調整
              animationDuration={2000}
            />

            {historyDots.map((dot) => (
              <ReferenceDot
                key={dot.id}
                x={dot.x}
                y={dot.y}
                r={4}
                fill={dot.side === 'BUY' ? '#10b981' : '#ef4444'}
                stroke="white"
                strokeWidth={2}
                className="animate-bounce"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Decorative Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-3xl shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  );
}
