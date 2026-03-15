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

// ── CharTile ────────────────────────────────────────────────
const CharTile = React.memo(({ char, isSelected, isRolling, onToggle }) => {
  const isMain = !!char.isMainChar;
  return (
    <div
      onClick={() => !isRolling && onToggle(char.id)}
      className={`relative cursor-pointer group transition-all duration-300 flex flex-col items-center justify-center p-0.5 overflow-hidden rounded-sm
        ${isSelected
          ? 'border-2 border-white/90 bg-white/15 shadow-[0_0_15px_rgba(255,255,255,0.35)] scale-105 z-10'
          : isMain
            ? 'border border-[#f15a24]/40 hover:border-[#f15a24]/80 hover:bg-[#f15a24]/5'
            : 'border border-white/8 hover:border-white/25 hover:bg-white/5 opacity-40 hover:opacity-80'}`}
    >
      {/* Main char pulse */}
      {isMain && !isSelected && (
        <motion.div
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute inset-0 border border-[#f15a24]/25 rounded-sm pointer-events-none"
        />
      )}

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
      <span className={`text-[6px] font-oswald uppercase tracking-wide text-center leading-tight line-clamp-2
        ${isSelected ? 'text-white font-black' : isMain ? 'text-white/60 group-hover:text-white/90' : 'text-white/25 group-hover:text-white/60'}`}>
        {char.name}
      </span>

      {/* DATA dot */}
      {isMain && <span className="text-[4px] text-[#f15a24]/40 mt-0.5">◆</span>}

      {/* Tooltip */}
      <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm px-1.5 py-1 rounded text-[6px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-[300] text-center">
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
const LocTile = React.memo(({ loc, isSelected, isRolling, energy, onSelect }) => (
  <div
    onClick={() => !isRolling && onSelect(loc.id)}
    className={`relative cursor-pointer group border transition-all duration-300 flex flex-col items-center justify-center p-0.5 overflow-hidden
      ${isSelected
        ? 'border-white/80 bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105 z-10'
        : 'border-white/10 hover:border-white/40 hover:bg-white/5'}`}
  >
    {energy > 30 && (
      <motion.div
        animate={{ opacity: [0.05, 0.25, 0.05] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-[-4px] bg-white/5 blur-md rounded-full pointer-events-none"
      />
    )}
    <span className={`text-[7px] font-oswald uppercase tracking-wide text-center leading-tight
      ${isSelected ? 'text-white font-black' : 'text-white/40 group-hover:text-white/70'}`}>
      {loc.name}
    </span>
    {isSelected && (
      <motion.div layoutId="loc-glow" className="absolute inset-0 bg-white/10 blur-xl pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
    )}
    {/* Tooltip */}
    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm px-1.5 py-1 rounded text-[6px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-[300] max-w-[110px] text-center leading-tight">
      {loc.description?.slice(0, 40)}
    </div>
  </div>
));
LocTile.displayName = 'LocTile';

// ── Cube component ───────────────────────────────────────────
function Cube({ cubeRef, faceItems, renderTile, faceIdx, onJumpToFace, isRolling, faceLabels, accentColor }) {
  return (
    <div className="relative h-[330px] flex items-center justify-center" style={{ perspective: '800px' }}>
      {/* Face nav (right side, hover to reveal) */}
      <div className="absolute top-1 right-0 flex flex-col gap-1 z-50 opacity-20 hover:opacity-100 transition-opacity">
        {faceLabels.map((label, idx) => (
          <button
            key={label}
            onClick={() => !isRolling && onJumpToFace(idx)}
            disabled={isRolling}
            className={`px-1.5 py-0.5 rounded border text-[5px] font-oswald tracking-wider uppercase transition-all
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
            className="absolute grid grid-cols-3 grid-rows-3 gap-1"
            style={{ width: `${CUBE_SIZE}px`, height: `${CUBE_SIZE}px`, ...FACE_STYLES[fi], transformStyle: 'preserve-3d' }}
          >
            {items.map(item => renderTile(item))}
          </div>
        ))}
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
}) {
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
              : 'border-white text-white hover:bg-white hover:text-black cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.2)]'}`}
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
            <span className="text-[8px] font-oswald uppercase tracking-widest text-[#f15a24]/70">🎭 Soul Dice</span>
            <span className="text-[7px] text-white/25">{CHAR_THEME[charFaceIdx]}</span>
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
            accentColor="#f15a24"
          />
        </div>

        {/* Location Dice */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[8px] font-oswald uppercase tracking-widest text-white/50">📍 Location Dice</span>
            <span className="text-[7px] text-white/25">{LOC_THEME[locFaceIdx]}</span>
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
          />
        </div>
      </div>

      {/* ─── Selection Summary ───────────────────────── */}
      <div className="mx-0.5 py-2 px-3 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[7px] text-white/30 uppercase tracking-widest font-oswald shrink-0">召喚：</span>

          {selectedChars.length > 0
            ? selectedChars.map(c => (
              <span
                key={c.id}
                className={`text-[8px] px-2 py-0.5 rounded border transition-all
                  ${c.isMainChar
                    ? 'text-[#f15a24]/90 bg-[#f15a24]/10 border-[#f15a24]/25'
                    : 'text-white/60 bg-white/5 border-white/10'}`}
              >
                {c.name}
              </span>
            ))
            : <span className="text-[8px] text-white/15 italic">未選択（最大3人）</span>
          }

          {selectedLoc && (
            <>
              <span className="text-[8px] text-white/20 mx-0.5">@</span>
              <span className="text-[8px] text-white/70 bg-white/10 border border-white/20 px-2 py-0.5 rounded">
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
