import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, LogIn, Sparkles, ChevronRight } from 'lucide-react';
import Logo from './Logo';
import PortalGrimoire from './PortalGrimoire';
import { loginWithGoogle, loginAnonymously } from '../firebase';
import { validateGeminiApiKey } from '../gemini';

export default function LandingPage({ 
    onLoginComplete, 
    user, 
    geminiKey, 
    setGeminiKey, 
    isValidatingApi, 
    apiConnectionStatus, 
    handleValidateApi 
}) {
    const [step, setStep] = useState('gate'); // 'gate', 'ritual'

    useEffect(function handleAutoTransition() {
        if (!user || step !== 'gate') return;

        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        const localKey = localStorage.getItem('itako_gemini_key');
        const keyToUse = envKey || localKey;

        if (keyToUse) {
            onLoginComplete(keyToUse);
        } else {
            setStep('ritual');
        }
    }, [user, step, onLoginComplete]);

    async function handleEnterGate() {
        if (!user) {
            const newUser = await loginAnonymously();
            if (newUser) setStep('ritual');
            return;
        }
        setStep('ritual');
    }

    return (
        <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(241,90,36,0.1)_0%,transparent_70%)]" />
                <div className="editorial-grid w-full h-full" />
            </div>

            <AnimatePresence mode="wait">
                {step === 'gate' && (
                    <motion.div
                        key="gate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                        className="relative z-10 flex flex-col items-center w-full h-full justify-center px-8"
                    >
                        {/* The Mysterious Door (Inspired by User Image) */}
                        <div className="relative group mb-12">
                            {/* Inner Glow (Light leaking from edges) */}
                            <motion.div 
                                animate={{ 
                                    boxShadow: [
                                        "0 0 20px rgba(255,255,255,0.1), inset 0 0 10px rgba(255,255,255,0.05)",
                                        "0 0 40px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)",
                                        "0 0 20px rgba(255,255,255,0.1), inset 0 0 10px rgba(255,255,255,0.05)"
                                    ]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-[200px] h-[350px] md:w-[260px] md:h-[450px] bg-black border border-white/20 relative rounded-sm overflow-hidden"
                            >
                                {/* Door Frame Light Leaks */}
                                <div className="absolute inset-0 border border-white/40 opacity-30 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                                
                                {/* Three Glowing Keyholes (Positioned to the left side) */}
                                <div className="absolute inset-0 flex flex-col items-start justify-center space-y-16 pl-12">
                                    {[0, 1, 2].map(function renderKeyhole(i) {
                                        return (
                                            <div key={i} className="relative">
                                                {/* The Keyhole Glow */}
                                                <motion.div 
                                                    animate={{ 
                                                        scale: [1, 1.5, 1],
                                                        opacity: [0.3, 0.8, 0.3],
                                                        boxShadow: ["0 0 5px #fff", "0 0 15px #fff", "0 0 5px #fff"]
                                                    }}
                                                    transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                                                    className="w-1.5 h-3 bg-white rounded-full blur-[1px]"
                                                />
                                                {/* Ray of light */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 rounded-full blur-xl pointer-events-none" />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Logo as a subtle emblem */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scale-50 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Logo />
                                </div>
                            </motion.div>

                            {/* Light Leak Lines (Horizontal/Vertical outside the door) */}
                            <div className="absolute -inset-4 border border-white/5 pointer-events-none" />
                        </div>

                        <div className="space-y-8 flex flex-col items-center">
                            <h1 className="text-2xl md:text-5xl font-black tracking-[0.8em] text-white uppercase font-oswald italic">
                                BARDO
                            </h1>
                            
                            <p className="text-xs md:text-sm text-white/40 font-serif italic max-w-xs leading-relaxed text-center">
                                「ここから先は『中有（バルド）』。生者と死者の境界線。入るには、深淵を照らす『三つの鍵』が必要です。」
                            </p>
                            
                            <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleEnterGate}
                                    className="px-10 py-4 bg-white text-black rounded-full font-black text-[10px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-colors"
                                >
                                    門を開く
                                </motion.button>
                                
                                <motion.a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.05 }}
                                    className="px-10 py-4 border border-white/20 text-white rounded-full font-black text-[10px] tracking-[0.3em] uppercase hover:bg-white/5 transition-colors flex items-center gap-2"
                                >
                                    鍵を取りに行く <Sparkles size={12} className="text-[#f15a24]" />
                                </motion.a>
                            </div>
                        </div>

                        {/* Subtle Footer */}
                        <div className="mt-16 flex gap-8 text-[7px] font-bold text-white/5 tracking-[0.4em] uppercase">
                            <span>Established in 1923</span>
                            <span>Ethereal Protocol</span>
                        </div>
                    </motion.div>
                )}

                {step === 'ritual' && (
                    <motion.div
                        key="ritual"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 w-full max-w-4xl"
                    >
                        <div className="text-center mb-8">
                            <span className="text-[10px] font-black text-[#f15a24] tracking-[0.4em] uppercase mb-4 block animate-pulse">
                                Ritual of Connection
                            </span>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter font-oswald uppercase">
                                鍵の奉納
                            </h2>
                        </div>

                        {/* Ritual UI Container */}
                        <div className="rounded-[50px] bg-white/[0.02] border border-white/5 backdrop-blur-3xl p-4 md:p-12 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-[#f15a24]/30 rounded-tl-[50px] m-8" />
                            <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-[#f15a24]/30 rounded-br-[50px] m-8" />
                            
                            <PortalGrimoire 
                                geminiKey={geminiKey}
                                setGeminiKey={setGeminiKey}
                                isValidatingApi={isValidatingApi}
                                apiConnectionStatus={apiConnectionStatus}
                                handleValidateApi={handleValidateApi}
                            />
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-[10px] text-white/20 font-serif max-w-xs mx-auto mb-6">
                                「鍵を三つ揃えることで、回路が安定し、冥界の霧が晴れます。鍵を探しに行きなさい。」
                            </p>
                            <button 
                                onClick={function returnToGate() { setStep('gate'); }}
                                className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em] hover:text-white transition-colors"
                            >
                                門の外へ戻る
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
