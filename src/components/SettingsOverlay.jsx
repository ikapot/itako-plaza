import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import SpectralResonator from './SpectralResonator';

const SettingsOverlay = React.memo(({ 
    showSettings, 
    setShowSettings, 
    geminiKey, 
    setGeminiKey, 
    isValidatingApi, 
    apiConnectionStatus, 
    validateGeminiApiKey, 
    setIsAppReady 
}) => {
    return (
        <AnimatePresence>
            {showSettings && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSettings(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm max-h-[90vh] bg-zinc-900 border border-white/10 p-8 rounded-[40px] z-[120] shadow-3xl overflow-y-auto itako-scrollbar"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold font-oswald tracking-widest text-white uppercase">Circuit Control</span>
                                <span className="text-[8px] font-black text-[#f15a24] tracking-[0.3em] uppercase">霊的回路の制御盤</span>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="text-white/20 hover:text-white transition-transform active:scale-90"><X size={20} /></button>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] font-oswald text-left">Abyssal Theme</label>
                                </div>
                                <p className="text-[10px] text-white/60 font-serif leading-relaxed">
                                    空間は常に深い闇と純白の言葉で覆われています。
                                </p>
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] font-oswald text-left">Spiritual Frequency</label>
                                        <span className="text-[7px] font-bold text-white/10 uppercase tracking-[0.2em]">霊的周波数 (API Key)</span>
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full ${geminiKey ? 'bg-[#f15a24] shadow-[0_0_10px_rgba(241,90,36,0.5)]' : 'bg-white/10'}`} />
                                </div>
                                <label className="block text-xs text-white/60 mb-1 uppercase tracking-widest">
                                    霊的周波数 / Spiritual Frequency (Gemini or OpenRouter API Key)
                                </label>
                                <div className="flex flex-col items-center gap-6">
                                    <div className="flex gap-4">
                                        {[0, 1, 2].map(idx => (
                                            <SpectralResonator 
                                                key={idx} 
                                                status={geminiKey.split(',')[idx] ? (isValidatingApi ? 'validating' : apiConnectionStatus) : 'idle'} 
                                                delay={idx * 0.1}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="password"
                                        value={geminiKey}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setGeminiKey(val);
                                            localStorage.setItem('itako_gemini_key', val);
                                        }}
                                        placeholder="sk-or-v1-..."
                                        className="w-full bg-black/40 border border-white/20 rounded-[20px] px-4 py-3 text-white text-xs font-mono outline-none focus:border-[#f15a24]/50 transition-colors text-center"
                                    />
                                </div>
                                <p className="mt-2 text-[10px] text-white/40 leading-relaxed">
                                    ※ Google AI Studio または OpenRouter のキーを入力してください。<br/>
                                    OpenRouter を使用すると、文豪ごとに最適なモデル（Claude 3.5 Sonnet等）が自動的に割り当てられます。
                                </p>
                                <button
                                    onClick={async () => {
                                        if (geminiKey && !isValidatingApi) {
                                            const isValid = await validateGeminiApiKey(geminiKey);
                                            if (isValid) {
                                                setIsAppReady(true);
                                                setTimeout(() => setShowSettings(false), 500);
                                            }
                                        }
                                    }}
                                    disabled={isValidatingApi}
                                    className={`w-full py-4 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 font-oswald ${apiConnectionStatus === 'success'
                                        ? 'bg-[#f15a24] text-white shadow-[0_0_20px_rgba(241,90,36,0.6)]'
                                        : geminiKey && !isValidatingApi ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20'
                                        }`}
                                >
                                    {isValidatingApi ? 'Synchronizing...' : apiConnectionStatus === 'error' ? 'Circuit Failure / Retry' : '回路を安定化させる (Stabilize)'}
                                </button>
                                {apiConnectionStatus === 'error' && (
                                    <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest text-center animate-pulse">
                                        Connection Failed.
                                    </p>
                                )}
                                 {!geminiKey && (
                                    <p className="text-[8px] font-bold text-[#fdb913]/50 uppercase tracking-widest text-center animate-pulse">
                                        Waiting for spiritual key...
                                    </p>
                                )}
                            </div>


                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[9px] leading-relaxed text-white/20 font-serif italic text-center">
                                    静かな深淵の奥底で、言葉の灯火をあなただけの明るさに。
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

SettingsOverlay.displayName = 'SettingsOverlay';
export default SettingsOverlay;
