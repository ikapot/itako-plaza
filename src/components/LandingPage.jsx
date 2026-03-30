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

        const localKey = localStorage.getItem('itako_gemini_key');
        
        // If user is already logged in and has a saved key, use it.
        if (localKey) {
            onLoginComplete(localKey);
            return;
        }

        // If user is logged in but no key, and they just want to enter (gate already open),
        // we might auto-proceed to ritual or handled by handleEnterGate
    }, [user, step, onLoginComplete]);

    async function handleGoogleLogin() {
        const newUser = await loginWithGoogle();
        if (newUser) {
            // After Google Login, we directly authorize entry via Proxy
            onLoginComplete('PROXY_MODE');
        }
    }

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
                {step === 'gate' ? (
                    <motion.div
                        key="gate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                        className="relative z-10 flex flex-col items-center w-full h-full justify-center px-4"
                    >
                        {/* The Minimalism Poster Gate */}
                        <div className="relative group mb-8">
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="relative w-[280px] h-[400px] md:w-[450px] md:h-[640px] bg-white p-2 md:p-4 shadow-[0_50px_100px_rgba(0,0,0,0.9)] flex flex-col"
                            >
                                {/* The Grid */}
                                <div className="flex-1 grid grid-cols-4 grid-rows-5 gap-1 md:gap-2">
                                    {Array.from({ length: 20 }).map((_, i) => {
                                        // Indices that appear "open" or "tilted" in the reference image
                                        const isOpen = [2, 5, 9, 14].includes(i);
                                        return (
                                            <div key={i} className="relative w-full h-full perspective-1000">
                                                <motion.div
                                                    initial={{ rotateY: isOpen ? -60 : 0, x: isOpen ? 5 : 0 }}
                                                    whileHover={{ rotateY: -25, x: 2, transition: { duration: 0.4 } }}
                                                    className="w-full h-full bg-black origin-left shadow-lg"
                                                    style={{ transformStyle: 'preserve-3d' }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Poster Typography */}
                                <div className="mt-4 md:mt-8 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <h1 className="text-xl md:text-3xl font-black tracking-[-0.05em] text-black leading-none uppercase font-oswald">
                                            ITAKO PLAZA
                                        </h1>
                                        <span className="text-[6px] md:text-[8px] font-bold text-black/40 uppercase tracking-[0.4em] mt-1 ml-0.5">
                                            Ethereal Protocol v1.2
                                        </span>
                                    </div>
                                    <div className="text-[6px] md:text-[8px] font-bold text-black uppercase tracking-tight text-right leading-tight max-w-[120px] md:max-w-[180px]">
                                        A Digital Archive Reimagining the Boundary <br/> 
                                        Between the Living and the Dead. <br/>
                                        <span className="text-black/30">Established in 1923 / Antigravity</span>
                                    </div>
                                </div>

                                {/* Interactive Overlay */}
                                <div 
                                    onClick={handleEnterGate}
                                    className="absolute inset-0 cursor-pointer z-20 group/canvas"
                                >
                                    <div className="absolute inset-0 bg-white/0 group-hover/canvas:bg-black/5 transition-colors" />
                                    <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
                                        <motion.div 
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="px-6 py-2 bg-black text-white text-[10px] font-bold tracking-[0.4em] uppercase"
                                        >
                                            Enter the Void
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                            
                            {/* Outer Decorative Element */}
                            <div className="absolute -inset-8 border border-white/5 pointer-events-none" />
                        </div>

                        {/* Subtle Navigation or Action Link */}
                        <div className="mt-6 md:mt-8 flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full max-w-[280px] md:max-w-none">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGoogleLogin}
                                className="w-full md:w-auto px-6 md:px-10 py-3.5 md:py-4 bg-white text-black font-black text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] uppercase shadow-2xl hover:bg-[#f15a24] hover:text-white transition-all flex flex-col items-center justify-center gap-1"
                            >
                                <div className="flex items-center gap-3">
                                    <LogIn size={14} /> Google Login / 直接入室
                                </div>
                                <span className="text-[6px] opacity-40 lowercase tracking-widest">Administrator Conduit Enabled</span>
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setStep('ritual')}
                                className="w-full md:w-auto text-[8px] md:text-[10px] text-white/40 font-black tracking-[0.4em] md:tracking-[0.5em] uppercase border-b border-white/10 pb-1 hover:text-white/80 transition-all text-center"
                            >
                                API KEY 奉納 / Private Key Access
                            </motion.button>
                        </div>
                    </motion.div>
                ) : step === 'ritual' ? (
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
                ) : null}
            </AnimatePresence>
        </div>
    );
}
