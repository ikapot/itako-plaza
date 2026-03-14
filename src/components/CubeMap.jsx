import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MapPin } from 'lucide-react';

const CubeMap = ({ locations, selectedLocationId, onSelectLocation, locationEnergies }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Rotating states
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Spring for smooth rotation
  const springX = useSpring(x, { stiffness: 60, damping: 20 });
  const springY = useSpring(y, { stiffness: 60, damping: 20 });
  
  const rotateX = useTransform(springY, val => val * 0.5);
  const rotateY = useTransform(springX, val => val * 0.5);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    x.set(x.get() + e.movementX);
    y.set(y.get() - e.movementY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const faces = [
    { name: 'Front', rotate: 'rotateY(0deg) translateZ(100px)', faceIndex: 0 },
    { name: 'Back', rotate: 'rotateY(180deg) translateZ(100px)', faceIndex: 1 },
    { name: 'Right', rotate: 'rotateY(90deg) translateZ(100px)', faceIndex: 2 },
    { name: 'Left', rotate: 'rotateY(-90deg) translateZ(100px)', faceIndex: 3 },
    { name: 'Top', rotate: 'rotateX(90deg) translateZ(100px)', faceIndex: 4 },
    { name: 'Bottom', rotate: 'rotateX(-90deg) translateZ(100px)', faceIndex: 5 },
  ];

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto perspective-[1000px] mb-12">
      <div 
        className="absolute inset-x-0 bottom-[-40px] text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] pointer-events-none select-none"
      >
        Drag to Shift Dimensions
      </div>
      
      <motion.div
        className="w-full h-full relative preserve-3d cursor-grab active:cursor-grabbing"
        style={{ rotateX, rotateY }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {faces.map((face, fIdx) => (
          <div
            key={fIdx}
            className="absolute inset-0 bg-black/40 border border-white/10 backdrop-blur-md backface-hidden grid grid-cols-2 grid-rows-3 gap-1 p-1"
            style={{ transform: face.rotate }}
          >
            {locations.filter(l => l.face === face.faceIndex).map((loc, lIdx) => {
              const isSelected = selectedLocationId === loc.id;
              const energy = locationEnergies[loc.id] || 0;
              const intensity = Math.min(energy / 100, 1);
              
              return (
                <button
                  key={loc.id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!isDragging) onSelectLocation(loc.id); 
                  }}
                  className={`relative flex flex-col items-center justify-center p-1 rounded-sm border transition-all duration-500 overflow-hidden ${
                    isSelected ? 'bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-black/20 border-white/5 hover:bg-white/5'
                  }`}
                >
                   {/* Spiritual Glow */}
                   {energy > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, rgba(189, 138, 120, ${intensity * 0.4}) 0%, transparent 70%)`
                        }}
                      />
                    )}

                  <MapPin size={10} className={isSelected ? 'text-black' : 'text-white/20'} />
                  <span className={`text-[9px] font-black leading-none mt-1 tracking-tighter ${isSelected ? 'text-black' : 'text-white/40'}`}>
                    {loc.name}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default CubeMap;
