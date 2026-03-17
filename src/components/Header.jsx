import { User, Menu, Settings, TrendingUp, MessageSquare, Ghost, Globe, Cpu, BookOpen } from 'lucide-react';
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
    globalSentiment = 'neutral',
    apiStatus = 'idle'
}) => {
    const navItems = [
        { id: 0, icon: <TrendingUp size={20} />, color: '#98a436', label: 'News' },
        { id: 1, icon: <MessageSquare size={20} />, color: '#fdb913', label: 'Dialog' },
        { id: 2, icon: <Ghost size={20} />, color: '#f15a24', label: 'Trends' },
    ];

    const modeTabs = [
        { id: 'map', icon: <Globe size={14} />, label: 'RANDAMNI', color: '#fdb913' },
        { id: 'directory', icon: <User size={14} />, label: 'Registry', color: '#98a436' },
        { id: 'connect', icon: <Cpu size={14} />, label: 'Connect', color: '#f15a24' },
        { id: 'grimoire', icon: <BookOpen size={14} />, label: 'Manual', color: '#bd8a78' },
        { id: 'account', icon: <Settings size={14} />, label: 'Account', color: '#bd8a78' },
    ];

    return (
        <header className="pt-safe flex items-center justify-between px-6 border-b border-white/10 bg-[#050505]/85 backdrop-blur-3xl z-50 shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
            <div className="h-16 flex items-center gap-6">
                <button
                    onClick={openDrawer}
                    className="p-2 -ml-2 text-white/40 hover:text-white transition-colors active:scale-90 md:hidden drop-shadow-md"
                >
                    <Menu size={26} strokeWidth={2.5} />
                </button>
                <div className="hidden lg:flex items-center gap-4">
                    <Logo apiStatus={apiStatus} />
                    {globalSentiment !== 'neutral' ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2"
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
                </div>
            </div>

            {/* NEW: Mode Tabs in Header Center */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5 scale-90 sm:scale-100">
                {modeTabs.map(tab => {
                    const isActive = activeManagerTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveManagerTab(tab.id)}
                            style={{
                                backgroundColor: isActive ? tab.color : 'transparent',
                                color: isActive ? '#000' : 'rgba(255,255,255,0.3)',
                                boxShadow: isActive ? `0 4px 15px ${tab.color}44` : 'none'
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-bold tracking-[0.1em] uppercase transition-all duration-300 active:scale-95 border ${isActive ? 'border-white/20' : 'border-transparent'}`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Timeline Buttons moved to Header */}
            <div className="flex items-center gap-1 sm:gap-4 h-16">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onSlotClick(item.id)}
                        style={{ color: activeSlot === item.id ? item.color : 'rgba(255,255,255,0.2)' }}
                        className={`w-12 h-12 relative flex items-center justify-center rounded-full transition-all duration-300 hover:text-white/60 hover:bg-white/5 active:scale-90 touch-manipulation`}
                        title={item.label}
                    >
                        {item.icon}
                        {activeSlot === item.id ? (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current shadow-[0_0_8px_current]" />
                        ) : null}
                    </button>
                ))}
            </div>
        </header>
    );
});

Header.displayName = 'Header';
export default Header;
