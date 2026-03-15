import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Cpu, MapPin, Search } from 'lucide-react';
import ThreeDMap from './ThreeDMap';
import WarholAvatar from './WarholAvatar';

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
    setEnlargedCharId,
    geminiKey,
    setGeminiKey,
    isValidatingApi,
    apiConnectionStatus,
    handleValidateApi,
}) => {
    return (
        <div className="space-y-12">
            {/* Tabs for Manager */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5 mb-8">
                {[
                    { id: 'directory', icon: <User size={14} />, label: 'Registry', color: '#98a436' },
                    { id: 'map', icon: <Globe size={14} />, label: 'Map', color: '#fdb913' },
                    { id: 'connect', icon: <Cpu size={14} />, label: 'Connect', color: '#f15a24' },
                ].map(tab => {
                    const isActive = activeManagerTab === tab.id;
                    const bgColor = isActive ? tab.color : 'rgba(255,255,255,0.03)';
                    const textColor = isActive ? '#000' : 'rgba(255,255,255,0.3)';
                    const shadow = isActive ? `0 4px 15px ${tab.color}44` : 'none';
                    const border = isActive ? 'border-white/20' : 'border-transparent';

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveManagerTab(tab.id)}
                            style={{
                                backgroundColor: bgColor,
                                color: textColor,
                                boxShadow: shadow
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-500 active:scale-95 cursor-pointer font-oswald border ${border}`}
                        >
                            {tab.icon}
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {activeManagerTab === 'map' && (
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
                        />
                    </motion.div>
                )}

                {activeManagerTab === 'directory' && (
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
                                    {isSelected && (
                                        <motion.div 
                                            layoutId={`char-glow-${c.id}`}
                                            className="absolute inset-0 bg-white/5 blur-2xl pointer-events-none"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        />
                                    )}

                                    <div onClick={(e) => { e.stopPropagation(); setEnlargedCharId(c.id); }} className="relative z-10 cursor-zoom-in">
                                        <WarholAvatar src={c.avatar} colorClass={c.color} isSelected={isSelected} size="w-12 h-12 md:w-16 h-16" isPreStyled={c.isPreStyled} />
                                    </div>
                                    <div className="relative z-10 flex-1 space-y-1 md:space-y-2 py-0.5 md:py-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <span className={`text-sm md:text-base font-bold tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-white/30'}`}>{c.name}</span>
                                                <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${isSelected ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white/5 text-white/10'}`}>{c.flavor}</span>
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
                )}

                {activeManagerTab === 'connect' && (
                    <motion.div
                        key="connect"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-8 rounded-[40px] bg-white/5 border border-white/10 space-y-8"
                    >
                        <div className="flex items-center gap-4 p-8 bg-[#f15a24]/5 border border-[#f15a24]/10 rounded-3xl">
                            <div className={`w-3 h-3 rounded-full ${geminiKey ? 'bg-[#f15a24] animate-pulse shadow-[0_0_15px_rgba(241,90,36,0.8)]' : 'bg-white/10'}`} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[#f15a24]/80 tracking-widest uppercase mb-1 font-oswald">
                                    {geminiKey ? `Verified Connection (${geminiKey.split(',').filter(k=>k.trim()).length} Keys)` : 'Awaiting Connection'}
                                </span>
                                <p className="text-[9px] text-white/20 leading-relaxed font-serif">
                                    {geminiKey ? '精神の回路は正常に接続されています。複数の鍵による並行接続が有効です。' : '対話を開始するにはAPIキーが必要です。カンマ区切りで複数指定可能。'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                placeholder="Enter Gemini API Keys (comma separated)..."
                                value={geminiKey}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setGeminiKey(val);
                                    localStorage.setItem('itako_gemini_key', val);
                                }}
                                className="w-full bg-black/60 border border-white/30 rounded-2xl p-4 text-white text-[10px] focus:ring-1 ring-[#f15a24]/50 outline-none transition-all placeholder:text-white/10 font-mono resize-none min-h-[80px]"
                            />
                            <button
                                onClick={handleValidateApi}
                                disabled={isValidatingApi}
                                className={`w-full py-4 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 font-oswald ${apiConnectionStatus === 'success'
                                    ? 'bg-[#f15a24] text-white shadow-[0_0_20px_rgba(241,90,36,0.6)]'
                                    : geminiKey && !isValidatingApi ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20'
                                    }`}
                            >
                                {isValidatingApi ? 'Validating...' : apiConnectionStatus === 'error' ? 'Retry Connection' : '接続する (Connect)'}
                            </button>
                            {apiConnectionStatus === 'error' && (
                                <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest text-center animate-pulse">
                                    Invalid API Key or Limit Exceeded.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

ManagerContent.displayName = 'ManagerContent';
export default ManagerContent;
