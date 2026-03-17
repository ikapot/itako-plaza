import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';

/**
 * PortalGrimoire - The Ritualistic API Key Entry UI
 * Transforms technical configuration into a spiritual ceremony.
 */
const PortalGrimoire = ({ 
    geminiKey, 
    setGeminiKey, 
    isValidatingApi, 
    apiConnectionStatus, 
    handleValidateApi 
}) => {
    const [detectedKey, setDetectedKey] = useState('');
    const [isResonating, setIsResonating] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Validate if a string looks like an API key
    const isKeyPattern = (str) => {
        return str.length > 20 && (str.startsWith('AIza') || str.startsWith('sk-or-'));
    };

    // Check clipboard when window gains focus
    const checkClipboard = useCallback(async () => {
        try {
            // Some browsers require explicit permission or a user gesture
            if (!navigator.clipboard) return;
            const text = await navigator.clipboard.readText();
            const trimmed = text.trim();
            
            if (isKeyPattern(trimmed)) {
                // If it's a new key we don't already have
                const currentKeys = geminiKey.split(',').map(k => k.trim());
                if (!currentKeys.includes(trimmed) && trimmed !== detectedKey) {
                    setDetectedKey(trimmed);
                    setIsResonating(true);
                    setErrorMessage('');
                }
            }
        } catch (e) {
            // Silence clipboard errors to avoid breaking immersion
        }
    }, [geminiKey, detectedKey]);

    useEffect(() => {
        window.addEventListener('focus', checkClipboard);
        return () => window.removeEventListener('focus', checkClipboard);
    }, [checkClipboard]);

    const handleConsecrate = () => {
        if (!detectedKey) return;
        
        const currentKeys = geminiKey.split(',').map(k => k.trim()).filter(Boolean);
        
        if (currentKeys.includes(detectedKey)) {
            setErrorMessage('このカギは違います。');
            setIsResonating(false);
            return;
        }

        if (currentKeys.length >= 3) {
            setErrorMessage('器が満たされています。');
            return;
        }

        const nextKeys = [...currentKeys, detectedKey].join(',');
        setGeminiKey(nextKeys);
        localStorage.setItem('itako_gemini_key', nextKeys);
        
        // Reset state
        setDetectedKey('');
        setIsResonating(false);
        setErrorMessage('');
    };

    const handleClearKeys = () => {
        setGeminiKey('');
        localStorage.removeItem('itako_gemini_key');
        setErrorMessage('');
    };

    const keySlots = geminiKey.split(',').map(k => k.trim()).filter(Boolean);

    return (
        <div className="flex flex-col items-center py-12 px-4 space-y-12">
            {/* The Portal Grimoire (Pseudo-3D CSS) */}
            <div className="relative group perspective-1000">
                <motion.div 
                    animate={isResonating ? { 
                        rotateY: [0, 5, -5, 0],
                        z: [0, 20, 0],
                        boxShadow: "0 0 50px rgba(241, 90, 36, 0.4)"
                    } : {}}
                    transition={{ duration: 0.5, repeat: isResonating ? Infinity : 0 }}
                    className="relative w-64 h-80 transform-style-3d cursor-default"
                >
                    {/* Book Base (Stacked Layers for depth) */}
                    {[...Array(5)].map((_, i) => (
                        <div 
                            key={i}
                            className="absolute inset-0 bg-[#1a1a1a] rounded-r-lg border-l-4 border-zinc-800"
                            style={{ 
                                transform: `translateZ(${-i * 2}px)`,
                                opacity: 1 - i * 0.1
                            }}
                        />
                    ))}

                    {/* Book Cover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black rounded-r-lg border border-white/10 shadow-3xl overflow-hidden">
                        {/* Decorative Pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <pattern id="bookPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="white" strokeWidth="0.5" />
                                </pattern>
                                <rect width="100%" height="100%" fill="url(#bookPattern)" />
                            </svg>
                        </div>

                        {/* Three Keyholes (Slots) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 p-8">
                            {[0, 1, 2].map(idx => {
                                const hasKey = !!keySlots[idx];
                                return (
                                    <div key={idx} className="relative group/keyhole">
                                        <div className={`w-12 h-16 rounded-t-full border transition-all duration-700
                                                        ${hasKey ? 'border-[#f15a24] bg-[#f15a24]/10 shadow-[0_0_15px_#f15a24]' : 'border-white/10 bg-black'}`}>
                                            {hasKey && (
                                                <motion.div 
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 flex items-center justify-center"
                                                >
                                                    <Sparkles size={16} className="text-[#f15a24]" />
                                                </motion.div>
                                            )}
                                        </div>
                                        <div className="w-14 h-2 bg-zinc-800 rounded-sm border-t border-white/5" />
                                        
                                        {/* Tooltip for key existence */}
                                        <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-[8px] font-bold text-white/20 tracking-widest uppercase opacity-0 group-hover/keyhole:opacity-100 transition-opacity">
                                            {hasKey ? 'Consecrated' : 'Empty'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Resonance Glow Overlay */}
                        <AnimatePresence>
                            {isResonating && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-[#f15a24]/10 mix-blend-overlay pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Itako's Voice Display */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 text-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        {isResonating ? (
                            <motion.p 
                                key="resonance"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[10px] md:text-xs font-serif italic text-[#f15a24] tracking-widest leading-relaxed drop-shadow-[0_0_8px_rgba(241,90,36,0.6)]"
                            >
                                「そなたが持つその光の断片……ここに捧げますか？」
                            </motion.p>
                        ) : errorMessage ? (
                            <motion.p 
                                key="error"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm font-bold text-red-500 tracking-tighter"
                                style={{ textShadow: "0 0 10px rgba(239, 68, 68, 0.5)" }}
                            >
                                {errorMessage}
                            </motion.p>
                        ) : geminiKey ? (
                            <motion.p 
                                key="presence"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                className="text-[10px] text-white/60 tracking-[0.2em]"
                            >
                                回路は静かに、通電を待っています。
                            </motion.p>
                        ) : (
                            <motion.p 
                                key="void"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                className="text-[10px] text-white/40 tracking-widest uppercase"
                            >
                                冥界の門を開く「三つの鍵」をここに……
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Ritual Actions */}
            <div className="w-full max-w-sm flex flex-col gap-4">
                <AnimatePresence>
                    {isResonating && (
                        <motion.button
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={handleConsecrate}
                            className="w-full py-4 rounded-full bg-[#f15a24] text-white font-black text-xs tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(241,90,36,0.8)] hover:scale-105 active:scale-95 transition-all font-oswald"
                        >
                            鍵を奉納する (Consecrate Key)
                        </motion.button>
                    )}
                </AnimatePresence>

                <button 
                    onClick={handleValidateApi} 
                    disabled={isValidatingApi || !geminiKey}
                    className={`w-full py-4 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 font-oswald border
                                ${apiConnectionStatus === 'success' 
                                    ? 'bg-transparent border-emerald-500/50 text-emerald-400' 
                                    : geminiKey && !isValidatingApi ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-transparent text-white/10 border-white/5 opacity-50 cursor-not-allowed'}`}
                >
                    {isValidatingApi ? '回路を安定させています...' : 
                     apiConnectionStatus === 'success' ? '回路は完全に開通しました' : 
                     apiConnectionStatus === 'error' ? '回路の不整合を修復する' : '回路を安定化させる (Stabilize)'}
                </button>

                {geminiKey && (
                    <button 
                        onClick={handleClearKeys}
                        className="text-[8px] font-bold text-white/20 uppercase tracking-[0.4em] hover:text-red-400 transition-colors py-2"
                    >
                        鍵をすべて返却する (Revoke All Keys)
                    </button>
                )}
            </div>

            {/* Instructions for the User */}
            <div className="flex flex-col items-center gap-4 text-center max-w-xs">
                <div className="flex items-center gap-2 text-white/20">
                    <AlertCircle size={12} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Ritual Guidance</span>
                </div>
                <p className="text-[10px] text-white/30 leading-relaxed italic font-serif">
                    Google AI Studio 等で取得した鍵（API Key）をコピーして、この広場へ戻ってください。本が新たな鍵を見つけ出し、語りかけてくるはずです。
                </p>
                <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] font-bold text-[#f15a24] hover:text-white transition-colors underline decoration-[#f15a24]/30 underline-offset-4"
                >
                    鍵を授かりに行く（取得先へ）
                </a>
            </div>
        </div>
    );
};

export default PortalGrimoire;
