import React, { useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { INITIAL_CHARACTERS, INITIAL_LOCATIONS } from '../constants';

// ── Constants ────────────────────────────────────────────────
const FACE_LABELS   = ['FRONT', 'BACK', 'RIGHT', 'LEFT', 'TOP', 'BOTTOM'];
const CHAR_THEME    = ['文豪列伝', '闇の系譜', '女性先駆者', '西洋の魂', '芸術家・詩人', '異界の存在'];
const LOC_THEME     = ['日常の場', '暗の場', '聖なる場', '裏の場', '水辺の場', '終焉の場'];
const CUBE_SIZE     = 240; // px
const CUBE_HALF     = CUBE_SIZE / 2;

const FACE_ROTATIONS = [
  { x: 0,   y: 0   }, // Front
  { x: 0,   y: 180 }, // Back
  { x: 0,   y: -90 }, // Right
  { x: 0,   y: 90  }, // Left
  { x: -90, y: 0   }, // Top
  { x: 90,  y: 0   }, // Bottom
];

const FACE_STYLES = [
  { transform: `translateZ(${CUBE_HALF}px)` },
  { transform: `rotateY(180deg) translateZ(${CUBE_HALF}px)` },
  { transform: `rotateY(90deg)  translateZ(${CUBE_HALF}px)` },
  { transform: `rotateY(-90deg) translateZ(${CUBE_HALF}px)` },
  { transform: `rotateX(90deg)  translateZ(${CUBE_HALF}px)` },
  { transform: `rotateX(-90deg) translateZ(${CUBE_HALF}px)` },
];

// ── Dice-roll animation helper ───────────────────────────────
function rollToFace(cubeRef, rotRef, faceIdx, duration, onComplete) {
  const target = FACE_ROTATIONS[faceIdx];

  // Normalize current accumulated rotation → delta to target (always forward)
  const currX = ((rotRef.current.x % 360) + 360) % 360;
  const currY = ((rotRef.current.y % 360) + 360) % 360;
  const normTX = ((target.x % 360) + 360) % 360;
  const normTY = ((target.y % 360) + 360) % 360;

  let deltaX = normTX - currX; if (deltaX < 0) deltaX += 360;
  let deltaY = normTY - currY; if (deltaY < 0) deltaY += 360;

  // Add 3-4 extra full spins for satisfying dice effect
  const newX = rotRef.current.x + deltaX + 360 * 3;
  const newY = rotRef.current.y + deltaY + 360 * 4;
  rotRef.current = { x: newX, y: newY };

  gsap.to(cubeRef.current, {
    rotationX: newX,
    rotationY: newY,
    duration,
    ease: 'power4.out',
    onComplete,
  });
}

// ── Helper: Get Tile Styles ──
function getCharTileStyle(isSelected, isMain) {
  const base = "relative cursor-pointer group transition-all duration-300 flex flex-col items-center justify-center p-0.5 overflow-hidden rounded-sm";
  
  if (isSelected) {
    return `${base} border-2 border-white/90 bg-white/15 shadow-[0_0_15px_rgba(255,255,255,0.35)] scale-105 z-10`;
  }
  
  if (isMain) {
    return `${base} border border-[#f15a24]/40 hover:border-[#f15a24]/80 hover:bg-[#f15a24]/5`;
  }
  
  return `${base} border border-white/8 hover:border-white/25 hover:bg-white/5 opacity-40 hover:opacity-80`;
}

// ── CharTile ────────────────────────────────────────────────
const CharTile = React.memo(({ char, isSelected, isRolling, onToggle }) => {
  const isMain = !!char.isMainChar;
  const tileStyle = getCharTileStyle(isSelected, isMain);

  return (
    <div
      onClick={() => !isRolling && onToggle(char.id)}
      className={tileStyle}
    >
      {/* Main char pulse */}
      {isMain && !isSelected ? (
        <motion.div
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute inset-0 border border-[#f15a24]/25 rounded-sm pointer-events-none"
        />
      ) : null}

      {/* Avatar / initial */}
      {char.avatar ? (
        <img src={char.avatar} alt={char.name} className="w-7 h-7 object-cover rounded-sm opacity-80 mb-0.5" loading="lazy" />
      ) : (
        <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-[9px] font-black mb-0.5
          ${isMain ? 'text-[#f15a24]/80' : 'text-white/40'} ${char.color || 'bg-zinc-800/80'}`}>
          {char.name.slice(0, 1)}
        </div>
      )}

      {/* Name */}
      <span className={`text-[7.5px] md:text-[10px] font-oswald uppercase tracking-wide text-center leading-[1.1] line-clamp-2 px-0.5
        ${isSelected ? 'text-white font-black' : isMain ? 'text-white/60 group-hover:text-white/90' : 'text-white/25 group-hover:text-white/60'}`}>
        {char.name}
      </span>

      {/* DATA dot */}
      {isMain && <span className="text-[4px] mt-0.5" style={{ color: isSelected ? 'white' : '#f15a2499' }}>◆</span>}

      {/* Tooltip */}
      <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm px-1.5 py-1 rounded text-[7px] md:text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-[300] text-center">
        <div className="font-bold">{char.name}</div>
        <div className="text-white/50">{char.flavor}</div>
        <div className={`text-[5px] mt-0.5 ${isMain ? 'text-[#f15a24]/70' : 'text-white/30'}`}>
          {isMain ? '◆ NotebookLM済' : '準備中'}
        </div>
      </div>
    </div>
  );
});
CharTile.displayName = 'CharTile';

// ── LocTile ──────────────────────────────────────────────────
const LocTile = React.memo(({ loc, isSelected, isRolling, energy, onSelect }) => {
  const getLocStyle = () => {
    const base = "relative cursor-pointer group border transition-all duration-300 flex flex-col items-center justify-center p-0.5 overflow-hidden";
    if (isSelected) {
      return `${base} border-white/80 bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105 z-10`;
    }
    return `${base} border-white/10 hover:border-white/40 hover:bg-white/5`;
  };

  return (
    <div onClick={() => !isRolling && onSelect(loc.id)} className={getLocStyle()}>
      {energy > 30 ? (
        <motion.div
          animate={{ opacity: [0.05, 0.25, 0.05] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-[-4px] bg-white/5 blur-md rounded-full pointer-events-none"
        />
      ) : null}
      <span className={`text-[8px] md:text-[11px] font-oswald uppercase tracking-wide text-center leading-[1.1] px-0.5
        ${isSelected ? 'text-white font-black' : 'text-white/40 group-hover:text-white/70'}`}>
        {loc.name}
      </span>
      {isSelected ? (
        <motion.div layoutId="loc-glow" className="absolute inset-0 bg-white/10 blur-xl pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      ) : null}
      {/* Tooltip */}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm px-1.5 py-1 rounded text-[7px] md:text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-[300] max-w-[110px] text-center leading-tight">
        {loc.description?.slice(0, 40)}
      </div>
    </div>
  );
});
LocTile.displayName = 'LocTile';

// ── Noise Overlay Component ──────────────────────────────────
const NoiseOverlay = ({ intensity = 0.05, glitch = false }) => (
  <div 
    className={`absolute inset-0 pointer-events-none mix-blend-overlay ${glitch ? 'spiritual-glitch' : ''}`}
    style={{ 
      opacity: intensity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize: '150px 150px'
    }}
  />
);

// ── Spiritual Connection Lines ────────────────────────────────
const SpiritualLines = ({ selectedChars, cubeSize = 240 }) => {
  const half = cubeSize / 2;
  
  const get3DPos = (char) => {
    const r = Math.floor(char.pos / 3);
    const c = char.pos % 3;
    const x = (c - 1) * 80;
    const y = (r - 1) * 80;
    
    switch (char.face) {
      case 0: return { x, y, z: half };
      case 1: return { x: -x, y, z: -half };
      case 2: return { x: half, y, z: -x };
      case 3: return { x: -half, y, z: x };
      case 4: return { x, y: -half, z: -y };
      case 5: return { x, y: half, z: y };
      default: return { x: 0, y: 0, z: 0 };
    }
  };

  const points = useMemo(() => selectedChars.map(get3DPos), [selectedChars]);
  const connections = useMemo(() => {
    const conn = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        conn.push([points[i], points[j]]);
      }
    }
    return conn;
  }, [points]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
      {connections.map(([p1, p2], i) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 0.4, 0], scaleX: 1 }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
            className="absolute origin-left h-[1px]"
            style={{
              left: '50%',
              top: '50%',
              width: `${dist}px`,
              backgroundColor: 'rgba(241, 90, 36, 0.6)',
              boxShadow: '0 0 10px rgba(241, 90, 36, 0.8)',
              transformStyle: 'preserve-3d',
              transform: `
                translate3d(${p1.x}px, ${p1.y}px, ${p1.z}px)
                rotateY(${Math.atan2(dx, dz) * 180 / Math.PI}deg)
                rotateX(${Math.atan2(-dy, Math.sqrt(dx*dx + dz*dz)) * 180 / Math.PI}deg)
              `,
            }}
          />
        );
      })}
    </div>
  );
};

// ── Cube component ───────────────────────────────────────────
function Cube({ cubeRef, faceItems, renderTile, faceIdx, onJumpToFace, isRolling, faceLabels, accentColor, energy = 0, selectedChars = [] }) {
  return (
    <div className="relative h-[330px] flex items-center justify-center" style={{ perspective: '800px' }}>
      {/* Face nav (right side, hover to reveal) */}
      <div className="absolute top-1 right-0 flex flex-col gap-1 z-50 opacity-20 hover:opacity-100 transition-opacity">
        {faceLabels.map((label, idx) => (
          <button
            key={label}
            onClick={() => !isRolling && onJumpToFace(idx)}
            disabled={isRolling}
            className={`px-1.5 py-0.5 rounded border text-[7px] md:text-[9px] font-oswald tracking-wider uppercase transition-all
              ${faceIdx === idx
                ? `border-[${accentColor}]/60 bg-[${accentColor}]/20 text-white`
                : 'border-white/10 bg-transparent text-white/30 hover:border-white/30 hover:text-white/70'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3-D Cube */}
      <div
        ref={cubeRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {faceItems.map((items, fi) => (
          <div
            key={fi}
            className="absolute grid grid-cols-3 grid-rows-3 gap-1 overflow-hidden"
            style={{ 
              width: `${CUBE_SIZE}px`, 
              height: `${CUBE_SIZE}px`, 
              ...FACE_STYLES[fi], 
              transformStyle: 'preserve-3d',
              backgroundColor: 'rgba(5,5,5,0.8)',
              border: `1px solid ${accentColor}22`
            }}
          >
            {items.map(item => renderTile(item))}
            <NoiseOverlay intensity={0.05 + (energy / 200)} glitch={energy > 50} />
          </div>
        ))}
        {/* Connection lines for characters only */}
        {accentColor === '#f15a24' && selectedChars.length > 1 && (
          <SpiritualLines selectedChars={selectedChars} />
        )}
      </div>
    </div>
  );
}

// ── Main ThreeDMap (Dual Dice) ───────────────────────────────
function ThreeDMap({
  locations,
  selectedLocationId,
  setSelectedLocationId,
  selectedCharIds,
  locationEnergies,
  characters,
  handleToggleChar,
  onSetChars,
  globalSentiment = 'neutral',
}) {
  const sentimentAccents = {
    neutral: '#f15a24',
    serene: '#00ffff',
    agitated: '#ff0000',
    melancholic: '#4f46e5',
    joyful: '#f59e0b',
    chaotic: '#d946ef',
  };
  const accentColor = sentimentAccents[globalSentiment] || '#f15a24';

  const charCubeRef = useRef(null);
  const locCubeRef  = useRef(null);
  const charRot     = useRef({ x: 0, y: 0 });
  const locRot      = useRef({ x: 0, y: 0 });

  const [charFaceIdx, setCharFaceIdx] = useState(0);
  const [locFaceIdx,  setLocFaceIdx]  = useState(0);
  const [isRolling,   setIsRolling]   = useState(false);
  const [rollCount,   setRollCount]   = useState(0);

  const allChars = useMemo(() => characters || INITIAL_CHARACTERS, [characters]);
  const allLocs  = useMemo(() => locations  || INITIAL_LOCATIONS,  [locations]);

  // Build face arrays
  const charFaces = useMemo(() => {
    const f = Array.from({ length: 6 }, () => []);
    allChars.forEach(c => { if (c.face >= 0 && c.face < 6) f[c.face].push(c); });
    return f;
  }, [allChars]);

  const locFaces = useMemo(() => {
    const f = Array.from({ length: 6 }, () => []);
    allLocs.forEach(l => { if (l.face >= 0 && l.face < 6) f[l.face].push(l); });
    return f;
  }, [allLocs]);

  // Manual face navigation
  const jumpCharFace = useCallback((fi) => {
    if (isRolling) return;
    setCharFaceIdx(fi);
    rollToFace(charCubeRef, charRot, fi, 1.2, null);
  }, [isRolling]);

  const jumpLocFace = useCallback((fi) => {
    if (isRolling) return;
    setLocFaceIdx(fi);
    rollToFace(locCubeRef, locRot, fi, 1.2, null);
  }, [isRolling]);

  // 🎲 ROLL DICE
  const handleRoll = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);

    const rCharFace = Math.floor(Math.random() * 6);
    const rLocFace  = Math.floor(Math.random() * 6);

    let charDone = false;
    let locDone  = false;

    const onBothDone = () => {
      setCharFaceIdx(rCharFace);
      setLocFaceIdx(rLocFace);

      // Auto-select 3 random chars from landed face
      const faceChars = charFaces[rCharFace];
      const shuffled  = [...faceChars].sort(() => Math.random() - 0.5);
      onSetChars?.(shuffled.slice(0, 3).map(c => c.id));

      // Auto-select 1 random location from landed face
      const faceLocs = locFaces[rLocFace];
      if (faceLocs.length > 0) {
        const rLoc = faceLocs[Math.floor(Math.random() * faceLocs.length)];
        setSelectedLocationId(rLoc.id);
      }

      setRollCount(n => n + 1);
      setIsRolling(false);
    };

    rollToFace(charCubeRef, charRot, rCharFace, 2.8, () => { charDone = true; if (locDone) onBothDone(); });
    rollToFace(locCubeRef,  locRot,  rLocFace,  2.4, () => { locDone  = true; if (charDone) onBothDone(); });
  }, [isRolling, charFaces, locFaces, onSetChars, setSelectedLocationId]);

  // Tile renderers
  const renderCharTile = useCallback((char) => (
    <CharTile
      key={char.id}
      char={char}
      isSelected={selectedCharIds?.includes(char.id)}
      isRolling={isRolling}
      onToggle={handleToggleChar}
    />
  ), [selectedCharIds, isRolling, handleToggleChar]);

  const renderLocTile = useCallback((loc) => (
    <LocTile
      key={loc.id}
      loc={loc}
      isSelected={loc.id === selectedLocationId}
      isRolling={isRolling}
      energy={locationEnergies?.[loc.id] || 0}
      onSelect={setSelectedLocationId}
    />
  ), [selectedLocationId, isRolling, locationEnergies, setSelectedLocationId]);

  // Selection summary
  const selectedChars = useMemo(
    () => (selectedCharIds || []).map(id => allChars.find(c => c.id === id)).filter(Boolean),
    [selectedCharIds, allChars]
  );
  const selectedLoc = useMemo(
    () => allLocs.find(l => l.id === selectedLocationId),
    [selectedLocationId, allLocs]
  );

  return (
    <div className="relative w-full select-none space-y-3">

      {/* ─── Header row ─────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <p className="text-[9px] text-white/30 font-mono tracking-widest">
            🎲 × {rollCount > 0 ? `rolled ${rollCount}x` : 'press to summon'}
          </p>
          <p className="text-[7px] text-white/15 font-mono">
            {`${6 * 6} face-combos · ${charFaces[charFaceIdx]?.length || 0} souls visible`}
          </p>
        </div>

        {/* ROLL button */}
        <motion.button
          onClick={handleRoll}
          disabled={isRolling}
          whileTap={{ scale: 0.92 }}
          animate={isRolling
            ? { rotate: [0, 12, -12, 8, -8, 0], transition: { duration: 0.4, repeat: Infinity } }
            : {}}
          className={`relative px-7 py-2.5 rounded-full font-black font-oswald text-sm tracking-[0.2em] uppercase transition-all border-2 overflow-hidden
            ${isRolling
              ? 'border-white/15 text-white/25 cursor-not-allowed'
              : 'border-white text-white hover:bg-white hover:text-black cursor-pointer'}`}
          style={{ 
            boxShadow: !isRolling ? `0 0 30px ${accentColor}44` : 'none',
            borderColor: !isRolling ? accentColor : 'rgba(255,255,255,0.15)'
          }}
        >
          {/* Shimmer */}
          {!isRolling && (
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
          )}
          <span className="relative z-10">
            {isRolling ? '⟳  ROLLING...' : '🎲  ROLL DICE'}
          </span>
        </motion.button>
      </div>

      {/* ─── Dual Dice row ──────────────────────────── */}
      <div className="flex gap-3 items-start">

        {/* Soul (Character) Dice */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[9px] md:text-[11px] font-oswald uppercase tracking-widest" style={{ color: `${accentColor}99` }}>👤 Character Dice</span>
            <span className="text-[8px] md:text-[10px] text-white/20">{CHAR_THEME[charFaceIdx]}</span>
            <span className="text-[7px] text-[#f15a24]/30">
              {(selectedCharIds?.length || 0)}/3 selected
            </span>
          </div>
          <Cube
            cubeRef={charCubeRef}
            faceItems={charFaces}
            renderTile={renderCharTile}
            faceIdx={charFaceIdx}
            onJumpToFace={jumpCharFace}
            isRolling={isRolling}
            faceLabels={FACE_LABELS}
            accentColor={accentColor}
            energy={selectedCharIds.length * 15}
            selectedChars={selectedChars}
          />
        </div>

        {/* Location Dice */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[9px] md:text-[11px] font-oswald uppercase tracking-widest text-white/50">📍 Location Dice</span>
            <span className="text-[8px] md:text-[10px] text-white/25">{LOC_THEME[locFaceIdx]}</span>
          </div>
          <Cube
            cubeRef={locCubeRef}
            faceItems={locFaces}
            renderTile={renderLocTile}
            faceIdx={locFaceIdx}
            onJumpToFace={jumpLocFace}
            isRolling={isRolling}
            faceLabels={FACE_LABELS}
            accentColor="#ffffff"
            energy={locationEnergies[selectedLocationId] || 10}
          />
        </div>
      </div>

      {/* ─── Selection Summary ───────────────────────── */}
      <div className="mx-0.5 py-3 px-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[9px] md:text-[11px] text-white/30 uppercase tracking-widest font-oswald shrink-0">召喚：</span>

          {selectedChars.length > 0
            ? selectedChars.map(c => (
              <span
                key={c.id}
                className={`text-[9px] md:text-[11px] px-2.5 py-1 rounded border transition-all font-bold
                  ${c.isMainChar
                    ? 'text-[#f15a24] bg-[#f15a24]/10 border-[#f15a24]/30'
                    : 'text-white/80 bg-white/5 border-white/10'}`}
              >
                {c.name}
              </span>
            ))
            : <span className="text-[9px] md:text-[11px] text-white/15 italic">未選択（最大3人）</span>
          }

          {selectedLoc && (
            <>
              <span className="text-[9px] md:text-[11px] text-white/20 mx-0.5">@</span>
              <span className="text-[9px] md:text-[11px] text-white bg-white/10 border border-white/30 px-2.5 py-1 rounded font-bold">
                {selectedLoc.name}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThreeDMap;
