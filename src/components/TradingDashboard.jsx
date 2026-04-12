import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Wallet, Activity, Shield, ArrowUpRight, ArrowDownRight, Zap, Ban } from 'lucide-react';
import gsap from 'gsap';

const TradingDashboard = ({ user }) => {
    const [price, setPrice] = useState(11150); // LTC/JPY approx
    const [priceChange, setPriceChange] = useState(0);
    const [tradeData, setTradeData] = useState({
        jpy_balance: 1200,
        ltc_balance: 0.18, // Simulated
        status: 'MONITORING',
        signal: 'NEUTRAL',
        last_action: 'NONE'
    });

    // LTC WebSocket simulation
    useEffect(() => {
        const interval = setInterval(() => {
            const diff = (Math.random() - 0.5) * 50;
            setPrice(prev => prev + diff);
            setPriceChange(diff);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // GSAP Animation for numbers
    useEffect(() => {
        gsap.to(".price-number", {
            scale: 1.02,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
    }, [price]);

    return (
        <div className="p-4 md:p-8 space-y-8 font-oswald text-white h-full overflow-y-auto itako-scrollbar-thin pb-32">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-black/60 border border-white/5 rounded-[35px] backdrop-blur-xl group hover:border-[#325ba0]/30 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">Market Price / 市場価格</span>
                        <Zap size={14} className="text-[#325ba0]" />
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black price-number tracking-tighter">
                            ¥{Math.floor(price).toLocaleString()}
                        </span>
                        <span className={`text-xs font-bold ${priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                        </span>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-black/60 border border-white/5 rounded-[35px] backdrop-blur-xl group hover:border-emerald-500/30 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">JPY Balance / 日本円残高</span>
                        <Wallet size={14} className="text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black tracking-tighter">
                            ¥{tradeData.jpy_balance.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">RAKUTEN WALLET</span>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-black/60 border border-white/5 rounded-[35px] backdrop-blur-xl group hover:border-[#325ba0]/30 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">LTC Holdings / 保有数量</span>
                        <TrendingUp size={14} className="text-[#325ba0]" />
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black tracking-tighter">
                            {tradeData.ltc_balance.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">LTC</span>
                    </div>
                </motion.div>
            </div>

            {/* Main Trading View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Engine Status */}
                <div className="space-y-6">
                    <h2 className="text-sm font-bold text-white/30 tracking-[0.4em] uppercase px-4 border-l-2 border-[#325ba0]">Execution Engine / 執行エンジン</h2>
                    <div className="p-8 bg-black/80 border-2 border-white/5 rounded-[40px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Activity size={120} />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Status</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xl font-black uppercase italic">Healthy / 霊的同調中</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-1">Current Strategy</span>
                                    <span className="text-xs font-black text-[#325ba0]">ZEN_GRID_LTC_V1</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-2">Signal</span>
                                    <span className="text-lg font-black text-white/80">MONITORING</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-2">Z-Score (MA30)</span>
                                    <span className="text-lg font-black text-emerald-500">-1.24 σ</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-4">Operational Guardrails</span>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                                        <Shield size={12} className="text-[#325ba0]" />
                                        <span className="text-[9px] font-bold tracking-wider">FEE_GUARD: ACTIVE (06:50)</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full opacity-40">
                                        <Ban size={12} />
                                        <span className="text-[9px] font-bold tracking-wider">DRY_RUN: ON</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ritual Logs */}
                <div className="space-y-6">
                    <h2 className="text-sm font-bold text-white/30 tracking-[0.4em] uppercase px-4 border-l-2 border-[#325ba0]">Trade Logs / 霊界通信記録</h2>
                    <div className="bg-black/40 border border-white/5 rounded-[40px] overflow-hidden">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center px-8">
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Activity Feed</span>
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            </div>
                        </div>
                        <div className="p-2 h-[300px] overflow-y-auto itako-scrollbar-thin space-y-2">
                            {[
                                { t: '21:13', m: 'LTC WebSocket 接続成功。購読開始 (symbolId: 10)', c: 'text-emerald-500' },
                                { t: '21:10', m: 'Zen-Grid エンジン起動。Z-score 監視中...', c: 'text-white/60' },
                                { t: '21:05', m: '戦略切り替え: BTC -> LTC (ライトコイン)', c: 'text-[#325ba0]' },
                                { t: '21:00', m: 'NotebookLM 調査完了。署名ロジックを更新。', c: 'text-white/40' },
                                { t: '20:55', m: 'デイ・グリッド戦略案を承認。', c: 'text-white/20' }
                            ].map((log, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group">
                                    <span className="text-[9px] font-mono text-white/30 mt-1">{log.t}</span>
                                    <span className={`text-xs font-medium tracking-wide ${log.c} group-hover:text-white transition-colors`}>
                                        {log.m}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradingDashboard;
