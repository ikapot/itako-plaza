import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_CHARACTERS, INITIAL_LOCATIONS } from '../constants';
import { User, MapPin, Search, ZoomIn, Ghost, Sparkles, Navigation } from 'lucide-react';

const PeninsulaMap = ({ 
  selectedLocationId, 
  setSelectedLocationId, 
  characters = INITIAL_CHARACTERS,
  selectedCharIds = [],
  handleToggleChar,
  onGo,
  globalSentiment = 'neutral'
}) => {
  const [hoveredChar, setHoveredChar] = useState(null);
  const [activeFaceFilter, setActiveFaceFilter] = useState(null);

  // 1. Core 54 Characters (6 faces * 9 positions)
  const mapSouls = useMemo(() => {
    // Collect 54 primary souls (Face 0-5, Pos 0-8)
    const souls = [];
    for (let f = 0; f <= 5; f++) {
      for (let p = 0; p <= 8; p++) {
        const char = characters.find(c => c.face === f && c.pos === p);
        if (char) {
          // Calculate an organic position on the peninsula
          // f=0 (Center), f=1 (West/Industrial), f=2 (East/Traditional), 
          // f=3 (Deep West/Foreign), f=4 (North/Highlands), f=5 (South/Abyss)
          let centerX = 250;
          let centerY = 250;
          let spread = 80;

          switch(f) {
            case 0: // 文豪 (Center)
              centerX = 250; centerY = 200; spread = 60; break;
            case 1: // 闇 (Slum - Southwest)
              centerX = 150; centerY = 350; spread = 70; break;
            case 2: // 先駆者 (Traditional - East)
              centerX = 400; centerY = 280; spread = 60; break;
            case 3: // 西洋 (Industrial - West)
              centerX = 100; centerY = 220; spread = 70; break;
            case 4: // 芸術 (Mountain - North)
              centerX = 250; centerY = 80; spread = 80; break;
            case 5: // 異界 (Abyss - South)
              centerX = 250; centerY = 480; spread = 60; break;
          }

          // Deterministic jitter based on pos
          const angle = (p / 9) * Math.PI * 2;
          const dist = 30 + (Math.sin(p * 1.5) * 20);
          
          souls.push({
            ...char,
            mapX: centerX + Math.cos(angle) * dist,
            mapY: centerY + Math.sin(angle) * dist
          });
        }
      }
    }
    return souls;
  }, [characters]);

  const FACE_LABELS = [
    { name: '文豪列伝', color: '#f15a24' },
    { name: '闇の系譜', color: '#4b4b4b' },
    { name: '女性の先駆者', color: '#bd8a78' },
    { name: '西洋の魂', color: '#6366f1' },
    { name: '芸術家・詩人', color: '#EAE0D5' },
    { name: '異界の存在', color: '#fdb913' }
  ];

  const filteredSouls = activeFaceFilter !== null 
    ? mapSouls.filter(s => s.face === activeFaceFilter)
    : mapSouls;

  return (
    <div className="relative w-full h-[600px] flex flex-col bg-black/40 md:rounded-[40px] border border-white/5 overflow-hidden">
      
      {/* Map Header / Filters */}
      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setActiveFaceFilter(null)}
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeFaceFilter === null ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
          >
            All Souls
          </button>
          {FACE_LABELS.map((f, i) => (
            <button 
              key={i}
              onClick={() => setActiveFaceFilter(i)}
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${activeFaceFilter === i ? 'border-transparent text-black' : 'border-white/10 text-white/40'}`}
              style={{ backgroundColor: activeFaceFilter === i ? f.color : 'transparent' }}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-white/20 font-oswald uppercase tracking-[0.3em]">54 Registered Manifestations</div>
      </div>

      <div className="relative flex-1 cursor-crosshair">
        {/* SVG Peninsula Boundary */}
        <svg viewBox="0 0 500 550" className="absolute inset-0 w-full h-full p-8 overflow-visible">
            <defs>
                <filter id="mapGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="15" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Subliminal Grid */}
            <path d="M 0,100 L 500,100 M 0,200 L 500,200 M 0,300 L 500,300 M 0,400 L 500,400 M 100,0 L 100,550 M 200,0 L 200,550 M 300,0 L 300,550 M 400,0 L 400,550" 
                  fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.1" />

            {/* Peninsula Outline - More organic shape */}
            <motion.path 
              d="M250,20 C350,20 450,150 480,250 C510,350 450,530 250,530 C50,530 -20,350 20,250 C50,150 150,20 250,20 Z"
              fill="rgba(255,255,255,0.02)"
              stroke="white"
              strokeWidth="0.5"
              strokeDasharray="4 2"
              strokeOpacity="0.2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3 }}
            />

            {/* Regions Labels */}
            <g className="pointer-events-none opacity-60">
                <text x="250" y="50" textAnchor="middle" className="text-[10px] fill-white font-oswald tracking-[0.5em] uppercase">Highlands</text>
                <text x="250" y="520" textAnchor="middle" className="text-[10px] fill-white font-oswald tracking-[0.5em] uppercase">Abyssal Coast</text>
                <text x="50" y="300" textAnchor="middle" transform="rotate(-90, 50, 300)" className="text-[8px] fill-white font-oswald tracking-[0.5em] uppercase">Industrial West</text>
                <text x="450" y="300" textAnchor="middle" transform="rotate(90, 450, 300)" className="text-[8px] fill-white font-oswald tracking-[0.5em] uppercase">Traditional East</text>
            </g>

            {/* Connection Lines (Subtle) */}
            {mapSouls.map((s, i) => {
              if (i % 8 === 0) return null;
              const next = mapSouls[i-1];
              if (next.face !== s.face) return null;
              return (
                <line 
                  key={`l-${i}`} 
                  x1={s.mapX} y1={s.mapY} x2={next.mapX} y2={next.mapY} 
                  stroke="white" strokeWidth="0.2" strokeOpacity="0.05" 
                />
              );
            })}

            {/* Dots for the 54 souls */}
            {filteredSouls.map((s) => {
              const isSelected = selectedCharIds.includes(s.id);
              const isHovered = hoveredChar?.id === s.id;
              
              return (
                <g 
                  key={s.id} 
                  onMouseEnter={() => setHoveredChar(s)}
                  onMouseLeave={() => setHoveredChar(null)}
                  onClick={() => handleToggleChar(s.id)}
                  className="cursor-pointer group"
                >
                  <circle 
                    cx={s.mapX} cy={s.mapY} 
                    r={isSelected ? 5 : 3} 
                    fill={isSelected ? s.color.replace('bg-', '') : (isHovered ? 'white' : 'rgba(255,255,255,0.3)')}
                    className="transition-all duration-300"
                    style={{ 
                      filter: isSelected ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                      fill: isSelected ? FACE_LABELS[s.face].color : undefined
                    }}
                  />
                  {isSelected && (
                    <circle 
                      cx={s.mapX} cy={s.mapY} 
                      r={10} 
                      fill="none" 
                      stroke={FACE_LABELS[s.face].color} 
                      strokeWidth="0.5" 
                      strokeOpacity="0.5"
                      className="animate-ping"
                    />
                  )}
                  {isHovered && (
                    <text 
                      x={s.mapX} y={s.mapY - 12} 
                      textAnchor="middle" 
                      className="text-[9px] fill-white font-black tracking-widest uppercase pointer-events-none drop-shadow-lg"
                    >
                      {s.name}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>

        {/* Floating Detail Panel (When Hovered) */}
        <AnimatePresence>
          {hoveredChar && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-64 glass-spectral p-5 rounded-3xl border border-white/10 pointer-events-none"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-2 h-8 rounded-full`} style={{ backgroundColor: FACE_LABELS[hoveredChar.face].color }} />
                <div>
                  <div className="text-[12px] font-black text-white tracking-widest uppercase">{hoveredChar.name}</div>
                  <div className="text-[8px] text-white/30 uppercase tracking-[0.2em]">{hoveredChar.role}</div>
                </div>
              </div>
              <p className="text-[10px] text-white/60 leading-relaxed font-serif italic mb-4 line-clamp-3">
                {hoveredChar.flavor} — {hoveredChar.description.slice(0, 50)}...
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{FACE_LABELS[hoveredChar.face].name}</span>
                <span className="text-[8px] font-black text-white/40 flex items-center gap-1 group">
                  <Navigation size={8} /> CLICK TO SUMMON
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Action Button */}
        {selectedCharIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <button 
              onClick={onGo}
              className="px-10 py-3 bg-[#f15a24] text-white rounded-full font-black text-[10px] tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(241,90,36,0.6)] hover:scale-105 transition-all flex items-center gap-3"
            >
              <Navigation size={14} className="animate-pulse" />
              Manifestation Focus / 召喚に集中
            </button>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="text-[8px] text-white/30 uppercase tracking-[0.3em]">Potential Point</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f15a24]" />
          <span className="text-[8px] text-white/30 uppercase tracking-[0.3em]">Active Spirit</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={8} className="text-white/40" />
          <span className="text-[8px] text-white/30 uppercase tracking-[0.3em]">Synchro Point</span>
        </div>
      </div>
    </div>
  );
};

export default PeninsulaMap;
