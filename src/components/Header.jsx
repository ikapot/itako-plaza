import { User, Menu, Settings, TrendingUp, MessageSquare, Ghost } from 'lucide-react';
import Logo from './Logo';

export default function Header({
    userName,
    openDrawer,
    openSettings,
    activeSlot,
    onSlotClick
}) {
    const navItems = [
        { id: 0, icon: <TrendingUp size={20} />, color: '#98a436', label: 'News' },
        { id: 1, icon: <MessageSquare size={20} />, color: '#fdb913', label: 'Dialog' },
        { id: 2, icon: <Ghost size={20} />, color: '#f15a24', label: 'Trends' },
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
                <Logo />
            </div>

            {/* Timeline Buttons moved to Header */}
            <div className="flex items-center gap-4 sm:gap-8 h-16">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onSlotClick(item.id)}
                        style={{ color: activeSlot === item.id ? item.color : 'rgba(255,255,255,0.2)' }}
                        className={`p-2 relative flex items-center justify-center transition-all duration-300 hover:text-white/60 active:scale-90`}
                        title={item.label}
                    >
                        {item.icon}
                        {activeSlot === item.id && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current shadow-[0_0_8px_current]" />
                        )}
                    </button>
                ))}
            </div>
        </header>
    );
}
