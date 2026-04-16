'use client';

import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import Header from '../components/Header';
import Indicators from '../components/Indicators';
import Capital from '../components/Capital';
import History from '../components/History';
import LtcWaveChart from '../components/LtcWaveChart';
import { TradeStatus } from '../types/trade';
import { format } from 'date-fns';

const MAX_POINTS = 100; // チャートに表示する最大データ点数

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
  const [waveData, setWaveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const mainRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      
      if (json.error) {
        setErrorStatus(json.error);
      } else {
        setData(json);
        setErrorStatus(null);
        
        // チャートデータの履歴蓄積
        const newPoint = {
          time: json.timestamp,
          displayTime: format(new Date(json.timestamp), 'HH:mm'),
          price: json.price,
          zScore: json.indicators?.Z_score ?? 0
        };

        setWaveData(prev => {
          // 重複チェック（タイムスタンプが変わっていない場合は追加しない）
          if (prev.length > 0 && prev[prev.length - 1].time === newPoint.time) {
            return prev;
          }
          const updated = [...prev, newPoint];
          return updated.slice(-MAX_POINTS); // 直近100件に制限
        });
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

    // GSAP Entrance Animation
    if (mainRef.current) {
        gsap.fromTo(mainRef.current, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
        );
    }

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
    <main ref={mainRef} className="min-h-screen bg-[#080808] text-white p-6 md:p-12 lg:px-24 max-w-6xl mx-auto selection:bg-[#f15a24] selection:text-black">
      <Header 
        price={displayData.price} 
        timestamp={displayData.timestamp} 
        status={displayData.status} 
      />
      
      {errorStatus && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between animate-pulse">
          <span className="text-[10px] font-black text-red-400 tracking-widest uppercase">Connectivity Warning</span>
          <span className="text-[9px] text-red-500/60 font-medium truncate ml-4">{errorStatus}</span>
        </div>
      )}

      {/* Visual Waves Chart */}
      <LtcWaveChart data={waveData} history={displayData.history ?? []} />

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
            {displayData.ai_bias && (
                <div className="py-6 border-b border-white/5 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                <div className="flex flex-col gap-3">
                    <span className={`text-[10px] w-fit font-black px-3 py-1 rounded-sm border ${
                    displayData.ai_bias === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                    displayData.ai_bias === 'BEARISH' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                    'bg-white/5 text-white/40 border-white/10'
                    }`}>
                    AI_TIDE: {displayData.ai_bias}
                    </span>
                    <p className="text-sm font-serif italic text-white/70 leading-relaxed">{displayData.ai_reason}</p>
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
        </div>

        <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-6 h-fit">
            <h3 className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase mb-6">Trade Log</h3>
            <History history={displayData.history ?? []} />
        </div>
      </div>

      <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col items-center gap-2">
        <span className="text-[8px] font-bold text-white/10 tracking-[0.6em] uppercase">Autonomous Strategy Monitoring V2.5</span>
        <span className="text-[8px] font-mono text-white/5 uppercase">No Emojis | No Distractions | Pure Quant</span>
      </footer>
    </main>
  );
}
