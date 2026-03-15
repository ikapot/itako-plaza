import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Cpu, MapPin, Search } from 'lucide-react';
import ThreeDMap from './ThreeDMap';
import WarholAvatar from './WarholAvatar';

function getConnectBtnStyle(status, key, loading) {
  const base = "w-full py-4 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 font-oswald";
  if (status === 'success') return `${base} bg-[#f15a24] text-white shadow-[0_0_20px_rgba(241,90,36,0.6)]`;
  if (key && !loading) return `${base} bg-white/10 text-white`;
  return `${base} bg-white/5 text-white/20`;
}

const ManagerContent = React.memo(({
    activeManagerTab,
    setActiveManagerTab,
    locations,
    selectedLocationId,
    setSelectedLocationId,
    locationEnergies,
    characters,
    selectedCharIds,
    handleToggleChar,
    handleSetChars,
    setEnlargedCharId,
    geminiKey,
    setGeminiKey,
    isValidatingApi,
    apiConnectionStatus,
    handleValidateApi,
    globalSentiment,
}) => {
    return (
        <div className="space-y-12">

            <AnimatePresence mode="wait">
                {activeManagerTab === 'map' ? (
                    <motion.div
                        key="map"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="space-y-6"
                    >
                        <ThreeDMap 
                            locations={locations} 
                            selectedLocationId={selectedLocationId} 
                            setSelectedLocationId={setSelectedLocationId}
                            selectedCharIds={selectedCharIds}
                            locationEnergies={locationEnergies}
                            characters={characters}
                            handleToggleChar={handleToggleChar}
                            onSetChars={handleSetChars}
                            globalSentiment={globalSentiment}
                        />
                    </motion.div>
                ) : null}

                {activeManagerTab === 'directory' ? (
                    <motion.div
                        key="directory"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {characters.map(c => {
                            const isSelected = selectedCharIds.includes(c.id);
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => handleToggleChar(c.id)}
                                    className={`
                                        w-full group relative text-left flex items-start gap-4 md:gap-6 p-4 md:p-6 rounded-[35px] transition-all duration-500 border active:scale-[0.98] overflow-hidden
                                        ${isSelected 
                                            ? 'bg-white/10 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.15)] translate-x-2' 
                                            : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 cursor-pointer'}
                                    `}
                                >
                                    {/* Selection Glow Background */}
                                    {isSelected ? (
                                        <motion.div 
                                            layoutId={`char-glow-${c.id}`}
                                            className="absolute inset-0 bg-white/5 blur-2xl pointer-events-none"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        />
                                    ) : null}

                                    <div onClick={(e) => { e.stopPropagation(); setEnlargedCharId(c.id); }} className="relative z-10 cursor-zoom-in">
                                        <WarholAvatar src={c.avatar} colorClass={c.color} isSelected={isSelected} size="w-12 h-12 md:w-16 h-16" isPreStyled={c.isPreStyled} />
                                    </div>
                                    <div className="relative z-10 flex-1 space-y-1 md:space-y-2 py-0.5 md:py-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <span className={`text-sm md:text-base font-bold tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-white/30'}`}>{c.name}</span>
                                                <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${isSelected ? 'bg-white text-black' : 'bg-white/5 text-white/10'}`}>{c.role}</span>
                                                <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white/10'}`}>{c.flavor}</span>
                                            </div>
                                        </div>
                                        <p className={`text-[10px] md:text-xs leading-relaxed transition-opacity line-clamp-2 ${isSelected ? 'text-white/60' : 'text-white/20'}`}>
                                            {c.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                ) : null}

                {activeManagerTab === 'connect' ? (
                    <motion.div
                        key="connect"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-8 rounded-[40px] bg-white/5 border border-white/10 space-y-10"
                    >
                        {/* Status Header */}
                        <div className="flex items-center gap-6 p-8 bg-[#f15a24]/5 border border-[#f15a24]/10 rounded-[35px] relative overflow-hidden group">
                            <motion.div 
                                animate={{ scale: geminiKey ? [1, 1.2, 1] : 1 }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`w-4 h-4 rounded-full relative z-10 ${geminiKey ? 'bg-[#f15a24] shadow-[0_0_20px_rgba(241,90,36,0.8)]' : 'bg-white/10'}`} 
                            />
                            <div className="flex flex-col relative z-10">
                                <span className="text-[11px] font-black text-[#f15a24] tracking-widest uppercase mb-1 font-oswald">
                                    {geminiKey ? `Active Spiritual Conduits (${geminiKey.split(',').filter(k=>k.trim()).length}/3)` : 'Connection Severed'}
                                </span>
                                <p className="text-[10px] text-white/40 leading-relaxed font-serif italic">
                                    {geminiKey ? '複数の霊的回路が同期しています。並列処理により制限を超越します。' : '対話を開始するにはAPIキーを接続してください。3つの鍵が推奨されます。'}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                <Cpu className="w-12 h-12 text-[#f15a24]" />
                            </div>
                        </div>

                        {/* Trinity Slot Management */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-[10px] font-bold text-white/30 tracking-widest uppercase font-oswald">Trinity Connection (推奨3スロット)</h3>
                                <a 
                                    href="https://aistudio.google.com/app/apikey" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-[#f15a24] hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                                >
                                    <Globe className="w-3 h-3" /> Get New Keys in AI Studio
                                </a>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[0, 1, 2].map(idx => {
                                    const allKeys = geminiKey.split(',').map(k => k.trim());
                                    const currentK = allKeys[idx] || '';
                                    return (
                                        <div key={idx} className="relative group">
                                            <div className="absolute -top-2 left-4 px-2 py-0.5 bg-black border border-white/10 rounded-full text-[7px] text-white/20 font-black z-20">SLOT {idx+1}</div>
                                            <input
                                                type="password"
                                                placeholder="API KEY..."
                                                value={currentK}
                                                onChange={(e) => {
                                                    const next = [...allKeys];
                                                    next[idx] = e.target.value;
                                                    const newVal = next.filter(Boolean).join(',');
                                                    setGeminiKey(newVal);
                                                    localStorage.setItem('itako_gemini_key', newVal);
                                                }}
                                                className={`w-full bg-black/40 border rounded-[25px] p-5 pt-7 text-xs font-mono outline-none transition-all
                                                    ${currentK ? 'border-[#f15a24]/30 text-white' : 'border-white/10 text-white/10 hover:border-white/20'}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Magic Bulk Import */}
                            <div className="relative">
                                <textarea
                                    placeholder="ここへ複数のキーを一括ペースト（カンマ・スペース・改行区切り対応）"
                                    onChange={(e) => {
                                        const val = e.target.value.trim();
                                        if (!val) return;
                                        // 複数の区切り文字に対応してスプリット
                                        const detected = val.split(/[,\s\n]+/).filter(k => k.length > 20);
                                        if (detected.length > 0) {
                                            const newVal = detected.slice(0, 3).join(',');
                                            setGeminiKey(newVal);
                                            localStorage.setItem('itako_gemini_key', newVal);
                                            e.target.value = ''; // Clear
                                        }
                                    }}
                                    className="w-full bg-white/[0.02] border border-dashed border-white/10 rounded-[25px] p-4 text-[9px] text-white/20 focus:text-white focus:border-[#f15a24]/50 outline-none transition-all h-20 text-center flex items-center justify-center resize-none"
                                />
                                <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none">
                                    <span className="text-[8px] text-white/5 uppercase tracking-[0.3em] font-black">Quick Injection Portal</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleValidateApi}
                                disabled={isValidatingApi}
                                className={getConnectBtnStyle(apiConnectionStatus, geminiKey, isValidatingApi)}
                            >
                                {isValidatingApi ? 'Validating Trinity...' : apiConnectionStatus === 'error' ? 'Retry Connection' : '回路を安定化させる (Connect All)'}
                            </button>
                            {apiConnectionStatus === 'error' ? (
                                <p className="mt-4 text-[8px] font-bold text-red-500 uppercase tracking-widest text-center animate-pulse">
                                    ⚠️ Some conduits failed. Check keys and limits.
                                </p>
                            ) : null}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
});

ManagerContent.displayName = 'ManagerContent';
export default ManagerContent;
