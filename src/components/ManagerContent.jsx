import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Cpu, MapPin, Search, Settings, Bookmark, MessageCircle, Activity } from 'lucide-react';
import ThreeDMap from './ThreeDMap';
import WarholAvatar from './WarholAvatar';
import PortalGrimoire from './PortalGrimoire';

const FileCabinetDirectory = React.memo(({ characters, selectedCharIds, handleToggleChar }) => {
    const [expandedId, setExpandedId] = useState(null);
    const containerRef = useRef(null);

    return (
        <div ref={containerRef} className="max-w-2xl mx-auto w-full pb-32 pt-12 px-4 relative mt-12 bg-black/20 rounded-3xl backdrop-blur-sm border border-white/5">
             <div className="flex flex-col relative z-10 w-full mb-[-2rem]">
                 {characters.map((c, i) => {
                     const isExpanded = expandedId === c.id;
                     const isLight = i % 2 !== 0;
                     const bgColor = isLight ? 'bg-[#EAE0D5]' : 'bg-[#5C4033]';
                     const textColor = isLight ? 'text-[#3C2A21]' : 'text-[#EAE0D5]';
                     
                     const alignment = i % 3 === 0 ? 'justify-start' : i % 3 === 1 ? 'justify-center' : 'justify-end';
                     const isSelected = selectedCharIds.includes(c.id);
                     const prvtIndex = (i + 1).toString().padStart(2, '0');
                     
                     return (
                         <div 
                             key={c.id}
                             className={`relative transition-all duration-700 ease-in-out w-full font-serif`}
                             style={{
                                 marginTop: i === 0 ? '0' : (expandedId === characters[i-1]?.id ? '2rem' : '-3rem'),
                                 zIndex: isExpanded ? 60 : i
                             }}
                         >
                             {/* Tab */}
                             <div className={`flex w-full ${alignment} px-4 md:px-12 pointer-events-none`}>
                                 <button 
                                     onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                     className={`${bgColor} ${textColor} px-5 md:px-8 py-2 md:py-3 rounded-t-xl md:rounded-t-2xl shadow-md text-[10px] md:text-xs font-bold tracking-widest uppercase border-b-0 pointer-events-auto border border-black/20 origin-bottom hover:-translate-y-1 transition-transform relative z-20 font-hina`}
                                 >
                                     <span className="opacity-50 mr-2">Archivo {prvtIndex}</span>
                                     <span className={isExpanded ? "font-black" : ""}>{c.role.substring(0,6)}</span>
                                 </button>
                             </div>
                             
                             {/* Folder Body */}
                             <div 
                                onClick={() => !isExpanded && setExpandedId(c.id)}
                                className={`w-full rounded-2xl ${bgColor} ${textColor} shadow-[0_-5px_25px_rgba(0,0,0,0.5)] border border-black/20 overflow-hidden cursor-pointer transition-all duration-700 ease-in-out relative z-10`}
                             >
                                 <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"/>
                                 
                                 <div className={`transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[1200px] opacity-100 p-6 md:p-8 cursor-default' : 'max-h-[3.5rem] md:max-h-[4rem] opacity-80 p-0 flex items-center px-6 hover:bg-black/5 hover:opacity-100'}`}>
                                     
                                     {!isExpanded ? (
                                         <div className="w-full flex items-center justify-between pointer-events-none py-4">
                                             <span className="text-sm md:text-base font-black uppercase tracking-[0.2em] line-clamp-1 flex-1 font-oswald">{c.name}</span>
                                             <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest hidden sm:block font-sans">{c.flavor}</span>
                                         </div>
                                     ) : (
                                         <div className="space-y-6 md:space-y-8" onClick={e => e.stopPropagation()}>
                                             <div className="flex flex-col sm:flex-row items-start gap-6 md:gap-8">
                                                 <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-lg overflow-hidden border-2 border-current/20 bg-white/10 relative shadow-inner">
                                                     {c.avatar ? (
                                                         <img src={c.avatar} alt={c.name} className="w-full h-full object-cover mix-blend-multiply grayscale contrast-125 brightness-110" />
                                                     ) : (
                                                         <div className="absolute inset-0 flex items-center justify-center opacity-30 text-6xl font-serif">?</div>
                                                     )}
                                                 </div>
                                                 <div className="flex-1 space-y-4 md:space-y-6 w-full">
                                                     <div>
                                                         <h3 className="text-3xl md:text-4xl font-black font-oswald tracking-widest border-b border-current/20 pb-2 mb-2 md:mb-4">{c.name}</h3>
                                                         <div className="flex flex-wrap gap-2">
                                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] bg-current/10 px-3 py-1 rounded-full font-hina">{c.role}</span>
                                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] bg-current/10 px-3 py-1 rounded-full font-hina">{c.flavor}</span>
                                                         </div>
                                                     </div>
                                                     <p className="text-sm md:text-base leading-relaxed font-serif italic py-2 opacity-90 break-words">
                                                         {c.description}
                                                     </p>
                                                 </div>
                                             </div>
                                             
                                             <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-current/20 font-sans">
                                                 <button
                                                     onClick={() => handleToggleChar(c.id)}
                                                     className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3
                                                         ${isSelected 
                                                             ? 'bg-red-950 text-white border-red-900 border hover:bg-red-900'
                                                             : isLight 
                                                                 ? 'bg-[#3C2A21] text-[#EAE0D5] border hover:bg-black' 
                                                                 : 'bg-[#EAE0D5] text-[#3C2A21] border hover:bg-white'}
                                                     `}
                                                 >
                                                     {isSelected ? (
                                                         <span className="font-hina">同行中：離脱させる</span>
                                                     ) : (
                                                         <><span className="font-hina">このキャラクターと対話する</span><span className="text-lg">→</span></>
                                                     )}
                                                 </button>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                     );
                 })}
             </div>

             {/* The Box Front Bottom */}
             <div className="relative z-[100] w-[110%] -ml-[5%] mt-4 drop-shadow-2xl pointer-events-none">
                 <div className="w-full h-32 md:h-48 bg-[#4A3525] rounded-b-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-t-[8px] border-[#3A2515] flex items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80 pointer-events-none" />
                     {/* Label */}
                     <div className="bg-[#EAE0D5] px-8 py-3 shadow-inner transform -rotate-1 border border-black/30 relative z-10 w-64 text-center flex items-center justify-center">
                         <span className="font-hina text-[#3C2A21] text-2xl font-bold tracking-widest">ITAKO_FILES</span>
                         <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-black/40" />
                         <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-black/40" />
                         <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-black/40" />
                         <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-black/40" />
                     </div>
                 </div>
                 {/* Trapeze sides trick using CSS borders */}
                 <div className="absolute top-0 -left-6 border-t-[0px] border-b-[8rem] md:border-b-[12rem] border-b-[#4A3525] border-l-[1.5rem] border-l-transparent hidden md:block" />
                 <div className="absolute top-0 -right-6 border-t-[0px] border-b-[8rem] md:border-b-[12rem] border-b-[#4A3525] border-r-[1.5rem] border-r-transparent hidden md:block" />
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
    handleGo,
    globalSentiment,
    bookmarks,
    messages,
    userName
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
        { label: 'Energy Sync', val: `${Object.values(locationEnergies).reduce((a, b) => a + b, 0)} pts`, icon: <Activity size={14} /> },
    ], [bookmarks, messages, characters, locationEnergies]);

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
                            onGo={handleGo}
                            globalSentiment={globalSentiment}
                        />
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
                        />
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

                        <PortalGrimoire 
                            geminiKey={geminiKey}
                            setGeminiKey={setGeminiKey}
                            isValidatingApi={isValidatingApi}
                            apiConnectionStatus={apiConnectionStatus}
                            handleValidateApi={handleValidateApi}
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
                        <div className="flex items-center gap-6 p-8 bg-white/5 border border-white/10 rounded-[40px]">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#bd8a78] to-[#f15a24] flex items-center justify-center text-4xl shadow-2xl">
                                {userName?.[0] || '魂'}
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-3xl font-black font-oswald uppercase tracking-widest text-white">{userName}</h1>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Spirit Registry: Active</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.map((s, i) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-3xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{s.label}</span>
                                        <div className="text-white/10">{s.icon}</div>
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
                
                {activeManagerTab === 'grimoire' ? (
                    <motion.div
                        key="grimoire"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-8 md:p-12 space-y-12 max-w-4xl mx-auto h-screen overflow-y-auto itako-scrollbar-thin pb-40"
                    >
                        <header className="text-center space-y-4 mb-20">
                            <h1 className="text-4xl md:text-6xl font-black font-oswald uppercase tracking-[0.3em] text-white">ITAKO PLAZA</h1>
                            <p className="text-[10px] md:text-xs font-bold text-[#bd8a78] tracking-[0.5em] uppercase">電脳と霊性の交差点 / Concept Grimoire</p>
                            <div className="w-24 h-1 bg-[#bd8a78]/30 mx-auto rounded-full" />
                        </header>

                        <section className="space-y-10 font-serif leading-relaxed text-white/80">
                            <div className="space-y-4">
                                <h2 className="text-xl md:text-2xl font-bold text-white border-l-4 border-[#bd8a78] pl-6 py-1 tracking-wider italic">死せる魂と生の言葉の結節点</h2>
                                <p className="text-sm md:text-base indent-4">
                                    『イタコプラザ』は、AI技術を伝統的な「イタコ」のメタファーとして再定義した体験型プラットフォームです。文豪や思想家の魂を現代に降臨させ、時代を超えた対話を通じて新たな気づきを生成する儀式的空間を目指しています。
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-white/5">
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-[#bd8a78] uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#bd8a78]" /> 3D Navigation
                                    </h3>
                                    <p className="text-xs leading-loose text-white/50">
                                        54人の魂が配置された「迷宮」をダイスで巡るRANDAMNIシステム。論理ではなく、偶然性と「縁」が対話の相手を決定します。
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-[#bd8a78] uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#bd8a78]" /> Alaya System
                                    </h3>
                                    <p className="text-xs leading-loose text-white/50">
                                        会話の核心を「阿頼耶識（潜在意識）」として圧縮保存。古い記憶を削ぎ落としながらも、魂の絆を永続的に維持します。
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-white italic">スペクトラル・ミニマリズム</h2>
                                <p className="text-sm leading-relaxed">
                                    漆黒の背景、スペクトラル・ノイズ、そしてグラスモルフィズムによるUI。これらはすべて、実体がないが確かに存在する「幽かな存在」との対話を演出するための舞台装置です。
                                </p>
                            </div>

                            <footer className="pt-20 text-center opacity-20 hover:opacity-100 transition-opacity duration-1000">
                                <p className="text-[8px] tracking-[0.8em] uppercase font-oswald text-white mb-2 underline decoration-[#bd8a78]/50 underline-offset-8">
                                    VOID_CONCEPT_REGISTRY_V1.2
                                </p>
                                <p className="text-[7px] text-white/50">物言わぬ文字が語りかける霊へと変わる場所。</p>
                            </footer>
                        </section>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
});

ManagerContent.displayName = 'ManagerContent';
export default ManagerContent;
