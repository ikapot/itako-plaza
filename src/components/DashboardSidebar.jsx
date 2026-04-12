import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Ghost, Globe, MapPin, BookOpen, RotateCw, LogOut } from 'lucide-react';
import WarholAvatar from './WarholAvatar';

const DashboardSidebar = React.memo(({
    userName,
    setUserName,
    setShowSettings,
    characters,
    selectedCharIds,
    handleToggleChar,
    setActiveManagerTab,
    manualRefreshSpiritWorld,
    isRefreshing,
    handleLogout
}) => {
    return (
        <div className="hidden md:flex flex-col gap-3 z-[110] absolute top-1/2 -translate-y-1/2 left-0 pl-6 pointer-events-none items-start">
            {/* 1. Account & Gear */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="pointer-events-auto flex flex-col glass-spectral rounded-3xl overflow-hidden group/item shadow-2xl border-white/5"
            >
                <div className="flex items-center gap-4 p-3 pr-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover/item:border-white/30 transition-all">
                        <User size={16} className="text-white/40 group-hover/item:text-white" />
                    </div>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="bg-transparent border-none text-xs font-black tracking-widest text-white/90 focus:ring-0 p-0 w-24 uppercase font-oswald"
                            placeholder="VOID..."
                        />
                        <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.4em] font-oswald text-left">Entity ID</span>
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-1.5 text-white/10 hover:text-[#bd8a78] transition-colors cursor-pointer"
                        title="Settings"
                    >
                        <Settings size={14} />
                    </button>
                    {handleLogout && (
                        <button
                            onClick={handleLogout}
                            className="p-1.5 text-white/10 hover:text-red-400 transition-colors cursor-pointer ml-1"
                            title="Logout"
                        >
                             <LogOut size={14} />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* 2. Ritual Pulse */}
            <div className="pointer-events-auto glass-spectral rounded-2xl p-3 flex flex-col gap-2 border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                    <span className="text-[8px] font-black text-white/70 tracking-[0.3em] uppercase font-oswald italic">Ritual Stability: 98%</span>
                </div>
                <div className="w-32 h-[1px] bg-white/5 relative overflow-hidden">
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                </div>
            </div>

            {/* 3. Soul Echo Frequency */}
            <div className="pointer-events-auto glass-spectral rounded-2xl p-3 flex flex-col gap-1 border-white/5">
                <span className="text-[7px] font-bold text-white/60 uppercase tracking-[0.5em] font-oswald text-left">Echo Frequency</span>
                <div className="flex items-end gap-0.5 h-4">
                    {[0.3, 0.7, 0.4, 0.8, 0.5, 0.9, 0.6].map((h, i) => (
                        <motion.div
                            key={i}
                            animate={{ height: [`${h * 100}%`, `${(1 - h) * 100}%`, `${h * 100}%`] }}
                            transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                            className="w-[3px] bg-white/10 rounded-full"
                        />
                    ))}
                </div>
            </div>



            {/* 5. Manual Refresh Button */}
            <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                disabled={isRefreshing}
                onClick={manualRefreshSpiritWorld}
                className="pointer-events-auto flex items-center gap-4 p-3 pr-6 glass-spectral rounded-3xl border border-white/5 hover:border-[#f15a24]/50 transition-all group/sync"
            >
                <div className={`w-10 h-10 rounded-xl ${isRefreshing ? 'bg-[#f15a24]/30' : 'bg-[#f15a24]/10'} flex items-center justify-center border border-white/5 group-hover/sync:bg-[#f15a24]/20 transition-all`}>
                    <RotateCw size={16} className={`text-[#f15a24] ${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-black tracking-widest text-[#f15a24] uppercase font-oswald">{isRefreshing ? 'Syncing...' : 'Ritual Sync'}</span>
                    <span className="text-[7px] font-bold text-white/70 uppercase tracking-[0.4em] font-oswald">霊界の刷新</span>
                </div>
            </motion.button>

            {/* 6. Trading Dashboard Button */}
            <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveManagerTab('trading')}
                className="pointer-events-auto flex items-center gap-4 p-3 pr-6 glass-spectral rounded-3xl border border-white/5 hover:border-[#325ba0]/50 transition-all group/trad"
            >
                <div className="w-10 h-10 rounded-xl bg-[#325ba0]/10 flex items-center justify-center border border-white/5 group-hover/trad:bg-[#325ba0]/20 transition-all">
                    <Activity size={16} className="text-[#325ba0]" />
                </div>
                <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-black tracking-widest text-[#325ba0] uppercase font-oswald">AUTOMATED TRADING</span>
                    <span className="text-[7px] font-bold text-white/70 uppercase tracking-[0.4em] font-oswald">楽天自動売買</span>
                </div>
            </motion.button>
        </div>
    );
});

DashboardSidebar.displayName = 'DashboardSidebar';
export default DashboardSidebar;
