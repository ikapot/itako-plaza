'use client';

import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Indicators from '../components/Indicators';
import Capital from '../components/Capital';
import History from '../components/History';
import { TradeStatus } from '../types/trade';

const DEFAULT_STATE: TradeStatus = {
  timestamp: new Date().toISOString(),
  bestBid: 0,
  bestAsk: 0,
  rsi: 50,
  ema_trend: 'NEUTRAL',
  price: 0,
  status: 'IDLE',
  indicators: {
    ATR: 0,
    EMA_direction: 'NEUTRAL',
    RSI: 50,
    Z_score: 0
  },
  capital: {
    balance: 0,
    gain_loss_percent: 0
  },
  history: [],
  ai_bias: 'NEUTRAL',
  ai_reason: 'Awaiting updates...'
};

export default function Home() {
  const [data, setData] = useState<TradeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      
      if (json.error) {
        setErrorStatus(json.error);
        // We still keep the previous data or null if it's the first load
      } else {
        setData(json);
        setErrorStatus(null);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorStatus('Network error occurred.');
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

  // Use data or fallback to DEFAULT_STATE
  const displayData = data ?? DEFAULT_STATE;

  return (
    <main className="min-h-screen bg-[#121212] text-white p-6 md:p-12 lg:p-24 max-w-5xl mx-auto selection:bg-[#f15a24] selection:text-black">
      <Header 
        price={displayData.price} 
        timestamp={displayData.timestamp} 
        status={displayData.status} 
      />
      
      {errorStatus && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between">
          <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Connectivity Warning</span>
          <span className="text-[9px] text-red-500/60 font-medium truncate ml-4">{errorStatus}</span>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {displayData.ai_bias && (
          <div className="py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black px-3 py-1 rounded-sm border ${
                displayData.ai_bias === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                displayData.ai_bias === 'BEARISH' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                'bg-white/5 text-white/40 border-white/10'
              }`}>
                AI_TIDE: {displayData.ai_bias}
              </span>
              <p className="text-xs font-serif italic text-white/60 truncate">{displayData.ai_reason}</p>
            </div>
          </div>
        )}

        <Indicators 
          atr={displayData.indicators?.ATR ?? 0} 
          emaDirection={displayData.indicators?.EMA_direction ?? 'NEUTRAL'} 
          rsi={displayData.indicators?.RSI ?? 50} 
        />
        
        <Capital 
          balance={displayData.capital?.balance ?? 0} 
          gainLossPercent={displayData.capital?.gain_loss_percent ?? 0} 
        />
        
        <History history={displayData.history ?? []} />
      </div>

      <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col items-center gap-2">
        <span className="text-[8px] font-bold text-white/10 tracking-[0.6em] uppercase">Autonomous Strategy Monitoring V2.5</span>
        <span className="text-[8px] font-mono text-white/5 uppercase">No Emojis | No Distractions | Pure Quant</span>
      </footer>
    </main>
  );
}
