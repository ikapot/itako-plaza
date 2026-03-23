import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, ChevronRight, Reply, Repeat, TrendingUp, MessageSquare, Info } from 'lucide-react';
import SpiritCard from './SpiritCard';
import WarholAvatar from './WarholAvatar';

// ── Performance-Critical Sub Components ────────────────────────

const MemoizedEchoItem = React.memo(function EchoItem({ e }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
                opacity: [0, 0.1, 0],
                y: [-100, -300],
                scale: [0.9, 1.1]
            }}
            transition={{ 
                duration: e.duration, 
                repeat: Infinity, 
                delay: e.delay,
                ease: "linear"
            }}
            className="absolute text-[8px] md:text-[10px] font-serif italic tracking-widest whitespace-nowrap pr-2"
            style={{ left: `${e.x}%`, top: `${e.y}%`, color: '#b45309' }}
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

const SpectralBookCover = React.memo(function BookCover({ title, author, idx }) {
    const gradients = [
        'from-zinc-900 to-indigo-950',
        'from-zinc-900 to-red-950',
        'from-zinc-900 to-emerald-950',
        'from-zinc-900 to-amber-950',
        'from-zinc-900 to-purple-950'
    ];
    const gradient = gradients[idx % gradients.length];
    
    return (
        <div className={`shrink-0 w-24 h-36 md:w-32 md:h-48 bg-gradient-to-br ${gradient} border border-white/10 rounded-sm shadow-2xl relative overflow-hidden flex flex-col p-2 md:p-4 group-hover:scale-105 transition-transform duration-700`}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
                <div className="editorial-grid w-full h-full scale-150" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="space-y-1">
                    <div className="w-4 h-0.5 bg-white/20 mb-2" />
                    <h5 className="text-[6px] md:text-[8px] font-black leading-tight text-white/90 line-clamp-4 font-oswald uppercase">
                        {title}
                    </h5>
                </div>
                <div className="text-right">
                    <span className="text-[5px] md:text-[7px] font-bold text-white/30 uppercase tracking-tighter">
                        {author?.substring(0, 15)}
                    </span>
                </div>
            </div>
            {/* Spine detail */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/40 border-r border-white/5" />
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
                colorClass="bg-[#EAE0D5] text-black"
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
                            <div className={`p-4 md:p-8 rounded-none border-2 border-black max-w-[90%] md:max-w-[85%] bg-black/80 text-[#EAE0D5]`}>
                                <div className="flex items-center gap-3 mb-3">
                                    {char ? <WarholAvatar src={char.avatar} size="w-6 h-6" isSelected isPreStyled={char.isPreStyled} colorClass={char.color} /> : null}
                                    <span className="text-[9px] font-black tracking-[0.3em] text-[#f15a24] uppercase">{char?.name || d.charId}</span>
                                </div>
                                <p className="text-sm md:text-base leading-relaxed font-serif italic">「{d.comment}」</p>
                            </div>
                        </motion.div>
                    );
                }) : null}
            </div>
        </div>
    );
});

const MemoizedMessageItem = React.memo(function MessageItem({ m, i, isUser, charObj, handleBookmark, handleReply }) {
    if (charObj?.id === 'narrator' || m.charId === 'narrator') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full text-center py-6 md:py-10 px-4 my-2"
            >
                <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
                    <div className="w-12 h-[1px] bg-[#bd8a78]/30" />
                    <p className="text-sm md:text-base leading-relaxed text-[#bd8a78]/90 font-serif italic tracking-[0.2em] whitespace-pre-wrap py-2">
                        {m.content.replace(/^\[narration\]\s*/i, '').replace(/^【ナレーション】\s*/i, '')}
                    </p>
                    <div className="w-12 h-[1px] bg-[#bd8a78]/30" />
                </div>
            </motion.div>
        );
    }
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2 message-item`}
        >
            {/* Minimal Header */}
            {(!isUser && charObj) ? (
                <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-black text-[#f15a24] uppercase tracking-widest">{charObj.name}</span>
                    <span className="text-[8px] text-[#EAE0D5]/20 uppercase tracking-widest">/ {charObj.role || 'SPECTER'}</span>
                </div>
            ) : null}

            <div className={`relative p-4 md:p-6 octagon transition-all duration-300 max-w-[90%] md:max-w-[80%] ${
                isUser 
                    ? 'bg-[#f15a24] text-black font-black text-sm md:text-base selection:bg-black selection:text-[#f15a24]' 
                    : 'bg-[#EAE0D5]/10 text-[#EAE0D5] border border-white/5 font-serif italic text-sm md:text-base selection:bg-[#f15a24] selection:text-black'
            }`}>
                {/* Sentiment Tag */}
                {(!isUser && m.sentiment) ? (
                    <div className="absolute -top-3 left-4 px-2 py-0.5 bg-black border border-black text-[7px] font-black uppercase tracking-tighter text-[#f15a24]/60">
                        ESTIMATED_STATE: {m.sentiment}
                    </div>
                ) : null}

                <p className="leading-relaxed whitespace-pre-wrap">
                    {m.content}
                </p>

                {/* Interaction Buttons (Subtle - only visible on hover or mobile) */}
                <div className={`mt-4 pt-3 border-t border-black/10 flex items-center gap-4 opacity-40 hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <motion.button 
                        onClick={() => handleBookmark?.(m)} 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 hover:text-amber-500 transition-colors duration-200 cursor-pointer"
                    >
                        <Bookmark size={10} />
                        <span className="text-[7px] font-black uppercase tracking-tighter">Bookmark</span>
                    </motion.button>
                    {!isUser && (
                        <motion.button 
                            onClick={() => handleReply?.(m)} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 hover:text-[#f15a24] transition-colors duration-200 cursor-pointer"
                        >
                            <Repeat size={10} />
                            <span className="text-[7px] font-black uppercase tracking-tighter">Echo / Reply</span>
                        </motion.button>
                    )}
                </div>
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
    handleReply,
    globalTrends,
    setShowNotebookModal,
    futureSelfCritique,
    archives,
    globalSentiment = 'neutral',
}) {
    const transcriptScrollRef = useRef(null);

    // 会話更新時に最下部へスクロール、または最新メッセージを中央に寄せる
    useEffect(() => {
        if (transcriptScrollRef.current && messages.length > 0) {
            // 少し遅延をおいて要素がレンダリングされるのを待つ
            setTimeout(() => {
                const messageElements = transcriptScrollRef.current.querySelectorAll('.message-item');
                const lastMessage = messageElements[messageElements.length - 1];
                if (lastMessage) {
                    lastMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [messages, loading]);

    const sentimentAccents = {
        neutral: 'rgba(255,255,255,0.4)',
        serene: 'rgba(0,255,255,0.4)',
        agitated: 'rgba(255,0,0,0.4)',
        melancholic: 'rgba(79,70,229,0.4)',
        joyful: 'rgba(245,158,11,0.4)',
        chaotic: 'rgba(217,70,239,0.4)',
    };
    const accentColor = sentimentAccents[globalSentiment] || sentimentAccents.neutral;

    const charMap = useMemo(() => {
        const map = {};
        for (const char of characters) {
            map[char.id] = char;
        }
        return map;
    }, [characters]);

    return (
        <main
            ref={scrollRef}
            onScroll={handleScroll}
            className="timeline-container flex-1 itako-scrollbar snap-x snap-mandatory"
        >
            <DialogueEcho messages={messages} accentColor={accentColor} />
            
            {/* Slot 1: News Terminal */}
            <section className="timeline-slot p-2 md:p-6 overflow-y-auto bg-transparent pt-16 md:pt-32 snap-center">
                <div className="max-w-3xl mx-auto w-full pb-20">
                    <div className="bg-black/80 border-2 border-black itako-outline overflow-hidden">
                        {/* Terminal Header */}
                        <div className="p-3 md:p-4 border-b-2 border-black bg-black/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp size={16} className="text-[#f15a24]" />
                                <div>
                                    <div className="text-[10px] font-black text-[#f15a24] uppercase tracking-widest leading-none">News Manifestation Feed</div>
                                    <div className="text-[8px] text-[#EAE0D5]/40 uppercase tracking-widest mt-0.5">Station ID: ITAKO_P_NET_01</div>
                                </div>
                            </div>
                            <div className="text-[8px] font-bold text-[#EAE0D5]/20 tracking-widest uppercase">{news.length} ENTRIES RECEIVED</div>
                        </div>

                        {/* Content */}
                        <div className="p-3 md:p-10 space-y-8 md:space-y-12">
                            {news.map(function renderNews(n) {
                                return <MemoizedNewsItem key={n.id} n={n} charMap={charMap} />;
                            })}
                        </div>
                    </div>
                </div>
            </section>
             {/* Slot 2: Main Dialog Terminal */}
            <section 
                ref={transcriptScrollRef}
                className="timeline-slot p-2 md:p-6 overflow-y-auto bg-transparent pt-14 md:pt-20 scroll-smooth snap-center"
            >
                <div className="max-w-3xl mx-auto w-full pb-64 md:pb-96">
                    {/* Event Anomaly Floating Banner */}
                    <AnimatePresence>
                        {currentWorldEvent ? (function renderEvent() {
                            const eventConfig = {
                                war: { bg: 'bg-red-950/40 text-red-100', dot: 'bg-red-500' },
                                earthquake: { bg: 'bg-amber-950/40 text-amber-100', dot: 'bg-amber-500' }
                            };
                            const config = eventConfig[currentWorldEvent.type] || { bg: 'bg-black/90 text-white/50', dot: 'bg-white/30' };
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 1.1, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className={`mb-4 p-4 border-2 border-black flex items-center gap-3 ${config.bg} backdrop-blur-md sticky top-0 z-[60]`}
                                >
                                    <div className={`w-2 h-2 rounded-none animate-pulse flex-shrink-0 ${config.dot}`} />
                                    <div className="flex-1 flex flex-col">
                                        <span className="text-[8px] font-black tracking-[0.2em] uppercase text-[#f15a24] mb-0.5">Anomaly Focus / 重要事変</span>
                                        <span className="text-xs font-bold tracking-wider">{currentWorldEvent.content}</span>
                                    </div>
                                </motion.div>
                            );
                        })() : null}
                    </AnimatePresence>

                    <div className="bg-black/40 border-2 border-black itako-outline overflow-hidden min-h-[600px] flex flex-col backdrop-blur-sm">
                        {/* Terminal Header */}
                        <div className="p-3 md:p-4 border-b-2 border-black bg-black/40 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-50">
                            <div className="flex items-center gap-2 md:gap-3">
                                <MessageSquare size={16} className="text-[#f15a24]" />
                                <div>
                                    <div className="text-[9px] md:text-[10px] font-black text-[#f15a24] uppercase tracking-widest leading-none">Transcripts</div>
                                    <div className="text-[7px] md:text-[8px] text-[#EAE0D5]/40 uppercase tracking-widest mt-0.5">Session: {userName || 'GUEST'}</div>
                                </div>
                            </div>
                            <button
                                onClick={function toggleUnderground() { setIsUnderground(!isUnderground); }}
                                className={`px-4 py-1.5 border-2 border-black text-[9px] font-black tracking-widest uppercase transition-all font-oswald ${isUnderground ? 'bg-[#f15a24] text-black shadow-none' : 'bg-transparent text-[#EAE0D5]/40 hover:text-[#f15a24]'}`}
                            >
                                {isUnderground ? 'Surface Mode' : 'Deep Trace'}
                            </button>
                        </div>

                        {/* Transcript Body */}
                        <div className="flex-1 p-4 md:p-8 space-y-12">
                            {messages.map(function renderMessage(m, i) {
                                return (
                                    <MemoizedMessageItem 
                                        key={i} 
                                        m={m} 
                                        i={i} 
                                        isUser={m.role === 'user'} 
                                        charObj={charMap[m.charId]} 
                                        handleBookmark={handleBookmark} 
                                        handleReply={handleReply}
                                    />
                                );
                            })}
                            
                            {loading ? (
                                <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase px-4 animate-pulse">
                                    Channeling spirit...
                                </div>
                            ) : null}
                            <div className="h-64" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Slot 3: Library (Archives) */}
            <section className="timeline-slot p-4 md:p-12 overflow-y-auto bg-transparent editorial-grid flex flex-col items-start pt-16 md:pt-32 snap-center">
                <div className="max-w-2xl mx-auto w-full pb-64 md:pb-96">
                    <header className="flex flex-col gap-2 mb-8 md:mb-20 px-2 md:px-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] py-4 font-oswald uppercase break-all w-full pr-4" style={{ color: '#2a2a2a' }}>LIBRARY</h2>
                            <div className="flex items-center gap-4">
                                <motion.button
                                    onClick={function sync() { setShowNotebookModal(true); }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-[#bd8a78] uppercase hover:bg-white/10 transition-colors duration-200 font-oswald cursor-pointer"
                                >
                                    /sync
                                </motion.button>
                            </div>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-zinc-500 pl-1 tracking-[0.5em] uppercase font-biz-mincho -mt-2">思考と記録の書架</p>
                    </header>

                    <div className="space-y-16">
                        {globalTrends ? (
                            <div className="glass-ethereal p-10 rounded-[40px] border border-white/10 spiritual-float relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#bd8a78]/40 to-transparent" />
                                <span className="text-[10px] font-black text-[#bd8a78] tracking-[0.4em] uppercase mb-4 block">Current Sentiment Arc</span>
                                <p className="text-2xl font-serif text-white/90 leading-relaxed mb-8 italic">
                                    「{globalTrends.summary}」
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {globalTrends.keywords.map(function renderKw(kw, i) {
                                        return (
                                            <span key={i} className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-white/40 border border-white/5 hover:text-[#bd8a78] transition-colors cursor-default">
                                                #{kw}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                        
                        <div className="relative">
                            <div className="absolute -left-6 top-0 bottom-0 w-px bg-white/5" />
                            <h3 className="text-[10px] font-black tracking-[0.5em] text-white/40 uppercase mb-8 pl-4">Archives curated from NDL</h3>
                            
                            <div className="grid grid-cols-1 gap-6 pl-4">
                                {archives.map(function renderArchive(c, idx) {
                                    return (
                                        <motion.a
                                            href={c.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group block p-8 bg-white/[0.02] border border-white/5 rounded-[40px] hover:bg-white/[0.05] hover:border-[#bd8a78]/30 transition-all duration-500 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                                                <Bookmark size={48} className="text-[#bd8a78]" />
                                            </div>
                                            
                                            <div className="flex flex-row gap-6 md:gap-8">
                                                <SpectralBookCover title={c.title} author={c.author} idx={idx} />
                                                
                                                <div className="flex-1 flex flex-col justify-center gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1 h-8 bg-[#bd8a78]/40 group-hover:h-12 transition-all duration-500" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-[#bd8a78] uppercase tracking-[0.3em] mb-1">{c.author}</span>
                                                            <h4 className="text-lg md:text-xl font-bold text-white/90 leading-snug group-hover:text-white transition-colors line-clamp-2">{c.title}</h4>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="hidden md:block text-sm text-white/40 italic font-serif leading-relaxed line-clamp-2 pl-4">
                                                        {c.quote}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between mt-2 pl-0 md:pl-4">
                                                        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest group-hover:text-[#bd8a78]/50 transition-colors">
                                                            {c.year || 'Deep Archive'} / NDL
                                                        </span>
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-[#bd8a78]/0 group-hover:text-[#bd8a78]/60 transition-all tracking-[0.2em] uppercase">
                                                            <span>Open Archive</span>
                                                            <ChevronRight size={12} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.a>
                                    );
                                })}
                                {archives.length === 0 && (
                                    <div className="py-20 text-center border border-dashed border-white/5 rounded-[40px]">
                                        <p className="text-[10px] text-white/40 italic tracking-widest uppercase">書架は静寂に包まれています。</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-12 rounded-[60px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 text-6xl font-black text-white/[0.02] select-none font-oswald uppercase">CRITIQUE</div>
                           <h4 className="text-[9px] font-black text-[#f15a24] tracking-[0.4em] uppercase mb-6 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-[#f15a24] animate-pulse" />
                               Future Self Echo / 2036
                           </h4>
                           <p className="text-2xl md:text-3xl font-bold text-white/80 tracking-tighter leading-tight relative z-10">
                               {futureSelfCritique || "潮流が定着するのを待っています..."}
                           </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
});

export default Timeline;
