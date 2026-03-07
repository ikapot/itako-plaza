import React from 'react';
import { Ghost, BookOpen, User, Settings } from 'lucide-react';

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
        <header className="h-16 flex items-center justify-between px-6 border-b border-orange-100 bg-white/50 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Ghost className="text-itako-orange" />
                    <h1 className="text-xl font-bold tracking-tight">ITAKO PLAZA</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/80 border border-orange-200 p-1 rounded-md shadow-sm">
                        <input
                            type="password"
                            placeholder="Gemini API Key..."
                            value={tempKey}
                            onChange={(e) => {
                                setTempKey(e.target.value);
                                setIsConnected(false);
                            }}
                            className="px-2 py-0.5 text-xs bg-transparent focus:outline-none w-40 text-itako-grey/80"
                        />
                        <button
                            onClick={handleConnect}
                            className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${isConnected
                                ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                : 'bg-itako-orange text-white hover:bg-orange-600'
                                }`}
                        >
                            {isConnected ? '連携済み ✓' : '連携する'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowContextUI(!showContextUI)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showContextUI ? 'bg-itako-orange text-white' : 'bg-white border border-orange-100 text-itako-orange hover:bg-orange-50'}`}
                >
                    <BookOpen size={12} />
                    NotebookLM Context
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border border-orange-50">
                    <User size={16} className="text-orange-300" />
                    <span className="text-sm font-medium">{userName}</span>
                </div>
                <Settings size={20} className="text-itako-grey/50 cursor-pointer hover:rotate-45 transition-transform" />
            </div>
        </header>
    );
}
