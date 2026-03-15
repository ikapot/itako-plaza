import React, { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { INITIAL_CHARACTERS } from '../constants';

/**
 * ThreeDMap Component
 * アトミズム的、かつ霊的な 3D 空間地図。
 * 54 か所の場所を 3D キューブの各面に配置し、ワイヤーフレームの箱で表現します。
 */
function ThreeDMap({ locations, selectedLocationId, setSelectedLocationId, selectedCharIds, locationEnergies }) {
  const containerRef = useRef(null);
  const cubeRef = useRef(null);

  // 3D 回転の制御（マウス追従）
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xRot = (clientY / window.innerHeight - 0.5) * 60;
      const yRot = (clientX / window.innerWidth - 0.5) * 60;
      
      gsap.to(cubeRef.current, {
        rotationX: -xRot,
        rotationY: yRot,
        duration: 1.5,
        ease: 'power2.out'
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const faces = useMemo(() => {
    const f = [[], [], [], [], [], []];
    locations.forEach(loc => {
      if (loc.face !== undefined && loc.face < 6) {
        f[loc.face].push(loc);
      }
    });
    return f;
  }, [locations]);

  // 各面の 3D 配置スタイル
  const faceStyles = [
    { transform: 'translateZ(150px)' },                // Front
    { transform: 'rotateY(180deg) translateZ(150px)' }, // Back
    { transform: 'rotateY(90deg) translateZ(150px)' },  // Right
    { transform: 'rotateY(-90deg) translateZ(150px)' }, // Left
    { transform: 'rotateX(90deg) translateZ(150px)' },  // Top
    { transform: 'rotateX(-90deg) translateZ(150px)' }  // Bottom
  ];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] flex items-center justify-center overflow-hidden perspective-1000 select-none"
      style={{ perspective: '1200px' }}
    >
      {/* 3D Cube Container */}
      <div 
        ref={cubeRef}
        className="relative w-full h-full flex items-center justify-center transform-style-3d py-20"
      >
        {faces.map((faceLocs, faceIdx) => (
          <div 
            key={faceIdx}
            className="absolute w-[300px] h-[300px] grid grid-cols-3 grid-rows-3 gap-2 transform-style-3d"
            style={faceStyles[faceIdx]}
          >
            {faceLocs.map((loc) => {
              const isActive = loc.id === selectedLocationId;
              const energy = locationEnergies?.[loc.id] || 0;
              const energyScale = 1 + (energy / 200); // エネルギーに応じてわずかに拡大
              
              return (
                <div
                  key={loc.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocationId(loc.id);
                  }}
                  className={`
                    relative pointer-events-auto cursor-pointer group
                    border transition-all duration-700 ease-out
                    flex flex-col items-center justify-center p-1
                    ${isActive 
                      ? 'border-white/80 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.4)] z-10 scale-110' 
                      : 'border-white/10 hover:border-white/40 hover:bg-white/5'}
                  `}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `scale(${energyScale})`,
                  }}
                >
                  {/* Energy Aura (for locations with high energy) */}
                  {energy > 30 && (
                    <motion.div 
                        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-x-[-10px] inset-y-[-10px] bg-white/5 blur-lg rounded-full pointer-events-none"
                    />
                  )}

                  {/* Wireframe box lines (Virtual box depth) */}
                  <div className={`absolute inset-0 border border-white/5 -translate-z-4 pointer-events-none transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                  
                  <span className={`
                    text-[8px] font-oswald uppercase tracking-widest text-center leading-tight transition-colors
                    ${isActive ? 'text-white font-bold' : 'text-white/40 group-hover:text-white/70'}
                  `}>
                    {loc.name}
                  </span>

                  {/* Energy Pulses (Visualizing the "flow" of conversation) */}
                  {energy > 10 && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <motion.div 
                            animate={{ y: ['-100%', '200%'], opacity: [0, 0.3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                            className="w-full h-[2px] bg-white/20 blur-[1px]"
                        />
                    </div>
                  )}
                  
                  {/* Glow effect for selection */}
                  {isActive && (
                    <motion.div 
                      layoutId="glow"
                      className="absolute inset-0 bg-white/10 blur-xl pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}

                  {/* Soul Wisps (Selected Characters) */}
                  {selectedCharIds.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none transform-style-3d">
                        {selectedCharIds.map((charId, idx) => {
                            const char = INITIAL_CHARACTERS.find(c => c.id === charId);
                            const IsAtHome = char?.homeLocationId === loc.id;
                            const IsCurrentlySelected = isActive;
                            
                            if (!IsAtHome && !IsCurrentlySelected) return null;

                            return (
                                <motion.div
                                    key={charId}
                                    animate={{
                                        y: [0, -15, 0],
                                        scale: IsCurrentlySelected ? [1, 1.5, 1] : [0.5, 0.8, 0.5],
                                        opacity: IsCurrentlySelected ? [0.6, 1, 0.6] : [0.2, 0.4, 0.2]
                                    }}
                                    transition={{
                                        duration: 3 + idx,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className={`absolute w-3 h-3 rounded-full blur-[2px] ${IsCurrentlySelected ? 'bg-white shadow-[0_0_15px_white]' : 'bg-white/30 shadow-[0_0_5px_white/20]'}`}
                                    style={{
                                        transform: `translateZ(25px) rotateY(${idx * 60}deg)`,
                                    }}
                                />
                            );
                        })}
                    </div>
                  )}
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[7px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-[100]">
                    {loc.description} {energy > 0 ? `| Intensity: ${Math.round(energy)}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial-at-center from-transparent via-black/20 to-black pointer-events-none" />
      
      {/* Selection Status Overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col items-start space-y-1 pointer-events-none">
        <div className="flex items-center space-x-2">
            <div className="w-1 h-1 bg-white animate-pulse" />
            <span className="text-[10px] font-oswald text-white/50 uppercase tracking-[0.2em]">Coordinates Locked</span>
        </div>
        <div className="text-[14px] font-serif italic text-white/80">
            {locations.find(l => l.id === selectedLocationId)?.name || 'Unknown'}
        </div>
      </div>
    </div>
  );
}

export default ThreeDMap;
