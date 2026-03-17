import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, ChevronDown, Cpu } from 'lucide-react';
import { OPENROUTER_MODELS } from '../gemini';

/**
 * PortalGrimoire - The Ritualistic API Key Entry UI
 * Transforms technical configuration into a spiritual ceremony.
 */
export default function PortalGrimoire({ 
    geminiKey, 
    setGeminiKey, 
    isValidatingApi, 
    apiConnectionStatus, 
    handleValidateApi,
    preferredModel,
    setPreferredModel
}) {
    const [detectedKey, setDetectedKey] = useState('');
    const [isResonating, setIsResonating] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [turningSlot, setTurningSlot] = useState(null); 
    const [showModelList, setShowModelList] = useState(false);
    const [customModel, setCustomModel] = useState('');

    function isKeyPattern(str) {
        return str.length > 20 && (str.startsWith('AIza') || str.startsWith('sk-or-'));
    }

    const checkClipboard = useCallback(async function checkClipboard() {
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

    useEffect(function setupClipboardListener() {
        window.addEventListener('focus', checkClipboard);
        return () => window.removeEventListener('focus', checkClipboard);
    }, [checkClipboard]);

    function performConsecrate(key, slotIndex) {
        const currentKeys = geminiKey.split(',').map(k => k.trim()).filter(Boolean);
        
        if (currentKeys.includes(key)) {
            setErrorMessage('このカギは違います。');
            return false;
        }

        const actualSlot = slotIndex !== null ? slotIndex : currentKeys.length;
        setTurningSlot(actualSlot);
        
        setTimeout(function updateKeyState() {
            const nextKeys = [...currentKeys];
            if (slotIndex !== null) {
                nextKeys[slotIndex] = key;
            } else {
                nextKeys.push(key);
            }
            
            const keyString = nextKeys.join(',');
            setGeminiKey(keyString);
            localStorage.setItem('itako_gemini_key', keyString);
            
            setTurningSlot(null);
            setDetectedKey('');
            setIsResonating(false);
            setErrorMessage('');
            setEditingSlot(null);
        }, 800);

        return true;
    }

    function handleConsecrate() {
        if (detectedKey) performConsecrate(detectedKey, null);
    }

    function handleManualPaste(idx, e) {
        const val = e.target.value.trim();
        if (isKeyPattern(val)) {
            performConsecrate(val, idx);
        } else if (val.length > 5) {
            setErrorMessage('鍵の形状が正しくありません。');
        }
    }

    function handleClearKeys() {
        setGeminiKey('');
        localStorage.removeItem('itako_gemini_key');
        setErrorMessage('');
        setEditingSlot(null);
    }

    const currentKeys = geminiKey.split(',').map(k => k.trim());

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center py-12">
            <div className="perspective-1000 relative w-full max-w-2xl h-[450px] md:h-[550px] flex items-center justify-center">
                <div className="absolute inset-x-8 inset-y-0 bg-white/[0.01] rounded-lg shadow-2xl -rotate-1 border border-white/5" />
                <div className="absolute inset-x-4 inset-y-0 bg-white/[0.01] rounded-lg shadow-2xl rotate-1 border border-white/5" />
                
                <motion.div 
                    initial={{ rotateY: -10, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    className="relative w-full h-full bg-[#111] border border-white/10 rounded-xl overflow-hidden glass-spectral flex flex-col md:flex-row transform-style-3d shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                >
                    <div className="w-full md:w-1/2 h-full border-r border-white/5 flex flex-col p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-16 h-16 border-l border-t border-white/10 rounded-tl-3xl m-4" />
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-r border-b border-white/10 rounded-br-3xl m-4" />
                        
                        <div className="flex-1 flex flex-col justify-center space-y-8 relative z-10">
                            <div className="space-y-4">
                                <h3 className="text-xl md:text-2xl font-black italic tracking-widest text-[#f15a24] font-oswald uppercase">
                                    Spectral Resonator
                                </h3>
                                <div className="w-12 h-1 bg-[#f15a24] rounded-full" />
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] md:text-xs leading-relaxed text-white/40 font-serif italic text-justify">
                                    「三つの鍵は、過去・現在・未来を繋ぐ灯火。ここに奉納されし鍵が、深淵の霧を晴らす回路となります。」
                                </p>

                                <AnimatePresence mode="wait">
                                    {isResonating && (
                                        <motion.div 
                                            key="action"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-4"
                                        >
                                            <div className="p-4 bg-[#f15a24]/5 border border-[#f15a24]/30 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles size={14} className="text-[#f15a24]" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Key Resonating</span>
                                                </div>
                                                <p className="text-[8px] text-white/30 truncate mb-4 font-mono">{detectedKey}</p>
                                                
                                                {detectedKey.startsWith('sk-or-') && (
                                                    <div className="mb-4 p-3 bg-black/40 rounded-xl border border-white/5">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[7px] text-white/30 uppercase tracking-widest">Selected Model</span>
                                                            <Cpu size={10} className="text-[#f15a24]/50" />
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setShowModelList(!showModelList); }}
                                                            className="w-full flex items-center justify-between px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] text-white/80 transition-colors border border-white/10"
                                                        >
                                                            <span className="truncate">{OPENROUTER_MODELS.find(m => m.id === preferredModel)?.name || preferredModel}</span>
                                                            <ChevronDown size={12} className={`transition-transform ${showModelList ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        
                                                        <AnimatePresence>
                                                            {showModelList && (
                                                                <motion.div 
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden mt-2 space-y-1"
                                                                >
                                                                    {OPENROUTER_MODELS.map(m => (
                                                                        <button
                                                                            key={m.id}
                                                                            onClick={() => { setPreferredModel(m.id); setShowModelList(false); }}
                                                                            className={`w-full text-left px-2 py-1.5 rounded hover:bg-white/10 text-[8px] transition-colors ${preferredModel === m.id ? 'text-[#f15a24] bg-[#f15a24]/5' : 'text-white/40'}`}
                                                                        >
                                                                            {m.name}
                                                                        </button>
                                                                    ))}
                                                                    <div className="pt-1 mt-1 border-t border-white/5">
                                                                        <input 
                                                                            type="text"
                                                                            placeholder="Custom model ID..."
                                                                            className="w-full bg-transparent p-1 text-[8px] text-white/60 outline-none"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    setPreferredModel(e.target.value);
                                                                                    setShowModelList(false);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={handleConsecrate}
                                                    disabled={isValidatingApi}
                                                    className="w-full py-3 bg-[#f15a24] text-white rounded-full font-black text-[9px] tracking-[0.3em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(241,90,36,0.3)]"
                                                >
                                                    {isValidatingApi ? 'Consecrating...' : '奉納する'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {(apiConnectionStatus === 'error' || currentKeys.filter(Boolean).length > 0) && (
                            <button 
                                onClick={handleClearKeys}
                                className="mt-8 text-[8px] font-black text-white/10 tracking-[0.3em] uppercase hover:text-[#f15a24] transition-colors self-start"
                            >
                                Reset Ritual
                            </button>
                        )}
                    </div>

                    <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-center p-8 bg-black/20">
                        <div className="flex flex-col gap-10">
                            {[0, 1, 2].map(function renderSlot(idx) {
                                const key = currentKeys[idx] || '';
                                const hasKey = !!key;
                                const isTurning = turningSlot === idx;
                                const isEditing = editingSlot === idx;

                                return (
                                    <div key={idx} className="relative flex items-center group/slot">
                                        <AnimatePresence>
                                            {isTurning && (
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 1 }}
                                                    animate={{ scale: 3, opacity: 0 }}
                                                    className="absolute inset-0 border border-[#f15a24] rounded-full pointer-events-none"
                                                />
                                            )}
                                        </AnimatePresence>

                                        <motion.div 
                                            onClick={function clickSlot() { setEditingSlot(idx); setErrorMessage(''); }}
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
                                                            onChange={function manualPaste(e) { handleManualPaste(idx, e); }}
                                                            onBlur={function blurSlot() { if (!isTurning) setEditingSlot(null); }}
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
                                SILENCE AS A LANGUAGE...
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-12 flex items-center gap-6">
                {[
                    { label: 'Detection', active: isResonating },
                    { label: 'Validation', active: isValidatingApi },
                    { label: 'Emission', active: apiConnectionStatus === 'success' }
                ].map(function renderPhase(p, i) {
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-1 h-1 rounded-full ${p.active ? 'bg-[#f15a24] shadow-[0_0_8px_#f15a24]' : 'bg-white/10'}`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${p.active ? 'text-white' : 'text-white/20'}`}>{p.label}</span>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-2">
                <button 
                    onClick={handleValidateApi} 
                    disabled={isValidatingApi || !geminiKey}
                    className={`px-12 py-3 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 font-oswald border
                                ${apiConnectionStatus === 'success' 
                                    ? 'bg-transparent border-emerald-500/50 text-emerald-400' 
                                    : geminiKey && !isValidatingApi ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-transparent text-white/10 border-white/5 opacity-50 cursor-not-allowed'}`}
                >
                    {isValidatingApi ? '回路を安定させています...' : 
                     apiConnectionStatus === 'success' ? '回路は完全に開通しました' : '回路を安定化させる (Stabilize)'}
                </button>
            </div>
        </div>
    );
}
