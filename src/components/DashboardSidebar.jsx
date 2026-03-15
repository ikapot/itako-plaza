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

            {/* Remaining sections removed to consolidate at the top via Header tabs */}

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
