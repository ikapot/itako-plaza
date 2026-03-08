import React from 'react';
import { User, Menu, Settings } from 'lucide-react';
import Logo from './Logo';

export default function Header({
    userName,
    openDrawer,
    openSettings
}) {
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

            <div className="flex items-center gap-6 h-16">
                {/* Profile/Settings moved to Sidebar */}
            </div>
        </header>
    );
}
