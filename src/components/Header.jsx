import React from 'react';
import { User, Menu, Settings } from 'lucide-react';
import Logo from './Logo';

export default function Header({
    userName,
    openDrawer,
    openSettings
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
                {/* Profile/Settings moved to Sidebar */}
            </div>
        </header>
    );
}
