import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, ChevronDown, Cpu, ShieldCheck, CheckCircle2, Key, RefreshCw } from 'lucide-react';
import { OPENROUTER_MODELS } from '../gemini';

/**
 * PortalGrimoire.jsx
 * OpenRouter専用のシングルキー・システムへのシンプルリデザイン版
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
    const [localKey, setLocalKey] = useState(geminiKey || '');
    const [isEditing, setIsEditing] = useState(!geminiKey);
    const [showModelList, setShowModelList] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (geminiKey && geminiKey !== localKey) {
            setLocalKey(geminiKey);
            setIsEditing(false);
        }
    }, [geminiKey]);

    async function handleHoneKey() {
        if (!localKey.startsWith('sk-or-')) {
            setErrorMessage('OpenRouter API Key (sk-or-...) を入力してください');
            return;
        }
        setErrorMessage('');
        setGeminiKey(localKey);
        setIsEditing(false);
        handleValidateApi(localKey);
    }

    return (
        <div className="flex flex-col items-center gap-12 w-full py-8">
            {/* The Abyssal Key Visual */}
            <div className="relative group">
                <motion.div 
                    animate={{ 
                        rotateZ: isValidatingApi ? [0, 360] : 0,
                        scale: isValidatingApi ? [1, 1.05, 1] : 1
                    }}
                    transition={{ 
                        rotateZ: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                    }}
                    className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-white/10 flex items-center justify-center relative bg-black/40 backdrop-blur-xl shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                >
                    <div className="absolute inset-2 border border-white/5 rounded-full" />
                    <Key size={48} className={`transition-colors duration-1000 ${apiConnectionStatus === 'success' ? 'text-emerald-400' : 'text-white/20'}`} />
                    
                    {/* Floating Particles */}
                    {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ 
                                opacity: [0, 0.5, 0],
                                scale: [0, 1, 0],
                                x: [0, Math.cos(i * 30) * 80],
                                y: [0, Math.sin(i * 30) * 80]
                            }}
                            transition={{ duration: 4, delay: i * 0.3, repeat: Infinity }}
                            className="absolute w-1 h-1 bg-[#f15a24] rounded-full blur-[1px]"
                        />
                    ))}
                </motion.div>
                
                {apiConnectionStatus === 'success' ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-emerald-500 text-black p-2 rounded-full shadow-lg">
                        <CheckCircle2 size={16} />
                    </motion.div>
                ) : null}
            </div>

            {/* Input Section */}
            <div className="w-full max-w-md space-y-6">
                {!isEditing && geminiKey ? (
                    <div className="space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setIsEditing(true)}
                            className="w-full p-6 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between group transition-all"
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[8px] font-black tracking-[0.3em] uppercase text-white/20">Frequency Established</span>
                                <span className="text-xs font-mono text-white/60 tracking-widest">{geminiKey.substring(0, 15)}•••••</span>
                            </div>
                            <RefreshCw size={16} className="text-white/20 group-hover:rotate-180 transition-transform duration-700" />
                        </motion.button>
                        
                        <div className="flex justify-center">
                             <button 
                                onClick={() => { setGeminiKey(''); setLocalKey(''); setIsEditing(true); }}
                                className="text-[8px] font-bold text-white/10 hover:text-red-400 transition-colors uppercase tracking-[0.3em]"
                            >
                                / Break Connection
                            </button>
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="relative">
                            <input
                                autoFocus
                                type="password"
                                value={localKey}
                                onChange={(e) => setLocalKey(e.target.value)}
                                placeholder="sk-or-v1-..."
                                className="w-full bg-black/60 border border-white/20 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-[#f15a24]/50 transition-all font-mono"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleHoneKey();
                                }}
                            />
                            <button 
                                onClick={handleHoneKey}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-[#f15a24] uppercase border-b border-[#f15a24]/30 pb-0.5 hover:text-white transition-colors"
                            >
                                定着させる
                            </button>
                        </div>
                        {errorMessage ? (
                            <p className="flex items-center gap-2 text-[10px] text-red-400 font-bold uppercase tracking-wider pl-2">
                                <AlertCircle size={12} /> {errorMessage}
                            </p>
                        ) : (
                            <p className="text-[9px] text-white/20 font-serif italic text-center">
                                「深淵への鍵を入力し、回路を固定してください」
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Model Selection */}
                {geminiKey && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Resonance Model</span>
                            <Cpu size={12} className="text-[#f15a24]/40" />
                        </div>
                        <button 
                            onClick={() => setShowModelList(!showModelList)}
                            className="w-full flex items-center justify-between px-5 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] text-white/80 transition-all border border-white/10"
                        >
                            <span>{OPENROUTER_MODELS.find(m => m.id === preferredModel)?.name || 'Default Model'}</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${showModelList ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                            {showModelList && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1 mt-2">
                                    {OPENROUTER_MODELS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => { setPreferredModel(m.id); setShowModelList(false); }}
                                            className={`w-full text-left px-5 py-2.5 rounded-lg hover:bg-white/10 text-[10px] transition-colors ${preferredModel === m.id ? 'text-[#f15a24] bg-[#f15a24]/5' : 'text-white/30'}`}
                                        >
                                            {m.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Validation Feedback */}
            {isValidatingApi && (
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase animate-pulse">
                    <RefreshCw size={12} className="animate-spin" /> 回路の同期中...
                </div>
            )}
        </div>
    );
}
