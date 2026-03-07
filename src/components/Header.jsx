import React from 'react';
import { Ghost, BookOpen, User, Settings } from 'lucide-react';

export default function Header({
    userName,
    geminiKey,
    setGeminiKey,
    showContextUI,
    setShowContextUI
}) {
    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-orange-100 bg-white/50 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Ghost className="text-itako-orange" />
                    <h1 className="text-xl font-bold tracking-tight">ITAKO PLAZA</h1>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        placeholder="Gemini API Keyを入力..."
                        value={geminiKey}
                        onChange={(e) => {
                            setGeminiKey(e.target.value);
                            localStorage.setItem('itako_gemini_key', e.target.value);
                        }}
                        className="px-3 py-1 text-xs border border-orange-200 rounded-md bg-white/80 focus:outline-none focus:ring-1 focus:ring-itako-orange shadow-sm w-48"
                    />
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
