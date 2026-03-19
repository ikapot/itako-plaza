import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Navigation, RotateCw } from 'lucide-react';
import WarholAvatar from './WarholAvatar';

const CARD_COUNT = 24; // Number of "ghost" cards falling

const FallingGhost = ({ delay, duration, x, scale, rotation }) => (
    <motion.div
        initial={{ y: -100, x: `${x}%`, opacity: 0, rotate: rotation, scale }}
        animate={{ 
            y: '110vh', 
            rotate: rotation + 45,
            opacity: [0, 0.15, 0.15, 0] 
        }}
        transition={{ 
            duration, 
            delay, 
            repeat: Infinity, 
            ease: "linear" 
        }}
        className="absolute w-12 h-16 md:w-16 md:h-24 bg-white/5 border border-white/5 rounded-lg pointer-events-none z-0"
    />
);

const ManifestedSoul = ({ char, loc, delay, isLocation }) => (
    <motion.div
        initial={{ y: -200, opacity: 0, scale: 0.5, rotateY: 180 }}
        animate={{ 
            y: 0, 
            opacity: 1, 
            scale: 1, 
            rotateY: 0,
            boxShadow: isLocation ? '0 0 30px rgba(255,255,255,0.2)' : '0 0 20px rgba(241,90,36,0.2)'
        }}
        transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            delay 
        }}
        className={`relative p-2 md:p-3 rounded-2xl border-2 itako-outline transition-all duration-700
                    ${isLocation 
                        ? 'bg-black/60 border-white/20 text-white w-28 md:w-36 h-40 md:h-48' 
                        : 'bg-black/80 border-[#f15a24]/30 text-[#f15a24] w-24 md:w-32 h-36 md:h-44'}`}
    >
        <div className="flex flex-col items-center justify-center h-full gap-2">
            {!isLocation ? (
                <>
                    <WarholAvatar src={char.avatar} colorClass={char.color} size="w-12 h-12 md:w-16 md:h-16" isSelected />
                    <span className="text-[9px] md:text-xs font-black tracking-widest text-center uppercase font-oswald leading-tight px-1">
                        {char.name}
                    </span>
                    <span className="text-[6px] md:text-[8px] opacity-40 uppercase tracking-tighter">{char.flavor}</span>
                </>
            ) : (
                <>
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                        <Navigation size={20} className="text-white/40" />
                    </div>
                    <span className="text-[10px] md:text-xs font-black tracking-widest text-center uppercase font-oswald text-white/90">
                        {loc.name}
                    </span>
                    <span className="text-[7px] md:text-[9px] opacity-40 italic text-white/60 text-center px-1">
                        {loc.description?.slice(0, 30)}...
                    </span>
                </>
            )}
        </div>
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-2xl animate-pulse -z-10 blur-xl opacity-20 ${isLocation ? 'bg-white' : 'bg-[#f15a24]'}`} />
    </motion.div>
);

const SoulRainManifest = ({
    characters,
    locations,
    selectedCharIds,
    selectedLocationId,
    onSetChars,
    onSetLocationId,
    onGo,
    accentColor = '#f15a24'
}) => {
    const [isSummoning, setIsSummoning] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [ghosts, setGhosts] = useState([]);

    // Initialize random ghosts only on mount
    useEffect(() => {
        const newGhosts = Array.from({ length: CARD_COUNT }).map((_, i) => ({
            id: i,
            delay: Math.random() * 5,
            duration: 3 + Math.random() * 4,
            x: Math.random() * 100,
            scale: 0.5 + Math.random() * 0.8,
            rotation: Math.random() * 360
        }));
        setGhosts(newGhosts);
    }, []);

    const handleSummon = useCallback(() => {
        if (isSummoning) return;
        
        setIsSummoning(true);
        setShowResult(false);

        // 1. Pick results logic
        const randomChars = [...characters]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        const randomLoc = locations[Math.floor(Math.random() * locations.length)];

        // 2. Clear current view immediately
        onSetChars([]);
        
        // 3. Animation Timing
        setTimeout(() => {
            onSetChars(randomChars.map(c => c.id));
            onSetLocationId(randomLoc.id);
            setShowResult(true);
            setIsSummoning(false);
        }, 3000);
    }, [characters, locations, isSummoning, onSetChars, onSetLocationId]);

    const resultChars = useMemo(() => 
        selectedCharIds.map(id => characters.find(c => c.id === id)).filter(Boolean),
    [selectedCharIds, characters]);

    const resultLoc = useMemo(() => 
        locations.find(l => l.id === selectedLocationId),
    [selectedLocationId, locations]);

    return (
        <div className="relative w-full min-h-[500px] flex flex-col bg-black/40 rounded-[40px] border border-white/5 overflow-hidden p-6 md:p-10 select-none">
            {/* Background Soul Rain */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {ghosts.map(g => (
                    <FallingGhost key={g.id} {...g} />
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
            </div>

            {/* HUD / Controls */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8">
                <AnimatePresence mode="wait">
                    {!showResult ? (
                        <motion.div 
                            key="summon-btn"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                            className="flex flex-col items-center gap-6"
                        >
                            <div className="text-center space-y-2">
                                <h3 className="text-sm font-black text-white/40 tracking-[0.4em] uppercase font-oswald">Portal Entrance</h3>
                                <p className="text-[10px] text-white/20 font-serif italic max-w-[200px]">「深淵に手を伸ばし、縁ある者を呼び寄せなさい。」</p>
                            </div>
                            
                            <motion.button
                                onClick={handleSummon}
                                disabled={isSummoning}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`group relative w-24 h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-700 border-2
                                            ${isSummoning 
                                                ? 'bg-white/5 border-white/20 scale-90' 
                                                : 'bg-black border-[#f15a24]/50 shadow-[0_0_40px_rgba(241,90,36,0.3)] hover:border-[#f15a24] hover:shadow-[0_0_60px_rgba(241,90,36,0.6)]'}`}
                            >
                                <AnimatePresence>
                                    {isSummoning ? (
                                        <motion.div 
                                            key="loader"
                                            animate={{ rotate: 360 }} 
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="text-[#f15a24]/90"
                                        >
                                            <RotateCw size={32} />
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="icon" 
                                            initial={{ scale: 0 }} 
                                            animate={{ scale: 1 }}
                                            className="flex flex-col items-center gap-2"
                                        >
                                            <Sparkles size={32} className="text-[#f15a24]" />
                                            <span className="text-[8px] font-black text-white tracking-[0.3em] font-oswald uppercase group-hover:tracking-[0.5em] transition-all">Summon</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div className="absolute inset-[-8px] rounded-full border border-white/5 animate-[pulse_4s_infinite]" />
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="result"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex flex-col items-center gap-12"
                        >
                            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                                {resultChars.map((char, i) => (
                                    <ManifestedSoul key={char.id} char={char} delay={i * 0.2} />
                                ))}
                                <div className="w-px h-16 bg-white/10 mx-2 hidden md:block" />
                                {resultLoc && <ManifestedSoul loc={resultLoc} isLocation delay={0.6} />}
                            </div>

                            <div className="flex flex-col items-center gap-6">
                                <div className="flex flex-col items-center text-center">
                                    <span className="text-[10px] font-black text-[#f15a24] tracking-[0.5em] uppercase mb-1">Ritual Complete</span>
                                    <h4 className="text-xl font-black text-white font-oswald tracking-widest uppercase">The Spirits Have Gathered</h4>
                                </div>
                                
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleSummon}
                                        className="mobile-touch-target px-8 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 tracking-widest uppercase hover:bg-white/10 transition-all font-oswald"
                                    >
                                        Re-Summon
                                    </button>
                                    <button 
                                        onClick={onGo}
                                        className="mobile-touch-target px-12 bg-[#f15a24] text-black rounded-full text-[12px] font-black tracking-[0.3em] uppercase hover:bg-white transition-all shadow-xl shadow-[#f15a24]/30"
                                    >
                                        Manifest / 決定
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Spectral Nodes Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="spectral-node absolute top-1/4 left-1/4 animate-pulse bg-white/20" />
                <div className="spectral-node absolute top-3/4 left-2/3 animate-pulse bg-[#f15a24]/20" />
                <div className="spectral-node absolute top-1/2 right-1/4 animate-pulse bg-white/20" />
            </div>
        </div>
    );
};

SoulRainManifest.displayName = 'SoulRainManifest';
export default SoulRainManifest;
