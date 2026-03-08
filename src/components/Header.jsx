import React from 'react';
import { BookOpen, User, Settings, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';

export default function Header({
    userName,
    geminiKey,
    setGeminiKey,
    showContextUI,
    setShowContextUI
}) {
    const [isConnected, setIsConnected] = React.useState(!!geminiKey);
    const [tempKey, setTempKey] = React.useState(geminiKey);

    const handleConnect = () => {
        setGeminiKey(tempKey);
        localStorage.setItem('itako_gemini_key', tempKey);
        if (tempKey) setIsConnected(true);
        else setIsConnected(false);
    };

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl z-10 shrink-0">
            <div className="flex items-center gap-8">
                <Logo />
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-1.5 rounded-full pl-6 shadow-sm group">
                    <input
                        type="password"
                        placeholder="Gemini API Key..."
                        value={tempKey}
                        onChange={(e) => {
                            setTempKey(e.target.value);
                            setIsConnected(false);
                        }}
                        className="px-2 py-0.5 text-[10px] font-medium bg-transparent focus:outline-none w-44 text-white/40 placeholder:text-white/10"
                    />
                    <button
                        onClick={handleConnect}
                        className={`px-6 py-1.5 text-[10px] font-bold rounded-full transition-all flex items-center gap-2 ${isConnected
                            ? 'bg-transparent text-white/20'
                            : 'bg-zinc-200 text-black hover:bg-white'
                            }`}
                    >
                        {isConnected ? (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="tracking-widest">CONNECTED</span>
                            </>
                        ) : 'CONNECT'}
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <button
                    onClick={() => setShowContextUI(!showContextUI)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all border ${showContextUI ? 'bg-zinc-200 text-black border-zinc-200 shadow-xl' : 'bg-transparent border-white/10 text-white/30 hover:border-white/20'}`}
                >
                    <BookOpen size={14} />
                    Context
                </button>
                <div className="flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/10">
                    <User size={14} className="text-white/40" />
                    <span className="text-[11px] font-bold tracking-tight text-white/80">{userName}</span>
                </div>
                <Settings size={18} className="text-white/20 cursor-pointer hover:rotate-90 transition-transform duration-700 hover:text-white" />
            </div>
        </header>
    );
}
