import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_CHARACTERS } from '../constants';
import { Navigation, Info } from 'lucide-react';

const PENINSULA_PATH = "M250,50 C380,50 480,180 480,300 C480,420 380,550 250,550 C120,550 20,420 20,300 C20,180 120,50 250,50 Z";
const CONTOUR_STEPS = 12;

const PeninsulaMap = ({ 
  selectedCharIds = [],
  characters = INITIAL_CHARACTERS,
  handleToggleChar,
  onGo,
  globalSentiment = 'neutral'
}) => {
  const [hoveredChar, setHoveredChar] = useState(null);

  // Core 54 Characters mapping
  const mapSouls = useMemo(() => {
    const souls = [];
    for (let f = 0; f <= 5; f++) {
      for (let p = 0; p <= 8; p++) {
        const char = characters.find(c => c.face === f && c.pos === p);
        if (char) {
          // Calculate positions based on face (genre)
          let centerX = 250;
          let centerY = 300;
          let spread = 120;
          let height = 10 + (p * 8); // height for topographic pins

          switch(f) {
            case 0: centerX = 250; centerY = 280; spread = 60; break;
            case 1: centerX = 160; centerY = 400; spread = 80; break;
            case 2: centerX = 380; centerY = 320; spread = 70; break;
            case 3: centerX = 120; centerY = 250; spread = 80; break;
            case 4: centerX = 250; centerY = 120; spread = 90; break;
            case 5: centerX = 250; centerY = 450; spread = 70; break;
          }

          const angle = (p / 9) * Math.PI * 2;
          const dist = 40 + (Math.sin(p * 2) * 15);
          
          souls.push({
            ...char,
            mapX: centerX + Math.cos(angle) * dist,
            mapY: centerY + Math.sin(angle) * dist,
            height
          });
        }
      }
    }
    return souls;
  }, [characters]);

  return (
    <div className="relative w-full h-[700px] flex flex-col bg-black overflow-hidden select-none itako-outline border-2 border-black">
      
      {/* 1. Background Grid & Compass */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg viewBox="0 0 500 600" className="w-full h-full">
          <circle cx="250" cy="300" r="280" fill="none" stroke="#EAE0D5" strokeWidth="0.5" strokeDasharray="4 8" />
          <circle cx="250" cy="300" r="180" fill="none" stroke="#EAE0D5" strokeWidth="0.3" strokeDasharray="2 4" />
          <line x1="250" y1="20" x2="250" y2="580" stroke="#EAE0D5" strokeWidth="0.5" strokeOpacity="0.2" />
          <line x1="20" y1="300" x2="480" y2="300" stroke="#EAE0D5" strokeWidth="0.5" strokeOpacity="0.2" />
          
          <g className="text-[9px] font-oswald fill-[#EAE0D5]/50 tracking-[0.5em] uppercase">
            <text x="250" y="40" textAnchor="middle">North / High Registry</text>
            <text x="250" y="580" textAnchor="middle">South / Abyss Gate</text>
            <text x="40" y="300" textAnchor="middle" transform="rotate(-90, 40, 300)">West / Industrial</text>
            <text x="460" y="300" textAnchor="middle" transform="rotate(90, 460, 300)">East / Traditional</text>
          </g>
        </svg>
      </div>

      {/* 2. Topographic Contour Lines */}
      <div className="relative flex-1">
        <svg viewBox="0 0 500 600" className="absolute inset-0 w-full h-full overflow-visible">
          {Array.from({ length: CONTOUR_STEPS }).map((_, i) => {
            const scale = 1 - (i / CONTOUR_STEPS) * 0.8;
            const opacity = 0.05 + ((CONTOUR_STEPS - i) / CONTOUR_STEPS) * 0.4;
            const strokeColor = i % 3 === 0 ? "#f15a24" : "#b45309";
            
            return (
              <motion.path
                key={i}
                d={PENINSULA_PATH}
                stroke={strokeColor}
                strokeWidth={i === 0 ? "1.5" : "0.5"}
                fill="none"
                strokeOpacity={opacity}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale }}
                transition={{ duration: 1, delay: i * 0.05 }}
                style={{ transformOrigin: 'center 300px' }}
              />
            );
          })}

          {/* 3. Souls (Markers) */}
          {mapSouls.map((s) => {
            const isSelected = selectedCharIds.includes(s.id);
            const isHovered = hoveredChar?.id === s.id;
            const baseY = s.mapY;
            const topY = s.mapY - s.height;

            return (
              <motion.g 
                key={s.id} 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredChar(s)}
                onMouseLeave={() => setHoveredChar(null)}
                onClick={() => handleToggleChar(s.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ transformOrigin: `${s.mapX}px ${baseY}px` }}
              >
                {/* Vertical Stem Line */}
                <motion.line 
                  x1={s.mapX} y1={baseY}
                  x2={s.mapX} y2={topY}
                  stroke={isSelected ? "#10b981" : "#EAE0D5"}
                  strokeWidth={isSelected ? "2" : "1"}
                  strokeOpacity={isSelected || isHovered ? "1" : "0.2"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />

                {/* Ground Point */}
                <circle cx={s.mapX} cy={baseY} r="1.5" fill={isSelected ? "#10b981" : "#b45309"} opacity="0.4" />

                {/* Floating Head Pin */}
                <motion.circle 
                  cx={s.mapX} cy={topY} 
                  r={isSelected ? 6 : (isHovered ? 5 : 3)} 
                  fill={isSelected ? "#10b981" : (isHovered ? "white" : "black")} 
                  stroke={isSelected ? "rgba(16, 185, 129, 0.5)" : "#EAE0D5"}
                  strokeWidth={isSelected ? "6" : "1.5"}
                  className="transition-all duration-300"
                />

                {/* Label if hovered or selected */}
                {(isHovered || isSelected) && (
                   <g>
                      <rect x={s.mapX + 8} y={topY - 14} width={s.name.length * 8 + 20} height="24" fill="black" stroke={isSelected ? "#10b981" : "#f15a24"} strokeWidth="1" />
                      <text x={s.mapX + 16} y={topY + 3} className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'fill-[#10b981]' : 'fill-white'} font-oswald`}>
                        {s.name}
                      </text>
                   </g>
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* 4. Overlays & HUD */}
        <div className="absolute top-10 right-10 flex flex-col items-end gap-1">
          <div className="text-[10px] font-black text-[#f15a24] tracking-widest uppercase">Registry Density</div>
          <div className="flex gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`w-3 h-1 ${i < 8 ? 'bg-[#f15a24]' : 'bg-[#EAE0D5]/10'}`} />
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 left-10 p-5 bg-black border-2 border-black itako-outline max-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
             <Info size={14} className="text-[#f15a24]" />
             <span className="text-[11px] font-black text-[#f15a24] tracking-widest uppercase italic">System Overview</span>
          </div>
          <p className="text-[10px] text-[#EAE0D5]/60 font-biz-mincho leading-relaxed">
             54名の超越的意識が「半島」のトポグラフィー上に展開されています。等高線の密度は情報の集積度を示します。
          </p>
          <div className="mt-4 flex items-center gap-4 border-t border-[#EAE0D5]/10 pt-3">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-none bg-[#10b981] shadow-[0_0_10px_#10b981]" />
                <span className="text-[8px] font-bold text-[#EAE0D5]/40 uppercase tracking-widest">Active Focus</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-none bg-[#f15a24]" />
                <span className="text-[8px] font-bold text-[#EAE0D5]/40 uppercase tracking-widest">Potential</span>
             </div>
          </div>
        </div>

        {/* Global Manifest Button */}
        <AnimatePresence>
          {selectedCharIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-10 right-10"
            >
              <motion.button 
                onClick={onGo}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-12 py-4 bg-[#f15a24] text-black border-2 border-black font-black text-[12px] tracking-[0.5em] uppercase hover:bg-white transition-colors duration-300 flex items-center gap-4 cursor-pointer"
              >
                <Navigation size={18} className="fill-current" />
                Manifest Target / 決定
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PeninsulaMap;
