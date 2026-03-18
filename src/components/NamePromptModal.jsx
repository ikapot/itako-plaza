import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarholAvatar from './WarholAvatar';

export default function NamePromptModal({ isOpen, onSubmit }) {
    const [name, setName] = useState('');
    const [step, setStep] = useState(0);

    // Enterキーで送信
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && name.trim()) {
            onSubmit(name.trim());
        }
    };

    // 自動で文字送りなどの演出を入れるためstep管理
    useEffect(() => {
        if (isOpen && step === 0) {
            const timer = setTimeout(() => setStep(1), 1500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, step]);

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md"
                >
                    {/* ノイズテクスチャ */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnPjxmaWx0ZXIgaWQ9J24nPjxmZVR1cmJ1bGVuY2UgdHlwZT0nZnJhY3RhbE5vaXNlJyBiYXNlRnJlcXVlbmN5PScwLjgnIG51bU9jdGF2ZXM9JzQnLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWx0ZXI9J3VybCgjbiknIG9wYWNpdHk9JzAuMDUnLz48L3N2Zz4=')]"/>
                    
                    <div className="max-w-md w-full mx-4 flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                            className="mb-8 relative"
                        >
                            {/* 案内人のシルエット */}
                            <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center overflow-hidden bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.1)] relative">
                                <span className="text-3xl text-white/50 font-biz-mincho absolute shrink-0">?</span>
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 1, delay: 1 }}
                            className="text-center w-full mb-10"
                        >
                            <p className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase font-oswald mb-4">
                                The Guide
                            </p>
                            <h2 className="text-[#EAE0D5] font-biz-mincho text-xl md:text-2xl leading-loose tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                「此岸より来たりし者よ。<br />
                                あなたの名は、何と呼ぼうか──」
                            </h2>
                        </motion.div>

                        <AnimatePresence>
                            {step >= 1 ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1 }}
                                    className="w-full flex justify-center mt-2 relative z-10"
                                >
                                    <input 
                                        autoFocus
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="入力してください（後から変更可能）"
                                        className="w-full max-w-sm bg-black/40 border-b-2 border-white/20 pb-2 text-center text-white focus:outline-none focus:border-[#bd8a78] font-biz-mincho text-lg tracking-widest transition-colors shadow-2xl placeholder:text-white/20 placeholder:text-xs placeholder:tracking-normal"
                                    />
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                            {step >= 1 && name.trim() ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="mt-12"
                                >
                                    <button 
                                        onClick={() => onSubmit(name.trim())}
                                        className="px-8 py-3 bg-white/5 border border-white/20 text-[#EAE0D5] hover:bg-white/10 hover:border-white/40 transition-all font-biz-mincho tracking-[0.3em] rounded-sm uppercase text-xs"
                                    >
                                        名乗る
                                    </button>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
