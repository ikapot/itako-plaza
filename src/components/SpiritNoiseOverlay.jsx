import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

const SpiritNoiseOverlay = ({ error, onRetry, onDismiss }) => {
    if (!error) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12 overflow-hidden pointer-events-auto"
            >
                {/* Spiritual Noise Background */}
                <motion.div 
                    animate={{ 
                        backgroundColor: ['rgba(10,0,0,0.9)', 'rgba(20,5,5,0.95)', 'rgba(10,0,0,0.9)'],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                    className="absolute inset-0 backdrop-blur-xl"
                />

                {/* Glitch Overlay */}
                <div 
                    className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay spiritual-glitch" 
                    style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                    }}
                />

                <motion.div 
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    className="relative max-w-lg w-full bg-black/60 border border-red-500/30 p-8 rounded-[40px] shadow-[0_0_50px_rgba(255,0,0,0.2)] text-center backdrop-blur-md"
                >
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="absolute inset-0 bg-red-500 rounded-full blur-xl"
                            />
                            <div className="relative bg-red-500/20 p-4 rounded-full border border-red-500/40">
                                <Zap className="text-red-500" size={32} />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black italic tracking-[0.2em] text-white mb-2 uppercase font-oswald">
                        Spectral Interference
                    </h2>
                    <p className="text-[10px] font-black text-red-500/80 tracking-[0.3em] uppercase mb-6">
                        霊的回路に深刻なノイズが発生しました
                    </p>

                    <div className="space-y-4 mb-8">
                        <p className="text-xs text-white/60 font-serif leading-relaxed italic px-4">
                            {error.message || "「接続が不安定です。阿頼耶識からの応答が途絶えました。別の経路を通じて再試行するか、一度瞑想（中断）することをお勧めします。」"}
                        </p>
                        <div className="py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-xl inline-block">
                            <code className="text-[9px] text-red-400 font-mono tracking-wider uppercase">
                                STATUS: {error.code || 'UNKNOWN_COLLAPSE'}
                            </code>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onRetry}
                            className="flex items-center justify-center gap-2 py-4 px-6 bg-[#f15a24] text-white rounded-full font-black text-[10px] tracking-[0.2em] uppercase shadow-lg shadow-[#f15a24]/20 border border-[#f15a24]/50"
                        >
                            <RefreshCw size={14} />
                            回路を再接続
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onDismiss}
                            className="flex items-center justify-center gap-2 py-4 px-6 bg-white/5 text-white/50 hover:text-white rounded-full font-black text-[10px] tracking-[0.2em] uppercase border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            <XCircle size={14} />
                            一時中断
                        </motion.button>
                    </div>
                    
                    <p className="mt-8 text-[8px] text-white/10 uppercase tracking-[0.4em]">
                        VOID_SECURITY_PROTOCOL_ACTIVE
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SpiritNoiseOverlay;
