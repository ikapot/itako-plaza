'use client';

import { useState, useEffect, useRef } from 'react';

export interface TradeStatus {
  timestamp: string;
  bestBid: number;
  bestAsk: number;
  rsi: number;
  ema_trend: 'UP' | 'DOWN' | 'NEUTRAL';
  price: number;
  status: string;
  indicators: {
    ATR: number;
    EMA_direction: 'UP' | 'DOWN' | 'NEUTRAL';
    RSI: number;
    Z_score: number;
  };
  capital: {
    balance: number;
    gain_loss_percent: number;
  };
  history: any[];
  ai_bias: string;
  ai_reason: string;
}

export interface WavePoint {
  time: string;
  displayTime: string;
  price: number;
  zScore: number;
}

export function useTideData() {
  const [status, setStatus] = useState<TradeStatus | null>(null);
  const [waveData, setWaveData] = useState<WavePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('API Sync Failed');
      const data: TradeStatus = await res.json();
      
      setStatus(data);
      setLoading(false);
      setError(null);

      const now = new Date();
      const displayTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const newPoint: WavePoint = {
        time: now.toISOString(),
        displayTime,
        price: data.price,
        zScore: data.indicators.Z_score
      };

      setWaveData(prev => {
        const updated = [...prev, newPoint];
        return updated.length > 100 ? updated.slice(updated.length - 100) : updated;
      });
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  return { status, waveData, loading, error };
}
