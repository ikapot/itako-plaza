'use client';

import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Indicators from '../components/Indicators';
import Capital from '../components/Capital';
import History from '../components/History';
import { TradeStatus } from '../types/trade';

export default function Home() {
  const [data, setData] = useState<TradeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Note: In local dev we'll either need a proxy or set environment variables.
      // For Vercel, this will fetch from the Gist.
      const res = await fetch('/api/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#f15a24] font-black tracking-[1em] animate-pulse">INITIATING...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <div className="text-red-500 font-black tracking-widest uppercase">Connectivity Severed</div>
          <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">
            Gist ID or Access Token is missing. Configure environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white p-6 md:p-12 lg:p-24 max-w-5xl mx-auto selection:bg-[#f15a24] selection:text-black">
      <Header 
        price={data.price} 
        timestamp={data.timestamp} 
        status={data.status} 
      />
      
      <div className="mt-8 space-y-4">
        {data.ai_bias && (
          <div className="py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black px-3 py-1 rounded-sm border ${
                data.ai_bias === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                data.ai_bias === 'BEARISH' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                'bg-white/5 text-white/40 border-white/10'
              }`}>
                AI_TIDE: {data.ai_bias}
              </span>
              <p className="text-xs font-serif italic text-white/60 truncate">{data.ai_reason}</p>
            </div>
          </div>
        )}

        <Indicators 
          atr={data.indicators.ATR} 
          emaDirection={data.indicators.EMA_direction} 
          rsi={data.indicators.RSI} 
        />
        
        <Capital 
          balance={data.capital.balance} 
          gainLossPercent={data.capital.gain_loss_percent} 
        />
        
        <History history={data.history} />
      </div>

      <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col items-center gap-2">
        <span className="text-[8px] font-bold text-white/10 tracking-[0.6em] uppercase">Autonomous Strategy Monitoring V2.5</span>
        <span className="text-[8px] font-mono text-white/5 uppercase">No Emojis | No Distractions | Pure Quant</span>
      </footer>
    </main>
  );
}
