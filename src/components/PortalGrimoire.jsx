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
    const [editingSlot, setEditingSlot] = useState(null); // Which slot is being clicked/pasted to
    const [turningSlot, setTurningSlot] = useState(null); // Which slot is currently "turning"

    // Validate if a string looks like an API key
    const isKeyPattern = (str) => {
        return str.length > 20 && (str.startsWith('AIza') || str.startsWith('sk-or-'));
    };

    // Check clipboard when window gains focus (Automatic Resonance)
    const checkClipboard = useCallback(async () => {
        try {
            if (!navigator.clipboard) return;
            const text = await navigator.clipboard.readText();
            const trimmed = text.trim();
            
            if (isKeyPattern(trimmed)) {
                const currentKeys = geminiKey.split(',').map(k => k.trim());
                if (!currentKeys.includes(trimmed) && trimmed !== detectedKey) {
                    setDetectedKey(trimmed);
                    setIsResonating(true);
                    setErrorMessage('');
                }
            }
        } catch (e) {}
    }, [geminiKey, detectedKey]);

    useEffect(() => {
        window.addEventListener('focus', checkClipboard);
        return () => window.removeEventListener('focus', checkClipboard);
    }, [checkClipboard]);

    const performConsecrate = (key, slotIndex) => {
        const currentKeys = geminiKey.split(',').map(k => k.trim()).filter(Boolean);
        
        if (currentKeys.includes(key)) {
            setErrorMessage('このカギは違います。');
            return false;
        }

        // Trigger turning animation
        const actualSlot = slotIndex !== null ? slotIndex : currentKeys.length;
        setTurningSlot(actualSlot);
        
        setTimeout(() => {
            const nextKeys = [...currentKeys];
            if (slotIndex !== null) {
                nextKeys[slotIndex] = key;
            } else {
                nextKeys.push(key);
            }
            
            setGeminiKey(nextKeys.join(','));
            localStorage.setItem('itako_gemini_key', nextKeys.join(','));
            
            setTurningSlot(null);
            setDetectedKey('');
            setIsResonating(false);
            setErrorMessage('');
            setEditingSlot(null);
        }, 800);

        return true;
    };

    const handleConsecrate = () => {
        if (detectedKey) performConsecrate(detectedKey, null);
    };

    const handleManualPaste = (idx, e) => {
        const val = e.target.value.trim();
        if (isKeyPattern(val)) {
            performConsecrate(val, idx);
        } else if (val.length > 5) {
            setErrorMessage('鍵の形状が正しくありません。');
        }
    };

    const handleClearKeys = () => {
        setGeminiKey('');
        localStorage.removeItem('itako_gemini_key');
        setErrorMessage('');
        setEditingSlot(null);
    };

    const keySlots = geminiKey.split(',').map(k => k.trim());

    return (
        <div className="flex flex-col items-center py-12 px-4 space-y-12">
            {/* The Portal Grimoire */}
            <div className="relative group perspective-1000">
                <motion.div 
                    animate={isResonating ? { 
                        rotateY: [0, 2, -2, 0],
                        z: [0, 10, 0],
                        boxShadow: "0 0 40px rgba(241, 90, 36, 0.3)"
                    } : {}}
                    transition={{ duration: 1.5, repeat: isResonating ? Infinity : 0 }}
                    className="relative w-64 h-80 transform-style-3d cursor-default"
                >
                    {/* Book Base */}
                    {[...Array(3)].map((_, i) => (
                        <div 
                            key={i}
                            className="absolute inset-0 bg-[#151515] rounded-r-lg border-l-4 border-zinc-900"
                            style={{ transform: `translateZ(${-i * 3}px)` }}
                        />
                    ))}

                    {/* Book Cover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 to-black rounded-r-lg border border-white/5 shadow-3xl overflow-hidden">
                        {/* Three Keyholes (Interaction target) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 p-8">
                            {[0, 1, 2].map(idx => {
                                const hasKey = !!keySlots[idx];
                                const isEditing = editingSlot === idx;
                                const isTurning = turningSlot === idx;

                                return (
                                    <div 
                                        key={idx} 
                                        className="relative flex items-center group/slot"
                                        onClick={() => !hasKey && !isTurning && setEditingSlot(idx)}
                                    >
                                        {/* Key Turning Gear / Aura */}
                                        <AnimatePresence>
                                            {isTurning && (
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 0, rotate: 0 }}
                                                    animate={{ scale: 2, opacity: [0, 0.5, 0], rotate: 180 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 border border-[#f15a24]/30 rounded-full pointer-events-none"
                                                />
                                            )}
                                        </AnimatePresence>

                                        <motion.div 
                                            animate={isTurning ? { 
                                                rotate: [0, 90, 180],
                                                scale: [1, 1.1, 1]
                                            } : isEditing ? { 
                                                scale: 1.05, 
                                                borderColor: 'rgba(241,90,36,0.8)',
                                                boxShadow: '0 0 20px rgba(241,90,36,0.2)'
                                            } : {}}
                                            transition={{ duration: 0.8, ease: "easeInOut" }}
                                            className={`w-14 h-18 rounded-t-full border transition-all duration-500 cursor-pointer flex items-center justify-center relative
                                                        ${hasKey ? 'border-[#f15a24] bg-[#f15a24]/5 shadow-[0_0_20px_rgba(241,90,36,0.4)]' : 
                                                          isEditing ? 'border-[#f15a24] bg-[#f15a24]/10' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                                        >
                                            <AnimatePresence mode="wait">
                                                {hasKey ? (
                                                    <motion.div 
                                                        key="check"
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-[#f15a24] flex flex-col items-center"
                                                    >
                                                        <Sparkles size={16} />
                                                        <div className="w-[1px] h-4 bg-[#f15a24] mt-1 opacity-50" />
                                                    </motion.div>
                                                ) : isEditing ? (
                                                    <motion.div 
                                                        key="input" 
                                                        initial={{ opacity: 0, y: 10 }} 
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex flex-col items-center gap-1"
                                                    >
                                                        <div className="w-4 h-4 rounded-full border border-[#f15a24] animate-pulse" />
                                                        <input 
                                                            autoFocus
                                                            type="password"
                                                            onChange={(e) => handleManualPaste(idx, e)}
                                                            onBlur={() => !isTurning && setEditingSlot(null)}
                                                            className="w-10 bg-transparent text-white text-[8px] text-center outline-none"
                                                            placeholder="..."
                                                        />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div key="empty" className="flex flex-col items-center opacity-20 group-hover/slot:opacity-50 transition-opacity">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white mb-1" />
                                                        <div className="w-[1px] h-4 bg-white" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                        
                                        <div className="absolute -left-16 text-[7px] font-black text-white/5 tracking-widest uppercase origin-right -rotate-90">
                                            Gate {idx + 1}
                                        </div>

                                        {/* Error text local to slot */}
                                        <AnimatePresence>
                                            {isEditing && errorMessage && (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute left-20 w-40 text-[9px] font-bold text-red-500 leading-tight italic"
                                                >
                                                    {errorMessage}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Itako's Voice Display */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 text-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        {turningSlot !== null ? (
                            <motion.p key="turning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-serif italic text-emerald-400">
                                「……封印が、解かれます」
                            </motion.p>
                        ) : isResonating ? (
                            <motion.p 
                                key="resonance"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[10px] md:text-xs font-serif italic text-[#f15a24] tracking-widest leading-relaxed drop-shadow-[0_0_8px_rgba(241,90,36,0.6)]"
                            >
                                「そなたが持つその光の断片……ここに捧げますか？」
                            </motion.p>
                        ) : editingSlot !== null ? (
                            <motion.p key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-white/60 tracking-[0.2em]">
                                鍵穴に、授かった鍵を直接流し込んでください。
                            </motion.p>
                        ) : (
                            <motion.p key="void" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} className="text-[10px] text-white/40 tracking-widest uppercase">
                                鍵穴をクリックして、鍵を差し込んでください。
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            onClick={handleConsecrate}
                            className="w-full py-4 rounded-full bg-[#f15a24] text-white font-black text-xs tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(241,90,36,0.5)] font-oswald"
                        >
                            自動検知した鍵を奉納する
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
                     apiConnectionStatus === 'success' ? '回路は完全に開通しました' : '回路を安定化させる (Stabilize)'}
                </button>

                {geminiKey && (
                    <button onClick={handleClearKeys} className="text-[8px] font-bold text-white/20 uppercase tracking-[0.4em] hover:text-red-400 transition-colors py-2">
                        すべての鍵を引き抜く
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
