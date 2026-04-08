import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { User, Globe, Cpu, MapPin, Search, Settings, Bookmark, MessageCircle, Activity, Library, Sparkles, RotateCw } from 'lucide-react';
import LibraryView from './Library';
import WarholAvatar from './WarholAvatar';
import PortalGrimoire from './PortalGrimoire';
import DiscordConsultation from './DiscordConsultation';
import { CHARACTER_PROFILES } from '../data/profiles';
import TradingDashboard from './TradingDashboard';

const getGenreColors = (index) => {
    const isOrange = index % 2 === 0;
    
    if (isOrange) {
        return {
            bgColor: 'bg-[#f15a24]', // Orange Paper
            textColor: 'text-black',
            subTextColor: 'text-black/50',
            tabColor: 'bg-[#f15a24]', 
            tabTextColor: 'text-black',
            tagBg: 'bg-black/20',
            tagText: 'text-black',
            borderColor: 'border-black', 
            btnBg: 'bg-black text-[#f15a24]'
        };
    } else {
        return {
            bgColor: 'bg-[#050505]', // Deep Black Paper
            textColor: 'text-[#f15a24]',
            subTextColor: 'text-[#f15a24]/40',
            tabColor: 'bg-[#050505]', 
            tabTextColor: 'text-[#f15a24]',
            tagBg: 'bg-[#f15a24]/20',
            tagText: 'text-[#f15a24]',
            borderColor: 'border-[#f15a24]', 
            btnBg: 'bg-[#f15a24] text-black'
        };
    }
};

const CabinetDrawer = React.memo(({ c, i, isExpanded, onToggleExpand, isSelected, onToggleChar, onManifestSoul }) => {
    const { bgColor, textColor, subTextColor, tabColor, tabTextColor, tagBg, tagText, borderColor, btnBg } = getGenreColors(i);
    const alignment = i % 2 === 0 ? 'justify-start' : 'justify-end';
    const isOrange = tabColor === 'bg-[#f15a24]';

    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "200px 0px" });

    return (
        <div 
            ref={ref}
            className={`relative transition-all duration-700 ease-in-out w-full font-sans`}
            style={{
                marginTop: i === 0 ? '0' : '-3.5rem',
                zIndex: isExpanded ? 60 : i
            }}
        >
            {/* Tab */}
            <div className={`flex w-full ${alignment} px-0 pointer-events-none mb-[-2px]`}>
                <button 
                    onClick={() => onToggleExpand(isExpanded ? null : c.id)}
                    className={`relative ${tabTextColor} w-32 md:w-56 h-8 md:h-10 text-[9px] md:text-[11px] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase pointer-events-auto origin-bottom transition-all z-20 font-oswald flex items-center group outline-none focus:outline-none`}
                >
                    {/* Tab Shape Background */}
                    <div 
                        className={`absolute inset-0 ${tabColor} z-0 rounded-t-[8px] origin-bottom transition-transform duration-300 group-hover:scale-y-110 border-t-2 border-l-2 border-r-2 ${borderColor}`}
                        style={{
                            transform: 'perspective(100px) rotateX(25deg)',
                        }}
                    />
                    
                    <span className="flex items-center gap-2 md:gap-4 px-6 md:px-8 w-full relative z-10">
                        <span className="opacity-40 shrink-0">#{String(i + 1).padStart(2, '0')}</span>
                        <span className="truncate">{c.name}</span>
                    </span>
                    {isExpanded ? <motion.div layoutId="tab-active" className={`absolute bottom-0 left-[10%] right-[10%] h-1 ${isOrange ? 'bg-black' : 'bg-[#f15a24]'} z-20`} /> : null}
                </button>
            </div>
            
            {/* Folder Body */}
            <div 
                onClick={() => !isExpanded && onToggleExpand(c.id)}
                className={`w-full rounded-none ${bgColor} ${textColor} overflow-hidden cursor-pointer transition-all duration-700 ease-in-out relative z-10 border-2 ${borderColor} mb-[-2px]`}
            >
                {(isInView || isExpanded) ? (
                <div className={`transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[1200px] opacity-100 p-6 md:p-12 cursor-default' : `max-h-[2.5rem] opacity-60 p-0 flex items-center px-8 hover:opacity-100 ${isOrange ? 'hover:bg-black/10' : 'hover:bg-[#f15a24]/10'}`}`}>
                    
                    {!isExpanded ? (
                        <div className="w-full h-8 flex items-center justify-between pointer-events-none" />
                    ) : (
                        <div className="space-y-6 md:space-y-8" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col sm:flex-row items-start gap-6 md:gap-8">
                                <div className={`w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-none overflow-hidden ${isOrange ? 'bg-[#f15a24]' : 'bg-[#f15a24]'} relative`}>
                                    {c.avatar ? (
                                        <>
                                            {/* We use an orange base for all portraits to keep a consistent 'positive print' aesthetic */}
                                            <img 
                                                src={c.avatar} 
                                                alt={c.name} 
                                                className="absolute inset-0 w-full h-full object-cover contrast-[15] grayscale mix-blend-multiply" 
                                            />
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30 text-6xl font-serif">?</div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4 md:space-y-6 w-full">
                                    <div>
                                        <h3 className={`text-3xl md:text-4xl font-black font-oswald tracking-widest border-b ${isOrange ? 'border-black/10':'border-[#f15a24]/10'} pb-2 mb-2 md:mb-4 uppercase`}>{c.name}</h3>
                                         <div className="flex flex-wrap gap-2">
                                            <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${tagBg} ${tagText} px-3 py-1 rounded-sm border ${isOrange ? 'border-black':'border-[#f15a24]'} font-oswald`}>{c.role}</span>
                                            <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${isOrange ? 'bg-black/10 text-black/80 border-black/20':'bg-[#f15a24]/10 text-[#f15a24]/80 border-[#f15a24]/20'} px-3 py-1 rounded-sm border font-oswald`}>{c.flavor}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm md:text-base leading-relaxed font-serif italic py-2 opacity-95 break-words font-medium whitespace-pre-wrap">
                                        {CHARACTER_PROFILES[c.id] || c.description}
                                    </p>
                                </div>
                            </div>
                            
                            <div className={`flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t ${isOrange ? 'border-black/10' : 'border-[#f15a24]/10'} font-oswald`}>
                                <button
                                    onClick={() => onManifestSoul ? onManifestSoul(c.id) : onToggleChar(c.id)}
                                    className={`w-full sm:w-auto px-10 py-4 rounded-none font-black text-xs md:text-sm uppercase tracking-[0.4em] transition-all active:scale-95 flex items-center justify-center gap-3 border outline-none
                                        ${isSelected 
                                            ? (isOrange ? 'bg-black text-[#f15a24] border-black' : 'bg-[#f15a24] text-black border-[#f15a24]')
                                            : (isOrange ? 'bg-transparent text-black border-black hover:bg-black hover:text-[#f15a24]' : 'bg-transparent text-[#f15a24] border-[#f15a24] hover:bg-[#f15a24] hover:text-black')}
                                    `}
                                >
                                    {isSelected ? (
                                        <span>Summond / 同行中</span>
                                    ) : (
                                        <><span>Manifest Soul / 対話する</span><span className="text-lg">→</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                ) : (
                    <div className="w-full h-[2.5rem]" />
                )}
            </div>
        </div>
    );
});

const FileCabinetDirectory = React.memo(({ characters, selectedCharIds, handleToggleChar, onManifestSoul }) => {
    const [expandedId, setExpandedId] = useState(null);
    const containerRef = useRef(null);

    return (
        <div ref={containerRef} className="max-w-2xl mx-auto w-full pb-32 pt-12 px-0 md:px-4 relative mt-12 bg-black/60 rounded-3xl backdrop-blur-md">
             <div className="flex flex-col relative z-10 w-full mb-[-2rem]">
                 {characters.map((c, i) => (
                     <CabinetDrawer 
                        key={c.id}
                        c={c}
                        i={i}
                        isExpanded={expandedId === c.id}
                        onToggleExpand={setExpandedId}
                        isSelected={selectedCharIds.includes(c.id)}
                        onToggleChar={handleToggleChar}
                        onManifestSoul={onManifestSoul}
                     />
                 ))}
             </div>

             {/* The Box Front Bottom */}
             <div className="relative z-[100] w-full mt-8 pointer-events-none">
                 <div className="w-full h-32 md:h-48 bg-black flex items-center justify-center relative overflow-hidden border-b-2 border-black">
                     <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                     {/* Label */}
                     <div className="bg-[#f15a24] px-8 md:px-12 py-3 border-2 border-black relative z-10 w-64 md:w-80 text-center flex flex-col items-center justify-center">
                         <span className="font-oswald text-black text-2xl md:text-3xl font-black tracking-[0.3em] uppercase">Spirit Index</span>
                         <span className="text-[10px] text-black/50 font-bold uppercase tracking-[0.5em]">Soul Configuration V2</span>
                         <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-black/40" />
                         <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-black/40" />
                         <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-black/40" />
                         <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-black/40" />
                     </div>
                 </div>
                 {/* Trapeze sides trick using CSS borders */}
                  <div className="absolute top-0 -left-6 border-t-[0px] border-b-[8rem] md:border-b-[12rem] border-b-black border-l-[1.5rem] border-l-transparent hidden md:block" />
                  <div className="absolute top-0 -right-6 border-t-[0px] border-b-[8rem] md:border-b-[12rem] border-b-black border-r-[1.5rem] border-r-transparent hidden md:block" />
             </div>
        </div>
    );
});

function getConnectBtnStyle(status, key, loading) {
  const base = "w-full py-4 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 font-oswald";
  if (status === 'success') return `${base} bg-[#f15a24] text-white shadow-[0_0_20px_rgba(241,90,36,0.6)]`;
  if (key && !loading) return `${base} bg-white/10 text-white`;
  return `${base} bg-white/5 text-white/20`;
}

const ManagerContent = React.memo(({
    activeManagerTab,
    setActiveManagerTab,
    user,
    loginWithGoogle,
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
    bookmarks,
    messages,
    userName,
    handleLogout,
    onManifestSoul
}) => {
    const stats = useMemo(() => [
        { label: 'Bookmarks', val: bookmarks?.length || 0, icon: <Bookmark size={14} /> },
        { label: 'Manifestations', val: messages.filter(m => m.role === 'user').length || 0, icon: <MessageCircle size={14} /> },
        { label: 'Deepest Bond', val: (() => {
            const counts = messages.filter(m => m.role === 'ai' && m.charId).reduce((acc, m) => {
                acc[m.charId] = (acc[m.charId] || 0) + 1;
                return acc;
            }, {});
            const topCharId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
            return characters.find(c => c.id === topCharId)?.name || 'None';
        })(), icon: <User size={14} /> },
        { label: 'Active Sessions', val: selectedCharIds.length || 0, icon: <Activity size={14} /> },
    ], [bookmarks, messages, characters, selectedCharIds]);

    return (
        <div className="space-y-12">
            <AnimatePresence mode="wait">


                {activeManagerTab === 'library' ? (
                    <motion.div
                        key="library"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between px-6 mb-2">
                            <h2 className="text-sm font-bold text-[#f15a24] tracking-[0.3em] uppercase font-oswald flex items-center gap-3">
                                <Library size={18} />
                                THE LIBRARY OF BABEL / バベルの図書館
                            </h2>
                        </div>
                        <LibraryView characters={characters} userName={userName} geminiKey={geminiKey} />
                    </motion.div>
                ) : null}

                {activeManagerTab === 'directory' ? (
                    <motion.div
                        key="directory"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full h-full overflow-y-auto itako-scrollbar-thin"
                    >
                        <FileCabinetDirectory 
                            characters={characters} 
                            selectedCharIds={selectedCharIds} 
                            handleToggleChar={handleToggleChar} 
                            onManifestSoul={onManifestSoul}
                        />
                    </motion.div>
                ) : null}

                {activeManagerTab === 'connect' ? (
                    <motion.div
                        key="connect"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-8 rounded-[40px] bg-black/40 border-on-black space-y-10"
                    >
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
                                <p className="text-[10px] text-white/80 leading-relaxed font-serif italic">
                                    {geminiKey === 'PROXY_MODE' ? '共用の無料プロキシ回路にて稼働中です。あなたのAPIキーは必要ありません。' : geminiKey ? '霊的回路が同期しています。' : '対話を開始するにはAPIキーを接続してください。'}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                <Cpu className="w-12 h-12 text-[#f15a24]" />
                            </div>
                        </div>

                        <PortalGrimoire 
                            geminiKey={geminiKey}
                            setGeminiKey={setGeminiKey}
                            isValidatingApi={isValidatingApi}
                            apiConnectionStatus={apiConnectionStatus}
                            handleValidateApi={handleValidateApi}
                            user={user}
                            loginWithGoogle={loginWithGoogle}
                        />
                    </motion.div>
                ) : null}

                {activeManagerTab === 'account' ? (
                    <motion.div
                        key="account"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-8 space-y-12 h-screen overflow-y-auto itako-scrollbar-thin"
                    >
                        <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-black/40 border-on-black rounded-[40px]">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#bd8a78] to-[#f15a24] flex items-center justify-center text-4xl shadow-2xl overflow-hidden">
                                {user?.photoURL ? <img src={user.photoURL} alt="avatar" /> : (userName?.[0] || '魂')}
                            </div>
                             <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                                <h1 className="text-3xl font-black font-oswald uppercase tracking-widest text-white">{userName}</h1>
                                <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.4em] mb-4">
                                    {user ? 'Spirit Registry: Authenticated' : 'Spirit Registry: Guest / Anonymous'}
                                </p>
                                
                                 {!user ? (
                                    <button 
                                        onClick={loginWithGoogle}
                                        className="px-6 py-2 bg-white text-black text-[10px] font-black tracking-[0.2em] uppercase rounded-full hover:bg-[#f15a24] transition-all flex items-center gap-2"
                                    >
                                        Google Account Login / 本人確認
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleLogout}
                                        className="px-6 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 text-[10px] font-black tracking-[0.2em] uppercase rounded-full transition-all flex items-center gap-2"
                                    >
                                        Logout / 斎場を後にする
                                    </button>
                                )}
                            </div>
                        </div>

                        {activeManagerTab === 'consult' ? (
                            <motion.div
                                key="consult"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="w-full h-full overflow-y-auto itako-scrollbar-thin"
                            >
                                <DiscordConsultation />
                            </motion.div>
                        ) : null}
                
                {activeManagerTab === 'trading' ? (
                    <motion.div
                        key="trading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full h-full"
                    >
                        <TradingDashboard user={user} />
                    </motion.div>
                ) : null}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.map((s, i) => (
                                <div key={i} className="p-4 bg-black/40 border-on-black rounded-3xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{s.label}</span>
                                        <div className="text-white/50">{s.icon}</div>
                                    </div>
                                    <span className="text-xl font-black text-white font-oswald">{s.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-white/40 tracking-[0.3em] uppercase px-4 border-l-2 border-[#bd8a78]">Echo Bookmarks (栞)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(bookmarks || []).map((b, i) => {
                                    const char = characters.find(c => c.id === b.charId);
                                    return (
                                        <div key={i} className="p-6 bg-black/40 border border-white/10 rounded-[30px] space-y-4 hover:border-white/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <WarholAvatar src={char?.avatar} colorClass={char?.color} size="w-6 h-6" isSelected />
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{char?.name}</span>
                                            </div>
                                            <p className="text-sm text-white/80 leading-relaxed italic line-clamp-3">"{b.aiMsg}"</p>
                                        </div>
                                    );
                                })}
                                {(!bookmarks || bookmarks.length === 0) ? (
                                    <p className="text-xs text-white/10 tracking-widest uppercase italic px-6">囁きはまだ記録されていません。</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-6 pb-20">
                            <h2 className="text-sm font-bold text-white/40 tracking-[0.3em] uppercase px-4 border-l-2 border-[#bd8a78]">Manifestations (自身の言葉)</h2>
                            <div className="space-y-3">
                                {messages.filter(m => m.role === 'user').map((m, i) => (
                                    <div key={i} className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                        <p className="text-xs text-white/60 tracking-wide font-medium">{m.content}</p>
                                        <span className="text-[8px] text-white/10 font-bold uppercase">{new Date().toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : null}
                

            </AnimatePresence>
        </div>
    );
});

ManagerContent.displayName = 'ManagerContent';
export default ManagerContent;
