import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { INITIAL_CHARACTERS, INITIAL_LOCATIONS } from '../constants';
import { Train, Mountain, Building2, Factory, Landmark, Waves, Ghost, Zap } from 'lucide-react';

gsap.registerPlugin(MotionPathPlugin);

// --- Constants & Data ---
const REGIONS = [
  { id: 'peaks', name: '虚無山', icon: <Mountain size={14} />, x: 250, y: 50, color: '#94a3b8', theme: '芸術家・詩人' },
  { id: 'city', name: '中央都市', icon: <Building2 size={14} />, x: 250, y: 150, color: '#f15a24', theme: '文豪列伝' },
  { id: 'traditional', name: '東の隠里', icon: <Landmark size={14} />, x: 400, y: 200, color: '#bd8a78', theme: '女性先駆者' },
  { id: 'industrial', name: '西の工場', icon: <Factory size={14} />, x: 100, y: 200, color: '#4f46e5', theme: '西洋の魂' },
  { id: 'rivers', name: '運河・水脈', icon: <Waves size={14} />, x: 270, y: 250, color: '#06b6d4', theme: '水辺の場' },
  { id: 'downtown', name: '不夜城', icon: <Zap size={14} />, x: 250, y: 350, color: '#f59e0b', theme: '闇の系譜' },
  { id: 'abyss', name: '終焉の岸', icon: <Ghost size={14} />, x: 250, y: 450, color: '#6366f1', theme: '異界の存在' },
  { id: 'station', name: '亡霊駅', icon: <Train size={14} />, x: 180, y: 280, color: '#ffffff', theme: '移動' },
];

// Define a circuit path for the train
const TRAIN_PATH = "M250,50 L400,200 L250,350 L250,450 L100,200 L250,50"; 
// A more organic path would be better, but let's start with simple lines for the demo

const PeninsulaMap = ({ 
  locations = INITIAL_LOCATIONS, 
  selectedLocationId, 
  setSelectedLocationId, 
  characters = INITIAL_CHARACTERS,
  selectedCharIds = [],
  handleToggleChar,
  onGo,
  globalSentiment = 'neutral'
}) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const trainRef = useRef(null);
  const svgRef = useRef(null);

  // Animation for the Ghost Train
  useEffect(() => {
    if (!trainRef.current) return;

    const ctx = gsap.context(() => {
        // Path animation
        gsap.to(trainRef.current, {
          duration: 15, // A bit faster for a livelier feel
          repeat: -1,
          ease: "none",
          motionPath: {
            path: "#railway-path",
            autoRotate: true,
            align: "#railway-path",
            alignOrigin: [0.5, 0.5]
          }
        });
    });

    return () => ctx.revert();
  }, []);

  // Map locations or characters to regions (simplified for demo)
  const getCharInRegion = (regionId) => {
    // In a real app, we'd use metadata. For demo, we use a simple mapping.
    const themes = {
      peaks: 4,
      city: 0,
      traditional: 2,
      industrial: 3,
      rivers: 4, // water is often near art/nature
      downtown: 1, // dark lineage fits downtown
      abyss: 5
    };
    return characters.filter(c => c.face === themes[regionId]).slice(0, 3);
  };

  return (
    <div className="relative w-full min-h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden bg-black/40 md:rounded-[40px] border border-white/5 perspective-1000">
      
      {/* 3D Peninsula Stage */}
      <motion.div 
        initial={{ rotateX: 20, rotateZ: -5, y: 50, opacity: 0 }}
        animate={{ rotateX: 15, rotateZ: 0, y: 0, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="relative w-full max-w-[500px] aspect-[500/550] transform-style-3d shadow-2xl"
      >
        {/* SVG Decorative Path & Peninsula Boundary */}
        <svg viewBox="0 0 500 550" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="peninsulaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
            </defs>

            {/* Peninsula Shape */}
                <path 
                    d="M150,50 Q250,20 350,50 L450,200 Q500,350 250,550 Q0,350 50,200 Z" 
                    fill="url(#peninsulaGrad)" 
                    stroke="white" 
                    strokeWidth="1" 
                    strokeDasharray="4 4"
                    className="opacity-30"
                />

            {/* Railway Track */}
            <path 
                id="railway-path"
                d="M250,50 C350,100 450,150 400,200 C350,250 300,300 250,350 C250,400 250,420 250,450 C150,420 100,300 100,200 C150,150 200,100 250,50" 
                fill="none" 
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="1.5"
            />

            {/* Ghost Train Element (Managed by GSAP) */}
            <g ref={trainRef}>
                <circle r="3" fill="#f15a24" filter="url(#glow)" />
                <circle r="10" fill="rgba(241, 90, 36, 0.15)" filter="url(#glow)" />
                {/* Trail particles */}
                <circle cx="-10" r="1.5" fill="#f15a24" opacity="0.4" />
                <circle cx="-20" r="0.8" fill="#f15a24" opacity="0.2" />
            </g>
        </svg>

        {/* Region Nodes */}
        {REGIONS.map((region) => (
          <RegionNode 
            key={region.id} 
            region={region} 
            isHovered={hoveredRegion === region.id}
            onHover={() => setHoveredRegion(region.id)}
            onLeave={() => setHoveredRegion(null)}
            chars={getCharInRegion(region.id)}
            selectedCharIds={selectedCharIds}
            onToggleChar={handleToggleChar}
          />
        ))}

        {/* Abyss Fog (Bottom) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-gradient-to-t from-black to-transparent opacity-60 z-50 pointer-events-none" />
      </motion.div>

      {/* Info Overlay (Floating) */}
      <div className="absolute top-6 left-6 space-y-1 z-[100]">
        <h3 className="text-2xl font-black font-oswald text-white/90 tracking-widest uppercase">Itako Peninsula</h3>
        <p className="text-[11px] text-white/80 font-biz-mincho tracking-[0.3em]">54人の魂が彷徨う半島の全景</p>
      </div>

      <div className="absolute bottom-6 right-6 flex flex-col items-end z-[100]">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#f15a24] animate-pulse" />
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">亡霊列車：巡回中</span>
        </div>
        <button onClick={onGo} className="px-8 py-2.5 rounded-full bg-white text-black font-black font-oswald text-xs tracking-widest uppercase hover:bg-[#f15a24] hover:text-white transition-all shadow-2xl">
            Manifest Destination
        </button>
      </div>
    </div>
  );
};

// --- Subcomponent: RegionNode ---
const RegionNode = ({ region, isHovered, onHover, onLeave, chars, selectedCharIds, onToggleChar }) => {
    return (
        <div 
            className="absolute z-10"
            style={{ 
                left: region.x, 
                top: region.y, 
                transform: 'translate(-50%, -50%) translateZ(20px)',
                transformStyle: 'preserve-3d'
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
        >
            {/* The Core Dot */}
            <motion.div
                animate={{ 
                    scale: isHovered ? 1.5 : 1,
                    boxShadow: isHovered ? `0 0 30px ${region.color}` : `0 0 10px rgba(255,255,255,0.1)`
                }}
                className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center cursor-pointer bg-black/60 relative"
                style={{ borderColor: isHovered ? region.color : 'rgba(255,255,255,0.2)' }}
            >
                <div className="text-[8px]" style={{ color: region.color }}>
                    {region.icon}
                </div>
                
                {/* Spiritual Echo Rings */}
                {isHovered && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0.5, 0], scale: [1, 2.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border border-white/30"
                    />
                )}
            </motion.div>

            {/* Label */}
            <AnimatePresence>
                {(isHovered || true) && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: isHovered ? 1 : 0.85, y: 0 }}
                        className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-center pointer-events-none"
                    >
                        <div className="text-[11px] font-black font-biz-mincho text-white tracking-widest uppercase">{region.name}</div>
                        <div className="text-[8px] text-white/80 font-oswald tracking-[0.2em]">{region.theme}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Residents Popover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: -40 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-black/90 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-3xl min-w-[150px] z-[200]"
                    >
                        <div className="text-[8px] font-black text-white/70 uppercase tracking-[0.3em] mb-3 border-b border-white/10 pb-1">Resident Souls</div>
                        <div className="space-y-2">
                            {chars.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => onToggleChar(c.id)}
                                    className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5 transition-all
                                        ${selectedCharIds.includes(c.id) ? 'text-[#f15a24]' : 'text-white/60'}
                                    `}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedCharIds.includes(c.id) ? '#f15a24' : 'rgba(255,255,255,0.2)' }} />
                                    <span className="text-[9px] font-bold font-biz-mincho">{c.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-r border-b border-white/10 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PeninsulaMap;
