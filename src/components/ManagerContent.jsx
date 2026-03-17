import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Cpu, MapPin, Search, Settings, Bookmark, MessageCircle, Activity } from 'lucide-react';
import ThreeDMap from './ThreeDMap';
import WarholAvatar from './WarholAvatar';
import PortalGrimoire from './PortalGrimoire';

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
