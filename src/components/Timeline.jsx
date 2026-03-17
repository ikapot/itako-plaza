import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import SpiritCard from './SpiritCard';
import WarholAvatar from './WarholAvatar';

// ── Performance-Critical Sub Components ────────────────────────

const MemoizedEchoItem = React.memo(function EchoItem({ e, accentColor }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
                opacity: [0, 0.08, 0],
                y: [-100, -300],
                scale: [0.9, 1.1]
            }}
            transition={{ 
                duration: e.duration, 
                repeat: Infinity, 
                delay: e.delay,
                ease: "linear"
            }}
            className="absolute text-[8px] md:text-[10px] font-serif italic tracking-widest whitespace-nowrap"
            style={{ left: `${e.x}%`, top: `${e.y}%`, color: accentColor }}
        >
            {e.text}
        </motion.div>
    );
});

const DialogueEcho = React.memo(function DialogueEcho({ messages, accentColor }) {
    const echos = useMemo(() => {
        return messages.slice(0, -1).slice(-15).map((m, i) => ({
            id: i,
            text: m.content.slice(0, 40) + (m.content.length > 40 ? '...' : ''),
            x: 10 + Math.random() * 80,
            y: 20 + Math.random() * 60,
            duration: 20 + Math.random() * 40,
            delay: Math.random() * 10,
        }));
    }, [messages]);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
            {echos.map(function renderEcho(e) {
                return <MemoizedEchoItem key={e.id} e={e} accentColor={accentColor} />;
            })}
        </div>
    );
});

const MemoizedNewsItem = React.memo(function NewsItem({ n, charMap }) {
    return (
        <div className="mb-12">
            <SpiritCard
                title={n.title}
                content={n.content}
                author="Soseki Natsume"
                portraitUrl="assets/soseki_warhol.png"
                isPreStyled={true}
                flavor="Narrator"
                colorClass="bg-white/5 text-inherit border-white/10"
            />
            <div className="space-y-[-2rem] mt-[-2rem] relative z-20">
                {n.discussion ? n.discussion.map(function renderComment(d, dIdx) {
                    const char = charMap[d.charId];
                    return (
                        <motion.div
                            key={`${n.id}-${dIdx}`}
                            initial={{ opacity: 0, x: dIdx % 2 === 0 ? 20 : -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className={`flex ${dIdx % 2 === 0 ? 'justify-end' : 'justify-start'} w-full`}
                        >
                            <div className={`p-6 md:p-8 rounded-[35px] border shadow-2xl max-w-[85%] glass-ethereal spiritual-float ${dIdx % 2 === 0 ? 'border-white/10' : 'border-white/5'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    {char ? <WarholAvatar src={char.avatar} size="w-6 h-6" isSelected isPreStyled={char.isPreStyled} colorClass={char.color} /> : null}
                                    <span className="text-[9px] font-bold tracking-[0.3em] text-white/40 uppercase">{char?.name || d.charId}</span>
                                </div>
                                <p className="text-sm md:text-base leading-relaxed text-white/90 font-serif italic">「{d.comment}」</p>
                            </div>
                        </motion.div>
                    );
                }) : null}
            </div>
        </div>
    );
});

const MemoizedMessageItem = React.memo(function MessageItem({ m, i, isUser, charObj, handleBookmark }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
        >
            <div className={`group relative p-6 md:p-8 rounded-[35px] transition-all duration-1000 max-w-[95%] md:max-w-[85%] glass-ethereal ${isUser ? 'border-white/10' : 'border-white/5 spiritual-float'}`}>
                {!isUser ? (
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                            {charObj ? <WarholAvatar src={charObj.avatar} colorClass={charObj.color} size="w-6 h-6" isSelected isPreStyled={charObj.isPreStyled} /> : null}
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30">{charObj?.name || m.charId}</span>
                        </div>
                    </div>
                ) : null}
                <p className={`text-base md:text-lg leading-relaxed text-white/70 ${!isUser ? 'font-serif' : 'font-sans'}`}>
                    {m.content}
                </p>
                {!isUser ? (
                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={function bookmark() { handleBookmark?.(i); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold text-white/20 uppercase tracking-widest hover:bg-[#bd8a78]/20 hover:text-[#bd8a78] transition-all group/btn"
                        >
                            <Bookmark size={10} className="group-hover/btn:fill-current" />
                            栞を挟む
                        </button>
                    </div>
                ) : null}
            </div>
        </motion.div>
    );
});

// ── Main Component ──────────────────────────────────────────────

const Timeline = React.memo(function Timeline({
    scrollRef,
    handleScroll,
    news,
    characters,
    currentWorldEvent,
    isUnderground,
    setIsUnderground,
    userName,
    messages,
    loading,
    handleBookmark,
    globalTrends,
    setShowNotebookModal,
    futureSelfCritique,
    archives,
    globalSentiment = 'neutral',
}) {
    const sentimentAccents = {
        neutral: 'rgba(255,255,255,0.4)',
        serene: 'rgba(0,255,255,0.4)',
        agitated: 'rgba(255,0,0,0.4)',
        melancholic: 'rgba(79,70,229,0.4)',
        joyful: 'rgba(245,158,11,0.4)',
        chaotic: 'rgba(217,70,239,0.4)',
    };
    const accentColor = sentimentAccents[globalSentiment] || sentimentAccents.neutral;

    const charMap = useMemo(function buildCharMap() {
        return characters.reduce(function reducer(acc, char) {
            acc[char.id] = char;
            return acc;
        }, {});
    }, [characters]);

    return (
        <main
            ref={scrollRef}
            onScroll={handleScroll}
            className="timeline-container flex-1 itako-scrollbar"
        >
            <DialogueEcho messages={messages} accentColor={accentColor} />
            
            {/* Slot 1: News */}
            <section className="timeline-slot p-6 md:p-12 overflow-y-auto bg-transparent editorial-grid flex flex-col items-start pt-20 md:pt-32">
                <div className="max-w-2xl mx-auto w-full pb-80 md:pb-96">
                    <header className="flex flex-col gap-2 mb-12 md:mb-16 px-2 md:px-4">
                        <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none font-oswald uppercase" style={{ color: '#2a2a2a' }}>News</h2>
                        <p className="text-xs md:text-sm font-bold text-zinc-800/40 pl-1 tracking-[0.5em] uppercase font-oswald">霊感ニュース</p>
                    </header>

                    <div className="flex items-center justify-between mb-8 md:mb-12 px-2 border-b border-white/5 pb-4">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] font-oswald">DRIPPING NOISE ({news.length})</span>
                    </div>

                    {news.map(function renderNews(n) {
                        return <MemoizedNewsItem key={n.id} n={n} charMap={charMap} />;
                    })}
                </div>
            </section>

            {/* Slot 2: Main Dialog */}
            <section className="timeline-slot p-6 md:p-12 overflow-y-auto bg-transparent editorial-grid flex flex-col items-start pt-20 md:pt-32">
                <div className="max-w-2xl mx-auto w-full min-h-full flex flex-col pb-80 md:pb-96">
                    <AnimatePresence>
                        {currentWorldEvent ? (function renderEvent() {
                            const eventConfig = {
                                war: { bg: 'bg-red-950/40 text-red-100', dot: 'bg-red-500' },
                                earthquake: { bg: 'bg-amber-950/40 text-amber-100', dot: 'bg-amber-500' }
                            };
                            const config = eventConfig[currentWorldEvent.type] || { bg: 'bg-white/5 text-white/50', dot: 'bg-white/30' };
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 1.1, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className={`mb-6 p-4 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3 transition-colors duration-1000 ${config.bg} absolute -top-16 left-0 right-0 z-50`}
                                >
                                    <div className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${config.dot}`} />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[8px] font-black tracking-[0.2em] uppercase opacity-40 mb-1">Anomaly Log / 歴史の震動</span>
                                        <span className="text-xs md:text-sm font-medium tracking-wider">{currentWorldEvent.content}</span>
                                    </div>
                                </motion.div>
                            );
                        })() : null}
                    </AnimatePresence>

                    <header className="flex flex-col gap-2 mb-12 md:mb-16 px-2 md:px-4 relative">
                        <div className="flex items-center justify-between">
                            <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none font-oswald uppercase" style={{ color: '#2a2a2a' }}>Dialog</h2>
                            <button
                                onClick={function toggleUnderground() { setIsUnderground(!isUnderground); }}
                                className={`px-4 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all border font-oswald ${isUnderground ? 'bg-white text-[#1a1a1a] border-white' : 'bg-transparent text-white/40 border-white/10 hover:border-white/20'}`}
                            >
                                {isUnderground ? 'Surface' : 'Deep Trace'}
                            </button>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-zinc-800/40 pl-1 tracking-[0.5em] uppercase font-oswald truncate">{userName} /Speaking</p>
                    </header>

                    <div className="flex-1 flex flex-col gap-8 mt-4">
                        <div className="space-y-8 px-2 pb-80 md:pb-96">
                            {messages.map(function renderMessage(m, i) {
                                return (
                                    <MemoizedMessageItem 
                                        key={i} 
                                        m={m} 
                                        i={i} 
                                        isUser={m.role === 'user'} 
                                        charObj={charMap[m.charId]} 
                                        handleBookmark={handleBookmark} 
                                    />
                                );
                            })}
                            
                            {loading ? (
                                <div className="flex items-center gap-4 text-white/20 text-[10px] font-bold tracking-[0.4em] uppercase px-4 animate-pulse">
                                    Channeling spirit...
                                </div>
                            ) : null}
                            <div className="h-64" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Slot 3: Trends */}
            <section className="timeline-slot p-6 md:p-12 overflow-y-auto bg-transparent editorial-grid flex flex-col items-start pt-20 md:pt-32">
                <div className="max-w-2xl mx-auto w-full pb-80 md:pb-96">
                    <header className="flex flex-col gap-2 mb-12 md:mb-16 px-2 md:px-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none font-oswald uppercase" style={{ color: '#2a2a2a' }}>Trends</h2>
                            <button
                                onClick={function sync() { setShowNotebookModal(true); }}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-[#bd8a78] uppercase"
                            >
                                /sync
                            </button>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-zinc-800/40 pl-1 tracking-[0.5em] uppercase font-oswald">思考の潮流</p>
                    </header>

                    <div className="space-y-12">
                        {globalTrends ? (
                            <div className="glass-ethereal p-8 rounded-3xl border border-white/10 spiritual-float">
                                <p className="text-xl font-serif text-white/90 leading-relaxed mb-6">
                                    {globalTrends.summary}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {globalTrends.keywords.map(function renderKw(kw, i) {
                                        return (
                                            <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/50 border border-white/5">
                                                #{kw}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                        
                        <div className="p-10 rounded-[50px] bg-white/5 border border-white/10 shadow-2xl">
                            <h3 className="text-3xl font-bold text-white tracking-tighter leading-tight">
                                {futureSelfCritique || "潮流を待つ..."}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {archives.map(function renderArchive(c, idx) {
                                return (
                                    <div key={idx} className="p-8 bg-white/5 border border-white/10 rounded-[40px]">
                                        <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">{c.author}</div>
                                        <div className="text-lg font-bold text-white/80 leading-tight mb-2">{c.title}</div>
                                        <p className="text-xs text-white/40 italic font-serif">"{c.quote}"</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
});

export default Timeline;
