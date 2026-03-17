import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, LogIn, Sparkles, ChevronRight } from 'lucide-react';
import Logo from './Logo';
import PortalGrimoire from './PortalGrimoire';
import { loginWithGoogle, loginAnonymously } from '../firebase';
import { validateGeminiApiKey } from '../gemini';

export default function LandingPage({ onLoginComplete, user, geminiKey, setGeminiKey, isValidatingApi, apiConnectionStatus, handleValidateApi }) {
    const [step, setStep] = useState('gate'); // 'gate', 'ritual'

    // Automatically transition to ritual if logged in but no key
    useEffect(() => {
        if (user && step === 'gate') {
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            const localKey = localStorage.getItem('itako_gemini_key');
            const keyToUse = envKey || localKey;

            if (keyToUse) {
                onLoginComplete(keyToUse);
            } else {
                setStep('ritual');
            }
        }
    }, [user, step, onLoginComplete]);

    const handleEnterGate = async () => {
        // Force login or proceed
        if (!user) {
            const u = await loginAnonymously();
            if (u) setStep('ritual');
        } else {
            setStep('ritual');
        }
    };

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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                        className="relative z-10 flex flex-col items-center max-w-2xl px-8 text-center"
                    >
                        {/* The Large Gate (Logo/Branding) */}
                        <motion.div 
                            animate={{ 
                                y: [0, -10, 0],
                                filter: ["drop-shadow(0 0 0px #f15a2400)", "drop-shadow(0 0 20px #f15a2433)", "drop-shadow(0 0 0px #f15a2400)"]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="mb-12"
                        >
                            <div className="scale-[3] md:scale-[5] mb-8">
                                <Logo />
                            </div>
                        </motion.div>

                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase font-oswald italic">
                                The Monolith Gate
                            </h1>
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-sm md:text-lg text-white/40 font-serif italic max-w-md leading-relaxed">
                                    「ここから先は『あわいの広場』。生者と死者の境界線。入るには、深淵を照らす『三つの鍵』が必要です。」
                                </p>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleEnterGate}
                                    className="group relative mt-8 px-12 py-5 bg-white text-black rounded-full font-black text-xs tracking-[0.5em] uppercase overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        門を開く <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <motion.div 
                                        className="absolute inset-0 bg-[#f15a24]"
                                        initial={{ x: "-100%" }}
                                        whileHover={{ x: 0 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </motion.button>
                            </div>
                        </div>

                        {/* Subtle Footer */}
                        <div className="mt-20 flex gap-12 text-[8px] font-bold text-white/10 tracking-[0.4em] uppercase">
                            <span>Established in 1923</span>
                            <span>Ethereal Protocol v1.2</span>
                            <span>Spiritual Echo System</span>
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
                                handleValidateApi={() => {
                                    handleValidateApi().then(() => {
                                        // The validation success is handled in App.jsx via isAppReady
                                        // But we can add local UI hints here if needed
                                    });
                                }}
                            />
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-[10px] text-white/20 font-serif max-w-xs mx-auto mb-6">
                                「鍵を三つ揃えることで、回路が安定し、冥界の霧が晴れます。鍵を探しに行きなさい。」
                            </p>
                            <button 
                                onClick={() => setStep('gate')}
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
