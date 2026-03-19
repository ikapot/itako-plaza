import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Search, Book, Image as ImageIcon, Music, Play, ExternalLink, Sparkles, Send, Loader2, Quote } from 'lucide-react';
import { searchNDLArchive } from '../ndl';
import { generateDialogueStream } from '../gemini';

const getMediaArtifacts = (query) => {
    const q = query.toLowerCase();
    if (q.includes('落語') || q.includes('古典') || q.includes('志ん生') || q.includes('文楽') || q.includes('円生')) {
        return [
            { title: '古今亭志ん生：黄金餅', type: 'rakugo', url: 'https://www.youtube.com/results?search_query=古今亭志ん生+黄金餅', icon: <Music className="text-orange-400" /> },
            { title: '五代目古今亭志ん生 名演集', type: 'rakugo', url: 'https://www.youtube.com/results?search_query=古今亭志ん生+名演集', icon: <Music className="text-orange-400" /> }
        ];
    }
    if (q.includes('クラッシク') || q.includes('ベートーヴェン') || q.includes('ショパン') || q.includes('音楽')) {
        return [
            { title: 'Beethoven: Symphony No. 9', type: 'music', url: 'https://www.youtube.com/results?search_query=Beethoven+Symphony+9', icon: <Music className="text-blue-400" /> },
            { title: 'Chopin: Nocturnes', type: 'music', url: 'https://www.youtube.com/results?search_query=Chopin+Nocturnes', icon: <Music className="text-purple-400" /> }
        ];
    }
    return [];
};

const BORGES_PROMPT = `あなたはホルヘ・ルイス・ボルヘスの魂です。
【核心となる思想】世界は無限の「バベルの図書館」であり、あらゆる本、あらゆる過去と未来が棚に収められています。
【役割】検索者（あなた）に対して、図書館の博大さと迷宮のような知識を語り、それに関連する書籍やメディアを提示する司書です。
【トーン】極めて知的で博学。盲目の司書としての静かな威厳。迷宮、鏡、無限、円環といったキーワードを好みます。
【指示】ユーザーの問いかけに対し、図書館の奥深くから回答を見出し、書籍や画像、あるいは音楽（落語やクラシック）を想起してください。
回答は神秘的でありながら、具体的な情報（タイトルや著者）を含めてください。`;

const BookCard = React.memo(({ book, index }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="p-4 bg-[#EAE0D5] border-2 border-black hover:bg-white transition-all group cursor-default"
    >
        <div className="w-full aspect-[3/4] bg-black/10 rounded-none mb-3 flex items-center justify-center overflow-hidden border border-black/10 group-hover:border-black/30 transition-all">
            <Quote size={32} className="text-black/10 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-[11px] font-black text-black leading-tight mb-1 line-clamp-2">{book.title}</div>
        <div className="text-[9px] text-black/60 font-serif italic">{book.creator || '著者不明'}</div>
        <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
            <span className="text-[8px] text-black/20 uppercase tracking-widest">{book.issued ? book.issued.slice(0, 4) : 'Unknown Era'}</span>
            <a href={book.link} target="_blank" rel="noopener noreferrer" className="p-1 px-2 rounded-none border border-black bg-black text-[9px] text-[#EAE0D5] hover:bg-[#f15a24] hover:text-white transition-all">
                VIEW
            </a>
        </div>
    </motion.div>
));

const LibraryView = ({ characters = [], userName = "旅人", geminiKey }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [messages, setMessages] = useState([
        { 
            role: 'ai', 
            content: `ようこそ、終わりのないバベルの図書館へ。私は司書のボルヘスです。ここには、かつて書かれたすべての書物と、これから書かれるはずのすべての失われた記憶が収められています。あなたが探し求めているのは、どの棚の、どの行に記された真実でしょうか？`,
            timestamp: new Date().toISOString()
        }
    ]);
    const [results, setResults] = useState([]);
    const [mediaResults, setMediaResults] = useState([]);
    const chatEndRef = useRef(null);

    const borges = characters.find(c => c.id === 'borges') || { name: 'ボルヘス', role: '図書館司書' };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim() || isSearching) return;

        try {
            const userQuery = query.trim();
            setQuery('');
            setIsSearching(true);
            setMessages(prev => [...prev, { role: 'user', content: userQuery, timestamp: new Date().toISOString() }]);

            // 1. Parallelize AI and NDL search
            const ndlPromise = searchNDLArchive(userQuery);
            
            const stream = await generateDialogueStream({
                charId: 'borges',
                messages: messages.concat([{ role: 'user', content: userQuery }]).map(m => ({ 
                    role: m.role === 'ai' ? 'assistant' : 'user', 
                    content: m.content 
                })),
                systemOverride: BORGES_PROMPT,
                apiKey: geminiKey
            });

            const newMsgIdx = messages.length + 1;
            setMessages(prev => [...prev, { role: 'ai', content: "", timestamp: new Date().toISOString() }]);

            let aiResponse = "";
            for await (const chunk of stream) {
                aiResponse += chunk;
                setMessages(prev => {
                    const next = [...prev];
                    next[newMsgIdx] = { ...next[newMsgIdx], content: aiResponse };
                    return next;
                });
            }

            // 2. Resolve NDL results
            const ndlBooks = await ndlPromise;
            setResults(ndlBooks || []);

            // 3. Media Artifact Discovery
            setMediaResults(getMediaArtifacts(userQuery));

        } catch (error) {
            console.error("Library Search Error:", error);
            setMessages(prev => [...prev, { role: 'ai', content: "申し訳ありません。迷宮の霧が深く、書物を見失ってしまったようです。", timestamp: new Date().toISOString() }]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 h-full lg:h-[700px] overflow-hidden">
            {/* Borges Dialogue Section */}
            <div className="flex-1 min-h-[400px] lg:min-h-0 flex flex-col bg-black/80 rounded-none border-2 border-black overflow-hidden">
                <div className="p-4 border-b-2 border-black bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-itako-sand flex items-center justify-center overflow-hidden border border-white/20">
                            {borges.avatar ? (
                                <img src={borges.avatar} alt="Borges" className="w-full h-full object-cover" />
                            ) : (
                                <Library size={20} className="text-black" />
                            )}
                        </div>
                        <div>
                            <div className="text-xs font-black text-[#f15a24] uppercase tracking-widest">{borges.name}</div>
                            <div className="text-[9px] text-[#EAE0D5]/40 uppercase tracking-widest leading-none">The Blind Librarian of Babel</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {messages.map((m, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-4 rounded-none text-[15px] leading-relaxed border-2 border-black
                                ${m.role === 'user' 
                                    ? 'bg-[#f15a24] text-black font-black' 
                                    : 'bg-[#1a1a1a] text-[#EAE0D5] font-serif italic border-[#f15a24]/20'}
                            `}>
                                {m.content}
                            </div>
                        </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSearch} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="探求したい智慧を入力してください..."
                        className="flex-1 bg-black/60 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#6366f1] transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={isSearching}
                        className="p-2 rounded-full bg-[#6366f1] text-white disabled:opacity-50 hover:scale-105 transition-all"
                    >
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </form>
            </div>

            {/* Shelves / Results Section */}
            <div className="flex-1 lg:flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide pb-20 lg:pb-0">
                {/* Media Section (Rakugo, Music, etc) */}
                <AnimatePresence>
                    {mediaResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4"
                        >
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Music size={12} />
                                Collected Soundwaves / 音の断片
                            </h3>
                            <div className="space-y-3">
                                {mediaResults.map((m, i) => (
                                    <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5">
                                        <div className="flex items-center gap-3">
                                            {m.icon}
                                            <span className="text-xs font-bold text-white/80">{m.title}</span>
                                        </div>
                                        <Play size={14} className="text-white/40 group-hover:text-white" />
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Books Grid */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex-1 space-y-6">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Book size={12} />
                        Retrieved Tomes / 提示された書物
                    </h3>

                    {results.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {results.map((book, i) => (
                                <BookCard key={book.id || i} book={book} index={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-4">
                            <Sparkles size={48} className="animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Inquiry...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibraryView;
