'use client';

import React, { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useTideData } from '@/hooks/useTideData';
import LtcWaveChart from '@/components/LtcWaveChart';
import Indicators from '@/components/Indicators';
import Capital from '@/components/Capital';
import History from '@/components/History';

export default function Home() {
  const { status, waveData, loading, error } = useTideData();
  const [pulse, setPulse] = useState(false);

  // 価格変動時のパルス演出
  useEffect(() => {
    if (status?.price) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(timer);
    }
  }, [status?.price]);

  // 初期読み込みアニメーション
  useEffect(() => {
    if (!loading) {
      gsap.from('.stunning-element', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }
  }, [loading]);

  if (loading) {
     return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
          <div className="relative">
            <div className="w-16 h-16 border-t-2 border-[#f15a24] rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-black tracking-widest text-white/40 animate-pulse uppercase">Syncing...</span>
            </div>
          </div>
        </main>
      );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#f15a24]/30 overflow-x-hidden relative">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#f15a24] rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-700 rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Pulse Flash */}
      <div className={`transition-opacity duration-700 ${pulse ? 'opacity-100' : 'opacity-0'} fixed inset-0 pointer-events-none bg-[#f15a24]/5 blur-[100px] z-0`} />

      <div className="max-w-[1200px] mx-auto p-4 md:p-8 relative z-10">
        
        {/* Header - 375px Optimized */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-16 stunning-element">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[8px] font-black tracking-[0.4em] text-white/50 uppercase">Live Monitor / LTC_JPY</span>
            </div>
            {/* Price: Using text-5xl to fit 375px width safely */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tightest whitespace-nowrap overflow-hidden">
                ¥{status?.price.toLocaleString() || '0'}
            </h1>
            <p className="text-[9px] font-bold tracking-[0.2em] text-white/20 uppercase">Real-time Trading Battle Monitor</p>
          </div>
          
          <div className="p-4 md:px-8 bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/5 max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-1.5 py-0.5 rounded-[4px] text-[7px] font-black tracking-widest ${
                status?.ai_bias === 'BULLISH' ? 'bg-emerald-500 text-black' : 
                status?.ai_bias === 'BEARISH' ? 'bg-red-500 text-white' : 
                'bg-white/10 text-white/40'
              }`}>AI_STATUS: {status?.ai_bias}</span>
            </div>
            <p className="text-[12px] italic font-serif text-white/80 leading-relaxed">&quot;{status?.ai_reason}&quot;</p>
          </div>
        </header>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Charts & Indicators (Main Area) */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8 stunning-element">
            <Indicators 
              atr={status?.indicators.ATR || 0} 
              emaDirection={status?.indicators.EMA_direction || 'NEUTRAL'} 
              rsi={status?.indicators.RSI || 0} 
            />

            <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/5 p-4 md:p-8">
              <LtcWaveChart data={waveData} history={status?.history || []} />
            </div>
          </div>

          {/* Capital & History (Sidebar) */}
          <div className="space-y-6 md:space-y-8 stunning-element">
            <Capital 
              balance={status?.capital.balance || 0} 
              gainLoss={status?.capital.gain_loss_percent || 0} 
            />
            <div className="h-[400px]">
                <History history={status?.history || []} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-white/5 flex items-center justify-between opacity-20 stunning-element">
          <span className="text-[8px] font-black tracking-widest uppercase">Itako Battle V2.5 Pro</span>
          <span className="text-[8px] font-mono uppercase">{status?.timestamp}</span>
        </footer>
      </div>
    </main>
  );
}
