import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Key, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const SettingsOverlay = React.memo(({ 
    showSettings, 
    setShowSettings, 
    geminiKey, 
    setGeminiKey, 
    isValidatingApi, 
    apiConnectionStatus, 
    handleValidateApi
}) => {

    return (
        <AnimatePresence>
            {showSettings ? (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSettings(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#0a0a0a] border-l border-white/10 z-[120] p-8 shadow-4xl flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-2xl font-black font-oswald uppercase tracking-widest text-white/40">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 text-white/20 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-12">
                            {/* API Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                        <Key size={14} className="text-white/40" />
                                    </div>
                                    <h3 className="text-xs font-black tracking-[0.2em] text-white/80 uppercase font-oswald">Circuit Control</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={geminiKey === 'PROXY_MODE' ? '' : geminiKey}
                                            onChange={(e) => setGeminiKey(e.target.value)}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 font-mono focus:border-[#f15a24]/50 outline-none transition-all placeholder:text-white/20"
                                            placeholder={geminiKey === 'PROXY_MODE' ? "🟢 Free API Proxy Active" : "sk-or-v1-..."}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {apiConnectionStatus === 'success' ? (
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                            ) : apiConnectionStatus === 'error' ? (
                                                <AlertCircle size={14} className="text-red-500" />
                                            ) : null}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Stability</span>
                                    <span className={`text-[10px] font-bold uppercase transition-colors ${apiConnectionStatus === 'success' ? 'text-emerald-500' : 'text-[#f15a24]'}`}>
                                        {apiConnectionStatus === 'success' ? 'Locked' : 'Fluctuating'}
                                    </span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: apiConnectionStatus === 'success' ? '100%' : '30%' }}
                                        className={`h-full ${apiConnectionStatus === 'success' ? 'bg-emerald-500' : 'bg-[#f15a24]'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 space-y-4">
                            <button
                                onClick={() => handleValidateApi(geminiKey)}
                                disabled={isValidatingApi || !geminiKey}
                                className="w-full py-4 bg-white text-black rounded-xl font-black text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                {isValidatingApi ? <RefreshCw size={14} className="animate-spin" /> : null}
                                {isValidatingApi ? 'Stabilizing...' : apiConnectionStatus === 'error' ? 'Retry Connection' : 'Stabilize Circuit'}
                            </button>
                            
                            <p className="text-[8px] text-white/10 font-serif italic text-center uppercase tracking-widest">
                                Ethereal Protocol v1.2.1
                            </p>
                        </div>
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
});

SettingsOverlay.displayName = 'SettingsOverlay';
export default SettingsOverlay;
