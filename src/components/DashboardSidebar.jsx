import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Ghost, Globe, MapPin } from 'lucide-react';
import WarholAvatar from './WarholAvatar';

const DashboardSidebar = React.memo(({
    userName,
    setUserName,
    setShowSettings,
    characters,
    selectedCharIds,
    handleToggleChar,
    locations,
    selectedLocationId,
    setSelectedLocationId,
    locationEnergies,
}) => {
    return (
        <div className="hidden md:flex flex-col gap-4 z-[110] absolute top-1/2 -translate-y-1/2 left-0 pl-6 pointer-events-none items-start">
            {/* 1. Account & Gear */}
            <motion.div
                initial={{ width: 64, height: 64 }}
                whileHover={{ width: 360 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="pointer-events-auto flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden group/item shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
                <div className="flex items-center gap-4 p-2 w-[340px] h-[64px] box-border">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover/item:bg-white/10 transition-colors">
                        <User size={18} className="text-white/40 group-hover/item:text-white" />
                    </div>
                    <div className="flex-1 flex items-center justify-between opacity-0 group-hover/item:opacity-100 transition-all duration-300 pr-4">
                        <div className="flex flex-col">
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold tracking-tight text-white focus:ring-0 p-0 w-32"
                                placeholder="Account Name..."
                            />
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] font-oswald text-left">Participant ID</span>
                        </div>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-3 text-white/20 hover:text-white transform hover:rotate-90 transition-all duration-500 cursor-pointer"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* 2. Registry (Characters) */}
            <motion.div
                initial={{ width: 64, height: 64 }}
                whileHover={{ width: 360, height: 'auto' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="pointer-events-auto flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden group/item shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
                <div className="w-[360px]">
                    <div className="flex items-center gap-4 p-2 h-[64px] box-border">
                        <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center shrink-0">
                            <Ghost size={20} className="text-white/20 group-hover/item:text-[#98a436] transition-colors" />
                        </div>
                        <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap">Registry (Participants)</h3>
                    </div>

                    <div className="opacity-0 group-hover/item:opacity-100 transition-all duration-300 px-4 pb-4 space-y-2 h-0 group-hover/item:h-auto overflow-hidden">
                        {characters.map(c => {
                            const isSelected = selectedCharIds.includes(c.id);
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => handleToggleChar(c.id)}
                                    className={`w-[320px] flex items-center gap-4 p-2 rounded-2xl border transition-all duration-300 active:scale-95 ${isSelected ? 'bg-white/10 border-white/40 shadow-lg translate-x-1' : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 cursor-pointer'}`}
                                >
                                    <WarholAvatar src={c.avatar} size="w-8 h-8 md:w-10 h-10" isSelected={isSelected} colorClass={c.color} isPreStyled={c.isPreStyled} />
                                    <span className={`text-xs font-bold tracking-wide whitespace-nowrap transition-colors ${isSelected ? 'text-white' : 'text-white/40'}`}>{c.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* 3. Grid Map */}
            <motion.div
                initial={{ width: 64, height: 64 }}
                whileHover={{ width: 320, height: 'auto' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="pointer-events-auto flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden group/item shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
                <div className="w-[320px]">
                    <div className="flex items-center gap-4 p-2 h-[64px] box-border">
                        <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center shrink-0">
                            <Globe size={20} className="text-white/20 group-hover/item:text-[#fdb913] transition-colors" />
                        </div>
                        <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap">Grid Map</h3>
                    </div>

                    <div className="opacity-0 group-hover/item:opacity-100 transition-all duration-300 px-6 pb-6 h-0 group-hover/item:h-auto overflow-hidden w-[320px]">
                        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5 aspect-square max-w-[200px] ml-4">
                            {Array.from({ length: 9 }).map((_, i) => {
                                const loc = locations.find(l => l.pos === i);
                                const isSelected = selectedLocationId === loc?.id;
                                const energy = loc ? (locationEnergies[loc.id] || 0) : 0;
                                const intensity = Math.min(energy / 100, 1);

                                return (
                                    <button
                                        key={i}
                                        onClick={() => loc && setSelectedLocationId(loc.id)}
                                        className={`aspect-square flex flex-col items-center justify-center relative rounded transition-all duration-300 active:scale-95 overflow-hidden group/loc ${isSelected ? 'bg-zinc-200 cursor-default shadow-sm' : 'bg-black/40 hover:bg-white/10 cursor-pointer'}`}
                                    >
                                        {loc && energy > 0 && (
                                            <div
                                                className="absolute inset-0 pointer-events-none"
                                                style={{
                                                    background: `radial-gradient(circle, rgba(241, 90, 36, ${intensity * 0.4}) 0%, transparent 70%)`,
                                                }}
                                            />
                                        )}
                                        {loc && (
                                            <>
                                                <MapPin
                                                    size={isSelected ? 14 : 12}
                                                    className={`z-10 ${isSelected ? 'text-black' : 'text-white/20 group-hover/loc:text-white/60'}`}
                                                    style={!isSelected && energy > 0 ? { filter: `drop-shadow(0 0 ${intensity * 8}px #f15a24)` } : {}}
                                                />
                                                <span className={`absolute bottom-0.5 text-[6px] font-bold tracking-tighter uppercase z-10 transition-opacity duration-300 ${isSelected ? 'text-black/60' : 'text-white/20 opacity-0 group-hover/loc:opacity-100'}`}>
                                                    {loc.name}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 4. Connection Status */}
            <motion.div
                initial={{ width: 64, height: 64 }}
                whileHover={{ width: 280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="pointer-events-auto flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden group/item shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
                <div className="w-[280px] flex items-center gap-4 p-2 h-[64px] box-border">
                    <div className="w-12 h-12 rounded-full bg-transparent flex flex-col items-center justify-center shrink-0 group-hover/item:bg-white/5 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="flex flex-col opacity-0 group-hover/item:opacity-100 transition-all duration-300">
                        <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase mb-1 whitespace-nowrap">System Online</span>
                        <span className="text-[8px] text-white/40 tracking-[0.2em] uppercase font-oswald whitespace-nowrap">Secure Connection</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

DashboardSidebar.displayName = 'DashboardSidebar';
export default DashboardSidebar;
