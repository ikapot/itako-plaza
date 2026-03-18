import React, { useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const currX = ((rotRef.current.x % 360) + 360) % 360;
  const currY = ((rotRef.current.y % 360) + 360) % 360;
  const normTX = ((target.x % 360) + 360) % 360;
  const normTY = ((target.y % 360) + 360) % 360;

  let deltaX = normTX - currX; if (deltaX < 0) deltaX += 360;
  let deltaY = normTY - currY; if (deltaY < 0) deltaY += 360;

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
  const base = "relative cursor-pointer group transition-all duration-500 flex flex-col items-center justify-center p-0.5 overflow-hidden rounded-full";
  if (isSelected) return `${base} border border-white/40 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110 z-20`;
  return `${base} border border-transparent hover:border-white/20`;
}

// ── CharTile ────────────────────────────────────────────────
const CharTile = React.memo(function CharTile({ char, isSelected, isRolling, onToggle }) {
  const isMain = !!char.isMainChar;
  const tileStyle = getCharTileStyle(isSelected, isMain);
  const [isHovered, setIsHovered] = useState(false);

  // Spectral state: Not selected AND not hovered
  const isSpectral = !isSelected && !isHovered;

  return (
    <div 
      onClick={function toggle() { if (!isRolling) onToggle(char.id); }} 
      onMouseEnter={function enter() { setIsHovered(true); }}
      onMouseLeave={function leave() { setIsHovered(false); }}
      className={tileStyle}
    >
      <AnimatePresence mode="wait">
        {isSpectral ? (
          <motion.div
            key="spectral"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
                boxShadow: [
                  '0 0 5px rgba(255,255,255,0.2)',
                  '0 0 15px rgba(255,255,255,0.5)',
                  '0 0 5px rgba(255,255,255,0.2)'
                ]
              }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
              className={`w-1.5 h-1.5 rounded-full ${isMain ? 'bg-[#f15a24]' : 'bg-white/40'}`}
              style={{ 
                boxShadow: isMain ? '0 0 10px rgba(241, 90, 36, 0.6)' : '0 0 5px rgba(255,255,255,0.3)'
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="manifested"
            initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            {char.avatar ? (
              <img src={char.avatar} alt={char.name} className="w-8 h-8 object-cover rounded-full opacity-90 mb-1 border border-white/20" loading="lazy" />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 border border-white/10 ${char.color || 'bg-zinc-800/80'} text-white font-hina`}>
                {char.name.slice(0, 1)}
              </div>
            )}
            <span className={`text-[8px] font-hina font-bold uppercase tracking-wider text-center leading-tight px-1 text-white`}>
              {char.name}
            </span>
            {isMain && <span className="text-[5px] mt-0.5 text-[#f15a24]">◆</span>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-md px-2 py-1.5 rounded-lg text-[9px] text-white opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none border border-white/15 z-[300] text-center translate-y-2 group-hover:translate-y-0 shadow-2xl">
        <div className="font-bold tracking-widest">{char.name}</div>
        <div className="text-white/40 text-[7.5px] uppercase">{char.flavor}</div>
        {isMain && <div className="text-[6px] mt-1 text-[#f15a24]/80 tracking-widest">INITIATED</div>}
      </div>
    </div>
  );
});

// ── LocTile ──────────────────────────────────────────────────
const LocTile = React.memo(function LocTile({ loc, isSelected, isRolling, energy, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  const isSpectral = !isSelected && !isHovered;

  const getLocStyle = function style() {
    const base = "relative cursor-pointer group transition-all duration-500 flex flex-col items-center justify-center p-0.5 overflow-hidden rounded-full";
    if (isSelected) return `${base} border border-white/50 bg-white/5 shadow-[0_0_25px_rgba(255,255,255,0.15)] scale-110 z-20`;
    return `${base} border border-transparent hover:border-white/20`;
  };

  return (
    <div 
      onClick={function select() { if (!isRolling) onSelect(loc.id); }} 
      onMouseEnter={function enter() { setIsHovered(true); }}
      onMouseLeave={function leave() { setIsHovered(false); }}
      className={getLocStyle()}
    >
      <AnimatePresence mode="wait">
        {isSpectral ? (
          <motion.div
            key="spectral"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 4 + Math.random() * 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white/30 rounded-full"
              style={{ 
                boxShadow: `0 0 ${10 + (energy/5)}px rgba(255,255,255,${0.2 + (energy/200)})` 
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="manifested"
            initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            className="flex flex-col items-center justify-center p-1 w-full h-full"
          >
            <span className={`text-[9px] font-hina font-bold uppercase tracking-widest text-center leading-tight text-white`}>
              {loc.name}
            </span>
            <div className={`mt-1.5 h-0.5 bg-white/40 rounded-full transition-all`} style={{ width: `${Math.min(100, energy)}%` }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-md px-2 py-1.5 rounded-lg text-[9px] text-white opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none border border-white/15 z-[300] max-w-[120px] text-center leading-tight shadow-2xl translate-y-2 group-hover:translate-y-0">
        <div className="font-bold mb-1">{loc.name}</div>
        <div className="text-[7.5px] text-white/50">{loc.description?.slice(0, 45)}...</div>
      </div>
    </div>
  );
});

// ── Noise Overlay Component ──────────────────────────────────
const NoiseOverlay = React.memo(function NoiseOverlay({ intensity = 0.05, glitch = false }) {
  return (
    <div 
        className={`absolute inset-0 pointer-events-none mix-blend-overlay ${glitch ? 'spiritual-glitch' : ''}`}
        style={{ 
            opacity: intensity,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px'
        }}
    />
  );
});

// ── Spiritual Connection Lines ────────────────────────────────
const SpiritualLines = React.memo(function SpiritualLines({ selectedChars, cubeSize = 240 }) {
  const half = cubeSize / 2;
  
  const get3DPos = function pos(char) {
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

  const points = useMemo(function calcPoints() { return selectedChars.map(get3DPos); }, [selectedChars]);
  const connections = useMemo(function calcConns() {
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
      {connections.map(function renderConn([p1, p2], i) {
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
});

// ── Cube component ───────────────────────────────────────────
const CubeFace = React.memo(function CubeFace({ fi, items, renderTile, energy, accentColor }) {
  return (
    <div
        className="absolute grid grid-cols-3 grid-rows-3 gap-0 overflow-hidden"
        style={{ 
          width: `${CUBE_SIZE}px`, 
          height: `${CUBE_SIZE}px`, 
          ...FACE_STYLES[fi], 
          transformStyle: 'preserve-3d',
          backgroundColor: 'rgba(2,2,2,0.6)',
          border: `0.5px solid ${accentColor}11`
        }}
    >
        {items.map(function renderSingle(item) { return renderTile(item); })}
        <NoiseOverlay intensity={0.03 + (energy / 300)} glitch={false} />
    </div>
  );
});

function Cube({ cubeRef, faceItems, renderTile, faceIdx, onJumpToFace, isRolling, faceLabels, accentColor, energy = 0, selectedChars = [] }) {
  return (
    <div className="relative h-[330px] flex items-center justify-center" style={{ perspective: '800px' }}>
      <div className="absolute top-1 right-0 flex flex-col gap-1 z-50 opacity-10 hover:opacity-100 transition-all duration-700">
        {faceLabels.map(function renderNav(label, idx) {
          return (
            <button
                key={label}
                onClick={function jump() { if (!isRolling) onJumpToFace(idx); }}
                disabled={isRolling}
                className={`px-1.5 py-0.5 rounded-sm border text-[6.5px] font-oswald tracking-widest uppercase transition-all
                ${faceIdx === idx ? `border-[${accentColor}]/50 bg-white/5 text-white` : 'border-white/5 bg-transparent text-white/20 hover:border-white/10 hover:text-white/40'}`}
            >
                {label.slice(0, 1)}
            </button>
          );
        })}
      </div>

      <div ref={cubeRef} className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        {faceItems.map(function renderFace(items, fi) {
          return <CubeFace key={fi} fi={fi} items={items} renderTile={renderTile} energy={energy} accentColor={accentColor} />;
        })}
        {accentColor === '#f15a24' && selectedChars.length > 1 ? <SpiritualLines selectedChars={selectedChars} /> : null}
      </div>
    </div>
  );
}

// ── Main ThreeDMap ───────────────────────────────
function ThreeDMap({
  locations,
  selectedLocationId,
  setSelectedLocationId,
  selectedCharIds,
  locationEnergies,
  characters,
  handleToggleChar,
  onSetChars,
  onGo,
  globalSentiment = 'neutral',
}) {
  const sentimentAccents = { neutral: '#f15a24', serene: '#00ffff', agitated: '#ff0000', melancholic: '#4f46e5', joyful: '#f59e0b', chaotic: '#d946ef' };
  const accentColor = sentimentAccents[globalSentiment] || '#f15a24';

  const charCubeRef = useRef(null);
  const locCubeRef  = useRef(null);
  const charRot     = useRef({ x: 0, y: 0 });
  const locRot      = useRef({ x: 0, y: 0 });

  const [charFaceIdx, setCharFaceIdx] = useState(0);
  const [locFaceIdx,  setLocFaceIdx]  = useState(0);
  const [isRolling,   setIsRolling]   = useState(false);
  const [rollCount,   setRollCount]   = useState(0);

  const allChars = useMemo(function getChars() { return characters || INITIAL_CHARACTERS; }, [characters]);
  const allLocs  = useMemo(function getLocs() { return locations  || INITIAL_LOCATIONS; }, [locations]);

  const charFaces = useMemo(function buildCharFaces() {
    const f = Array.from({ length: 6 }, function empty() { return []; });
    allChars.forEach(function mapChar(c) { if (c.face >= 0 && c.face < 6) f[c.face].push(c); });
    return f;
  }, [allChars]);

  const locFaces = useMemo(function buildLocFaces() {
    const f = Array.from({ length: 6 }, function empty() { return []; });
    allLocs.forEach(function mapLoc(l) { if (l.face >= 0 && l.face < 6) f[l.face].push(l); });
    return f;
  }, [allLocs]);

  const jumpCharFace = useCallback(function jumpChar(fi) { if (isRolling) return; setCharFaceIdx(fi); rollToFace(charCubeRef, charRot, fi, 1.2, null); }, [isRolling]);
  const jumpLocFace = useCallback(function jumpLoc(fi) { if (isRolling) return; setLocFaceIdx(fi); rollToFace(locCubeRef, locRot, fi, 1.2, null); }, [isRolling]);

  const handleRoll = useCallback(function roll() {
    if (isRolling) return;
    setIsRolling(true);

    const rCharFace = Math.floor(Math.random() * 6);
    const rLocFace  = Math.floor(Math.random() * 6);

    let charDone = false;
    let locDone  = false;

    const onBothDone = function done() {
      setCharFaceIdx(rCharFace);
      setLocFaceIdx(rLocFace);
      const faceChars = charFaces[rCharFace];
      const shuffled  = [...faceChars].sort(function rand() { return Math.random() - 0.5; });
      onSetChars?.(shuffled.slice(0, 3).map(function id(c) { return c.id; }));
      const faceLocs = locFaces[rLocFace];
      if (faceLocs.length > 0) {
        const rLoc = faceLocs[Math.floor(Math.random() * faceLocs.length)];
        setSelectedLocationId(rLoc.id);
      }
      setRollCount(function inc(n) { return n + 1; });
      setIsRolling(false);
    };

    rollToFace(charCubeRef, charRot, rCharFace, 2.8, function cDone() { charDone = true; if (locDone) onBothDone(); });
    rollToFace(locCubeRef,  locRot,  rLocFace,  2.4, function lDone() { locDone  = true; if (charDone) onBothDone(); });
  }, [isRolling, charFaces, locFaces, onSetChars, setSelectedLocationId]);

  const renderCharTile = useCallback(function render(char) {
    return <CharTile key={char.id} char={char} isSelected={selectedCharIds?.includes(char.id)} isRolling={isRolling} onToggle={handleToggleChar} />;
  }, [selectedCharIds, isRolling, handleToggleChar]);

  const renderLocTile = useCallback(function render(loc) {
    return <LocTile key={loc.id} loc={loc} isSelected={loc.id === selectedLocationId} isRolling={isRolling} energy={locationEnergies?.[loc.id] || 0} onSelect={setSelectedLocationId} />;
  }, [selectedLocationId, isRolling, locationEnergies, setSelectedLocationId]);

  const selectedChars = useMemo(function getSelected() { return (selectedCharIds || []).map(function find(id) { return allChars.find(function c(char) { return char.id === id; }); }).filter(Boolean); }, [selectedCharIds, allChars]);
  const selectedLoc = useMemo(function getSelectedLoc() { return allLocs.find(function find(l) { return l.id === selectedLocationId; }); }, [selectedLocationId, allLocs]);

  return (
    <div className="relative w-full select-none space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <p className="text-[9px] text-white/30 font-mono tracking-widest">🎲 × {rollCount > 0 ? `rolled ${rollCount}x` : 'press to summon'}</p>
          <p className="text-[7px] text-white/15 font-mono">{`${6 * 6} face-combos · ${charFaces[charFaceIdx]?.length || 0} souls visible`}</p>
        </div>

        <motion.button
          onClick={handleRoll}
          disabled={isRolling}
          whileTap={{ scale: 0.92 }}
          animate={isRolling ? { rotate: [0, 12, -12, 8, -8, 0], transition: { duration: 0.4, repeat: Infinity } } : {}}
          className={`relative px-7 py-2.5 rounded-full font-black font-oswald text-sm tracking-[0.2em] uppercase transition-all border-2 overflow-hidden ${isRolling ? 'border-white/15 text-white/25 cursor-not-allowed' : 'border-white text-white hover:bg-white hover:text-black cursor-pointer'}`}
          style={{ boxShadow: !isRolling ? `0 0 30px ${accentColor}44` : 'none', borderColor: !isRolling ? accentColor : 'rgba(255,255,255,0.15)' }}
        >
          {!isRolling ? <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }} className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" /> : null}
          <span className="relative z-10">{isRolling ? '⟳  ROLLING...' : '🎲  ROLL DICE'}</span>
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-3 items-center lg:items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[9px] md:text-[11px] font-oswald uppercase tracking-widest" style={{ color: `${accentColor}99` }}>👤 Character Dice</span>
            <span className="text-[8px] md:text-[10px] text-white/20 font-hina">{CHAR_THEME[charFaceIdx]}</span>
            <span className="text-[7px] text-[#f15a24]/30">{(selectedCharIds?.length || 0)}/3 selected</span>
          </div>
          <Cube cubeRef={charCubeRef} faceItems={charFaces} renderTile={renderCharTile} faceIdx={charFaceIdx} onJumpToFace={jumpCharFace} isRolling={isRolling} faceLabels={FACE_LABELS} accentColor={accentColor} energy={selectedCharIds.length * 15} selectedChars={selectedChars} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[9px] md:text-[11px] font-oswald uppercase tracking-widest text-white/50">📍 Location Dice</span>
            <span className="text-[8px] md:text-[10px] text-white/25 font-hina">{LOC_THEME[locFaceIdx]}</span>
          </div>
          <Cube cubeRef={locCubeRef} faceItems={locFaces} renderTile={renderLocTile} faceIdx={locFaceIdx} onJumpToFace={jumpLocFace} isRolling={isRolling} faceLabels={FACE_LABELS} accentColor="#ffffff" energy={locationEnergies[selectedLocationId] || 10} />
        </div>
      </div>

      <div className="mx-0.5 py-3 px-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[9px] md:text-[11px] text-white/30 uppercase tracking-widest font-hina shrink-0">召喚：</span>
          {selectedChars.length > 0 ? selectedChars.map(function render(c) {
              return (
                <span key={c.id} className={`text-[9px] md:text-[11px] px-2.5 py-1 rounded border transition-all font-bold font-hina ${c.isMainChar ? 'text-[#f15a24] bg-[#f15a24]/10 border-[#f15a24]/30' : 'text-white/80 bg-white/5 border-white/10'}`}>
                    {c.name}
                </span>
              );
          }) : <span className="text-[9px] md:text-[11px] text-white/15 italic font-hina">未選択（最大3人）</span>}
          {selectedLoc ? (
            <>
              <span className="text-[9px] md:text-[11px] text-white/20 mx-0.5">@</span>
              <span className="text-[9px] md:text-[11px] text-white bg-white/10 border border-white/30 px-2.5 py-1 rounded font-bold">{selectedLoc.name}</span>
            </>
          ) : null}
          
          <div className="flex-1" />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGo}
            disabled={isRolling || selectedCharIds.length === 0}
            className={`px-8 py-2 rounded-full font-bold font-hina text-[10px] tracking-[0.3em] uppercase transition-all shadow-lg border ${
              isRolling || selectedCharIds.length === 0
                ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed'
                : 'bg-[#f15a24] border-[#f15a24]/50 text-white hover:bg-[#ff6a3a] shadow-[0_0_20px_rgba(241,90,36,0.4)]'
            }`}
          >
            決定 / MANIFEST
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default ThreeDMap;
