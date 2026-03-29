import React from 'react';
import { User, Menu, Settings, TrendingUp, MessageSquare, Ghost, Globe, Cpu, BookOpen, MapPin, Library } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const Header = React.memo(({
    userName,
    openDrawer,
    openSettings,
    activeSlot,
    onSlotClick,
    activeManagerTab,
    setActiveManagerTab,
    daysRemaining = 3650,
    globalSentiment = 'neutral',
    apiStatus = 'idle'
}) => {
    const navItems = [
        { id: 0, icon: <TrendingUp size={20} />, color: '#98a436', label: 'News' },
        { id: 1, icon: <MessageSquare size={20} />, color: '#fdb913', label: 'Dialog' },
        { id: 2, icon: <Ghost size={20} />, color: '#f15a24', label: 'Trends' },
    ];

    const modeTabs = [
        { id: 'library', icon: <Library size={14} />, label: 'LIBRARY', color: '#f15a24' },
        { id: 'directory', icon: <User size={14} />, label: 'Registry', color: '#EAE0D5' },
        { id: 'connect', icon: <Cpu size={14} />, label: 'Connect', color: apiStatus === 'connected' ? '#10b981' : '#f15a24' },
        { id: 'account', icon: <Settings size={14} />, label: 'Account', color: '#b45309' },
    ];

    return (
        <header className="pt-safe flex items-center justify-between px-2 md:px-6 border-b-2 border-black bg-black z-50 shrink-0 transition-all duration-300 h-12 md:h-16">
            <div className="h-full flex items-center gap-2 md:gap-6">
                <button
                    onClick={openDrawer}
                    className="p-2 -ml-1 text-white/40 hover:text-white transition-colors active:scale-90 md:hidden drop-shadow-md"
                >
                    <Menu size={24} strokeWidth={2.5} />
                </button>
                <div className="flex items-center gap-4">
                    <Logo apiStatus={apiStatus} onClick={() => onSlotClick(1)} />
                    {globalSentiment !== 'neutral' ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="hidden lg:flex px-3 py-1 rounded-full bg-white/5 border border-white/10 items-center gap-2"
                        >
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" 
                                 style={{ backgroundColor: globalSentiment === 'serene' ? '#00ffff' : 
                                                          globalSentiment === 'agitated' ? '#ff0000' :
                                                          globalSentiment === 'melancholic' ? '#4f46e5' :
                                                          globalSentiment === 'joyful' ? '#f59e0b' :
                                                          globalSentiment === 'chaotic' ? '#d946ef' : '#fff' }} />
                             <span className="text-[8px] font-black tracking-[0.2em] uppercase text-white/40 font-oswald">{globalSentiment}</span>
                        </motion.div>
                    ) : null}
                    {/* Silence Countdown */}
                    <div className="flex flex-col ml-1 pointer-events-none select-none">
                        <span className="text-[6px] md:text-[7px] font-bold text-white/10 tracking-[0.4em] uppercase leading-none mb-1">Silence</span>
                        <span className="text-[9px] md:text-[10px] font-black font-oswald text-[#f15a24]/60 tracking-tighter leading-none italic">T-{daysRemaining} DAYS</span>
                    </div>
                </div>
            </div>

            {/* NEW: Mode Tabs in Header Center - Optimized for Mobile (Hidden on small mobile) */}
            <div className="hidden sm:flex flex-1 justify-center px-2 overflow-hidden">
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5 max-w-full overflow-x-auto itako-scrollbar-none">
                    {modeTabs.map(tab => {
                        const isActive = activeManagerTab === tab.id;
                        return (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveManagerTab(tab.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    backgroundColor: isActive ? tab.color : 'transparent',
                                    color: isActive ? '#000' : 'rgba(255,255,255,0.7)',
                                    boxShadow: isActive ? `0 4px 15px ${tab.color}44` : 'none'
                                }}
                                className={`flex items-center gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] font-bold tracking-[0.1em] uppercase transition-colors duration-300 border ${isActive ? 'border-white/40' : 'border-transparent'} shrink-0 cursor-pointer`}
                            >
                                <span className={isActive ? 'scale-110' : 'scale-100'}>{tab.icon}</span>
                                <span className="hidden md:inline">{tab.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Silence Display on Mobile - Instead of Tabs */}
            <div className="flex flex-col sm:hidden items-center justify-center flex-1 px-1 opacity-40">
                 <span className="text-[6px] font-bold text-white tracking-[0.2em] uppercase leading-none">Plaza Syncing</span>
                 <span className="text-[8px] font-black text-[#f15a24] italic tracking-tighter">PROTOCOL_ACTIVE</span>
            </div>

            {/* Timeline Buttons moved to Header */}
            <div className="flex items-center gap-0 md:gap-2 h-full shrink-0">
                {navItems.map(item => (
                    <motion.button
                        key={item.id}
                        onClick={() => onSlotClick(item.id)}
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.9 }}
                        style={{ color: activeSlot === item.id ? item.color : 'rgba(255,255,255,0.2)' }}
                        className={`w-9 h-9 md:w-12 md:h-12 relative flex items-center justify-center rounded-full transition-colors duration-300 hover:text-white/60 touch-manipulation cursor-pointer`}
                        title={item.label}
                    >
                        {item.icon}
                        {activeSlot === item.id ? (
                            <motion.div layoutId="navIndicator" className="absolute bottom-1.5 md:bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current shadow-[0_0_8px_current]" />
                        ) : null}
                    </motion.button>
                ))}
            </div>
        </header>
    );
});

Header.displayName = 'Header';
export default Header;
