import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Wallet, Activity, Shield, Zap, Ban, Cpu, Gavel } from 'lucide-react';
import gsap from 'gsap';

const TradingDashboard = ({ user }) => {
    const [data, setData] = useState({
        price: 0,
        balance: { jpy: '---', ltc: '---' },
        strategy: null,
        config: { dryRun: true, symbol: 'LTC/JPY' }
    });

    const fetchData = async () => {
        try {
            const res = await fetch('/api/status');
            const result = await res.json();
            if (result.ok) {
                setData(result);
            }
        } catch (err) {
            console.error('Fetch Error:', err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, []);

    // GSAP Animation for price
    useEffect(() => {
        if (data.price > 0) {
            gsap.to(".price-number", {
                color: "#f15a24",
                duration: 0.2,
                yoyo: true,
                repeat: 1,
            });
        }
    }, [data.price]);

    const IndicatorTile = ({ label, value, unit = "", sublabel = "" }) => (
        <div className="p-4 bg-black/40 border border-[#f15a24]/20 rounded-2xl group hover:border-[#f15a24]/50 transition-all">
            <span className="text-[10px] font-bold text-[#f15a24]/40 uppercase tracking-[0.2em] block mb-2">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black tracking-tight">{value}</span>
                <span className="text-[10px] font-bold text-white/30">{unit}</span>
            </div>
            {sublabel && <span className="text-[8px] font-medium text-white/20 uppercase mt-1 block">{sublabel}</span>}
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-8 font-oswald text-white h-full overflow-y-auto itako-scrollbar-thin pb-32 editorial-grid">
            {/* Top Bar / Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#f15a24] shadow-[0_0_10px_#f15a24] animate-pulse" />
                        <h1 className="text-2xl font-black tracking-tighter uppercase italic">Zen-LTC-Quant V2.2</h1>
                    </div>
                    <p className="text-[10px] font-bold text-[#f15a24]/60 tracking-[0.3em] uppercase">Autonomous Trading Interface / 自律執行界面</p>
                </div>
                <div className="flex gap-4">
                    <div className={`px-4 py-2 rounded-full border border-white/5 bg-black/40 backdrop-blur-md flex items-center gap-2 ${data.config.dryRun ? 'opacity-50' : ''}`}>
                        {data.config.dryRun ? <Ban size={12} className="text-white/40" /> : <Shield size={12} className="text-[#f15a24]" />}
                        <span className="text-[9px] font-bold tracking-widest">{data.config.dryRun ? 'DRY_RUN: ACTIVE' : 'LIVE_TRADING: ON'}</span>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Tile */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 glass-spectral group relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-black tracking-[0.4em] text-[#f15a24]/50 uppercase">Market / 市場</span>
                            <Zap size={14} className="text-[#f15a24]" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-5xl font-black price-number tracking-tighter">
                                ¥{data.price ? Math.floor(data.price).toLocaleString() : '---'}
                            </span>
                            <span className="text-[10px] font-bold text-white/20 block tracking-widest uppercase">LTC / JPY PAIR</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12">
                        <Activity size={120} />
                    </div>
                </motion.div>

                {/* Balance Tile */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-8 glass-spectral group">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black tracking-[0.4em] text-[#f15a24]/50 uppercase">Capital / 資産</span>
                        <Wallet size={14} className="text-[#f15a24]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-2xl font-black tracking-tight">{data.balance.jpy}</span>
                            <span className="text-[9px] font-bold text-white/20 block tracking-widest uppercase">JPY</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-2xl font-black tracking-tight">{data.balance.ltc}</span>
                            <span className="text-[9px] font-bold text-white/20 block tracking-widest uppercase">LTC</span>
                        </div>
                    </div>
                </motion.div>

                {/* Strategy Status Tile */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-8 glass-spectral group">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black tracking-[0.4em] text-[#f15a24]/50 uppercase">Signal / 信号</span>
                        <Cpu size={14} className="text-[#f15a24]" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className={`text-3xl font-black italic uppercase ${data.strategy?.signal === 'BUY' ? 'text-emerald-500' : data.strategy?.signal === 'SELL' ? 'text-red-500' : 'text-white/60'}`}>
                                {data.strategy?.signal || 'MONITORING'}
                            </span>
                        </div>
                        {data.strategy?.ai_bias && (
                            <div className="pt-2 border-t border-[#f15a24]/10">
                                <span className={`text-[10px] font-black tracking-widest uppercase ${data.strategy.ai_bias === 'BULLISH' ? 'text-emerald-400' : data.strategy.ai_bias === 'BEARISH' ? 'text-red-400' : 'text-white/40'}`}>
                                    AI Tide: {data.strategy.ai_bias}
                                </span>
                                <p className="text-[9px] text-white/30 truncate">{data.strategy.ai_reason}</p>
                            </div>
                        )}
                        <span className="text-[9px] font-bold text-[#f15a24]/40 tracking-widest block uppercase">
                            Last Updated: {data.strategy?.timestamp ? new Date(data.strategy.timestamp).toLocaleTimeString() : 'N/A'}
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Tactical View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Indicators Panel */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-4">
                        <Gavel size={14} className="text-[#f15a24]" />
                        <h2 className="text-xs font-bold text-white/50 tracking-[0.4em] uppercase">Quants Triage / 三段階トリアージ</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <IndicatorTile 
                            label="EMA 20" 
                            value={data.strategy?.EMA_20?.toFixed(1) || '---'} 
                            sublabel="Trend Baseline"
                        />
                        <IndicatorTile 
                            label="RSI 14" 
                            value={data.strategy?.RSI_14?.toFixed(1) || '---'} 
                            unit="%"
                            sublabel={data.strategy?.RSI_14 > 70 ? "Overbought" : data.strategy?.RSI_14 < 30 ? "Oversold" : "Neutral"}
                        />
                        <IndicatorTile 
                            label="ATR 22" 
                            value={data.strategy?.ATR_22?.toFixed(1) || '---'} 
                            sublabel="Volatility Range"
                        />
                        <IndicatorTile 
                            label="Z-Score" 
                            value={data.strategy?.Z_score?.toFixed(2) || '---'} 
                            unit="σ"
                            sublabel="Mean Reversion (30m)"
                        />
                    </div>
                </div>

                {/* System Monitor Area */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-4">
                        <Activity size={14} className="text-[#f15a24]" />
                        <h2 className="text-xs font-bold text-white/50 tracking-[0.4em] uppercase">System Pulse / 執行パルス</h2>
                    </div>
                    <div className="p-8 bg-black/60 border border-white/5 rounded-[40px] space-y-6">
                        <div className="flex justify-between items-end border-b border-white/5 pb-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Fee Guard</span>
                                <p className="text-sm font-black tracking-wide">ACTIVE: 06:50 JST</p>
                            </div>
                            <div className="text-right space-y-1">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Rate Limit</span>
                                <p className="text-sm font-black tracking-wide">1,000 ms (HARD)</p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-2 bg-[#f15a24]/10 rounded-lg">
                                    <Shield size={16} className="text-[#f15a24]" />
                                </div>
                                <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">Operational Guardrails Engaged / 安全機構作動中</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="h-full bg-[#f15a24]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradingDashboard;
