import React from 'react';
import { User, Menu, Settings } from 'lucide-react';
import Logo from './Logo';

export default function Header({
    userName,
    openDrawer
}) {
    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl z-50 shrink-0">
            <div className="flex items-center gap-6">
                <button
                    onClick={openDrawer}
                    className="p-2 -ml-2 text-white/40 hover:text-white transition-colors md:hidden"
                >
                    <Menu size={24} />
                </button>
                <Logo />
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/10">
                    <User size={14} className="text-white/40" />
                    <span className="text-[11px] font-bold tracking-tight text-white/80">{userName}</span>
                </div>
                <Settings size={18} className="text-white/20 cursor-pointer hover:rotate-90 transition-transform duration-700 hover:text-white" />
            </div>
        </header>
    );
}
