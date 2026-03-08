import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, TrendingUp, BookOpen, User, MapPin, Ghost, Settings, Loader2, Quote } from 'lucide-react';
import { auth, fetchBookmarks, saveBookmark } from './firebase';
import { generateCharacterResponse, evaluateFutureSelf } from './gemini';
import { fetchFictionalizedNews, generateIchikawaScolding } from './news';
import { searchNDLArchive } from './ndl';
import Header from './components/Header';
import LandingPage from './components/LandingPage';

// --- 初期データ ---
const INITIAL_CHARACTERS = [
  { id: 'soseki', name: '夏目漱石', flavor: '胃痛', description: '「私は胃が痛いのだ。」', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NS' },
  { id: 'dosto', name: 'ドストエフスキー', flavor: '借金', description: '「ルーレットさえあれば…」', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=FD' },
  { id: 'ichikawa', name: '市川房枝', flavor: '厳格', description: '「権利は、自ら勝ち取るものです。」', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=IF' },
  { id: 'atsuko', name: 'Atsuko', flavor: '見守り', description: '「ずっと、見ていますよ。」', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AT' },
  { id: 'k_kokoro', name: 'K (こころ)', flavor: '絶望', description: '「精進の道は、厳しいものです。」', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=KK' },
  { id: 'alyosha', name: 'アリョーシャ', flavor: '信仰', description: '「愛は、すべてを救うと信じています。」', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AK' },
];

const INITIAL_LOCATIONS = [
  { id: 'cafe', name: 'カフェ', icon: <MapPin size={16} /> },
  { id: 'library', name: '図書館', icon: <MapPin size={16} /> },
  { id: 'passage', name: '地下通路', icon: <MapPin size={16} /> },
];

const INITIAL_TRENDS = [
  { id: 1, title: '雨が降る、それだけで十分だ', content: '柴田元幸的な乾いたトーン。誰かが傘を忘れた。誰も取りに来ない。' },
  { id: 2, title: '昨日の事件：静かなる消失', content: '公園の時計が2分遅れていた。管理人は何も言わない。' },
];

const INITIAL_CLASSICS = [
  { id: 1, author: 'Soseki', quote: '「月が綺麗ですね」と言ったのは、私だっただろうか。', ref: '三四郎より' },
  { id: 2, author: 'Dostoevsky', quote: '地獄とは何か？それは、もはや愛することができないという苦しみだ。', ref: 'カラマーゾフの兄弟より' },
];

// --- コンポーネント ---

const SpiritCard = ({ title, content, author, flavor, timestamp }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -4, borderColor: "rgba(255, 140, 0, 0.4)" }}
    className="relative p-8 rounded-sm bg-[#0a0a0a]/40 backdrop-blur-md border border-white/5 mb-6 transition-all duration-500 overflow-hidden group"
  >
    {/* Spiritual Gradient Flare */}
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-itako-orange/5 blur-3xl rounded-full group-hover:bg-itako-orange/10 transition-colors" />

    <div className="relative z-10">
      {author && (
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-itako-orange">{author}</span>
            {flavor && <span className="text-[8px] text-white/30 border border-white/10 px-2 py-0.5 rounded-full uppercase">{flavor}</span>}
          </div>
          {timestamp && <span className="text-[8px] text-white/20 font-mono italic">{timestamp}</span>}
        </div>
      )}
      <h3 className="text-xl font-bold mb-4 text-white/90 leading-tight tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-white/60 font-medium whitespace-pre-wrap">{content}</p>
    </div>
  </motion.div>
);

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('無名の参列者');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('itako_gemini_key') || '');
  const [isAppReady, setIsAppReady] = useState(true);
  const [activeSlot, setActiveSlot] = useState(1);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState('soseki');
  const [isUnderground, setIsUnderground] = useState(false);
  const [externalContext, setExternalContext] = useState('');
  const [showContextUI, setShowContextUI] = useState(false);

  // 拡張データ
  const [news, setNews] = useState([]);
  const [ichikawaScolds, setIchikawaScolds] = useState({});
  const [archives, setArchives] = useState([
    { id: 1, author: 'Soseki', quote: '「月が綺麗ですね」と言ったのは、私だっただろうか。', ref: '三四郎より' },
  ]);
  const [bookmarks, setBookmarks] = useState([]);
  const [futureSelfCritique, setFutureSelfCritique] = useState('');

  // キャラクターと場所の拡張可能なリスト
  const [characters, setCharacters] = useState(INITIAL_CHARACTERS.map(c => ({
    ...c,
    status: c.id === 'soseki' ? { '胃痛レベル': 3 } :
      c.id === 'dosto' ? { '借金額': '50,000ルーブル' } :
        c.id === 'ichikawa' ? { '論理的厳格さ': '高' } :
          c.id === 'k_kokoro' ? { '絶望度': '深' } :
            c.id === 'alyosha' ? { '信仰心': '不変' } :
              { '不気味さ': '80%' }
  })));
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);

  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserName(currentUser.displayName || '彷徨える魂');

        // ログイン後のデータ取得
        const savedBookMarks = await fetchBookmarks();
        setBookmarks(savedBookMarks);
      } else {
        // フォールバック: 匿名ログイン
        import('./firebase').then(async ({ loginAnonymously }) => {
          const anonUser = await loginAnonymously();
          if (anonUser) setUser(anonUser);
        });
      }
    });

    const loadGlobalData = async () => {
      // ニュース取得などは認証前でも裏で進めておく
      const initialNews = await fetchFictionalizedNews();
      setNews(initialNews);
      if (initialNews.length > 0) {
        const scold = await generateIchikawaScolding(initialNews[0]);
        setIchikawaScolds({ [initialNews[0].id]: scold });
      }
    };

    loadGlobalData();
    return () => unsubscribe();
  }, [geminiKey]);



  const handleBookmark = async (msgIndex) => {
    const userMsg = messages[msgIndex - 1]?.content;
    const aiMsg = messages[msgIndex]?.content;
    const charId = messages[msgIndex]?.charId;

    if (userMsg && aiMsg) {
      await saveBookmark(userMsg, aiMsg, charId);
      const updated = await fetchBookmarks();
      setBookmarks(updated);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    const userMsg = input;
    setInput('');

    // Add user message locally
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    const currentChar = characters.find(c => c.id === selectedCharId);

    // NDL検索（話題に関連するアーカイブの提示）
    if (messages.length % 2 === 0) {
      searchNDLArchive(userMsg).then(results => {
        setArchives(prev => [...results, ...prev].slice(0, 5));
      });
    }

    // Generate AI response with physical status, underground info, and external context
    const aiResp = await generateCharacterResponse(currentChar, userMsg, isUnderground, externalContext, geminiKey);
    setMessages(prev => [...prev, { role: 'ai', content: aiResp, charId: selectedCharId }]);

    // 自律増殖の評価
    if (messages.length % 3 === 0) {
      import('./gemini').then(async ({ evaluateExpansion }) => {
        const expansion = await evaluateExpansion(userMsg + " " + aiResp, geminiKey);
        if (expansion) {
          if (expansion.type === 'character' && !characters.find(c => c.id === expansion.id)) {
            setCharacters(prev => [...prev, {
              ...expansion,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${expansion.id}`,
              status: { [expansion.flavor]: '初期値' }
            }]);
          } else if (expansion.type === 'location' && !locations.find(l => l.id === expansion.id)) {
            setLocations(prev => [...prev, { id: expansion.id, name: expansion.name, icon: <MapPin size={16} /> }]);
          }
        }
      });
    }

    // 2036年スロットの更新
    if (activeSlot === 2) {
      const critique = await evaluateFutureSelf(bookmarks, geminiKey);
      setFutureSelfCritique(critique);
    }

    // ステータスの動的変化
    setCharacters(prev => prev.map(c => {
      if (c.id === selectedCharId) {
        if (c.id === 'soseki') return { ...c, status: { '胃痛レベル': (c.status['胃痛レベル'] || 0) + 1 } };
        if (c.id === 'dosto') return { ...c, status: { '借金額': (parseInt(c.status['借金額']) + 1000) || 50000 + 'ルーブル' } };
        if (c.id === 'k_kokoro') return { ...c, status: { '絶望度': 'より深く' } };
      }
      return c;
    }));

    setLoading(false);
  };

  // スロット切り分け
  const handleSlotChange = async (index) => {
    setActiveSlot(index);
    if (index === 2) {
      setLoading(true);
      const critique = await evaluateFutureSelf(bookmarks, geminiKey);
      setFutureSelfCritique(critique);
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== activeSlot) {
      handleSlotChange(index);
    }
  };


  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#050505] text-itako-grey font-sans">

      {/* Header (Clean Architecture: Components / UI) */}
      <Header
        userName={userName}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        showContextUI={showContextUI}
        setShowContextUI={setShowContextUI}
      />

      {/* NotebookLM Context Injection UI */}
      <AnimatePresence>
        {showContextUI && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-orange-100 overflow-hidden"
          >
            <div className="p-4 max-w-xl mx-auto">
              <label className="text-[10px] font-bold text-itako-orange mb-2 block uppercase tracking-wider">NotebookLM Analysis / 作家特有の論理・語彙</label>
              <textarea
                value={externalContext}
                onChange={(e) => setExternalContext(e.target.value)}
                placeholder="ここにNotebookLMで解析した作家の癖や思想をペーストしてください。AIの応答に反映されます。"
                className="w-full h-24 p-3 bg-itako-warm-beige/30 border border-orange-50 rounded-xl text-xs focus:ring-1 ring-itako-orange/30 outline-none resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Timeline Scrollable Area */}
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="timeline-container flex-1 itako-scrollbar"
      >
        {/* Slot 1: Trends (News & Scolding) */}
        <section className="timeline-slot p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto py-12">
            <div className="flex flex-col gap-2 mb-16 px-4">
              <span className="text-[10px] font-bold tracking-[0.5em] text-itako-orange uppercase opacity-60">Archive Index / 001</span>
              <h2 className="text-4xl font-bold tracking-tighter text-white">残響する世界。</h2>
            </div>
            {news.map(n => (
              <div key={n.id} className="mb-12">
                <SpiritCard title={n.title} content={n.content} />
                {ichikawaScolds[n.id] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="ml-auto w-[80%] mt-[-2rem] bg-zinc-900/80 backdrop-blur-xl p-8 rounded-sm border border-itako-orange/20 shadow-2xl relative z-20"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-itako-orange" />
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[9px] font-bold tracking-[0.4em] text-itako-orange uppercase">Ichikawa's Echo / 叱咤</span>
                    </div>
                    <p className="text-sm leading-relaxed italic text-zinc-300 font-serif">「{ichikawaScolds[n.id]}」</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Slot 2: Main Dialog */}
        <section className={`timeline-slot p-12 overflow-y-auto transition-all duration-1000 ${isUnderground ? 'bg-zinc-950 text-zinc-400' : 'bg-transparent'}`}>
          <div className="max-w-2xl mx-auto h-full flex flex-col">
            <header className="flex items-center justify-between mb-16 px-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold tracking-[0.4em] text-itako-orange uppercase opacity-60">Communication / 002</span>
                <h2 className="text-3xl font-bold tracking-tighter text-white">魂の対話。</h2>
              </div>
              <button
                onClick={() => setIsUnderground(!isUnderground)}
                className={`flex items-center gap-2 px-6 py-2 rounded-sm text-[9px] font-bold tracking-widest transition-all uppercase border ${isUnderground ? 'bg-itako-orange text-white border-itako-orange' : 'bg-transparent text-itako-orange border-itako-orange/30 hover:bg-itako-orange/10'}`}
              >
                <Ghost size={12} />
                {isUnderground ? 'Surface' : 'Deep Trace'}
              </button>
            </header>

            <div className="flex-1 flex flex-col gap-12 mb-8">
              {/* Character Gallery Selection */}
              <div className="scrollbar-hide overflow-x-auto flex gap-4 pb-4 px-2">
                {characters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCharId(c.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-sm transition-all duration-500 border ${selectedCharId === c.id ? 'bg-zinc-900 border-itako-orange/40 shadow-[0_0_30px_rgba(255,140,0,0.1)]' : 'bg-transparent border-transparent hover:border-white/5 opacity-40 hover:opacity-100'}`}
                  >
                    <div className="relative">
                      <img src={c.avatar} alt={c.name} className={`w-12 h-12 rounded-full transition-all duration-700 ${selectedCharId === c.id ? 'scale-110 shadow-lg' : 'grayscale'}`} />
                      {selectedCharId === c.id && (
                        <motion.div layoutId="activeChar" className="absolute -inset-2 border border-itako-orange/30 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-white">{c.name}</span>
                      {c.status && (
                        <div className="text-[7px] text-itako-orange font-bold mt-1 opacity-60">
                          {Object.entries(c.status).map(([k, v]) => `${v}`).join('·')}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Chat Thread */}
              <div className="space-y-12 px-2 pb-24">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] text-lg leading-relaxed ${m.role === 'user' ? 'text-right text-white font-medium' : 'text-left text-white/70'}`}>
                        {m.role === 'ai' && (
                          <div className="flex items-center gap-4 mb-3 opacity-30 group">
                            <span className="text-[8px] font-bold tracking-[0.4em] uppercase">{m.charId}</span>
                            <button onClick={() => handleBookmark(i)} className="text-[8px] flex items-center gap-1 hover:text-itako-orange transition-colors uppercase tracking-widest font-bold">
                              Bookmark
                            </button>
                          </div>
                        )}
                        <p className={`${m.role === 'ai' ? 'font-serif' : 'font-sans'}`}>{m.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="flex items-center gap-4 text-itako-orange/40 text-[9px] font-bold tracking-widest uppercase animate-pulse">
                        <div className="w-1 h-1 bg-itako-orange rounded-full" />
                        Transcribing Spirit Echo...
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Premium Input Portal */}
            <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40 transition-all duration-500`}>
              <div className="relative bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-sm p-4 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-itako-orange/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder="言葉を、深淵へ沈める。"
                  className="w-full bg-transparent border-none focus:ring-0 text-sm md:text-base text-white placeholder:text-white/10 resize-none h-12 leading-relaxed"
                />
                <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Channeling Mode: {isUnderground ? 'Deep' : 'Surface'}</span>
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    className="text-[9px] font-bold tracking-[0.4em] text-itako-orange uppercase hover:text-white transition-colors disabled:opacity-20"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slot 3: Abyss / Future Records */}
        <section className="timeline-slot p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto py-12">
            <header className="flex flex-col gap-2 mb-16 px-4">
              <span className="text-[9px] font-bold tracking-[0.5em] text-itako-orange uppercase opacity-60">Deep Records / 003</span>
              <h2 className="text-4xl font-bold tracking-tighter text-white">消えない、記憶。</h2>
            </header>

            {loading ? (
              <div className="py-32 flex flex-col items-center gap-6 text-itako-orange/20 italic text-xs tracking-widest uppercase font-bold animate-pulse">
                <Ghost size={40} />
                Rewinding the Abyssal Clock...
              </div>
            ) : (
              <div className="space-y-16">
                {/* Future Self's Critique - Higher Aesthetic */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative p-12 rounded-sm bg-zinc-950 border border-white/5 shadow-2xl group"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Quote size={80} />
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-[10px] font-bold tracking-[0.4em] text-itako-orange uppercase border-l border-itako-orange pl-4">The Verdict from 2036</span>
                  </div>
                  <p className="text-base md:text-lg leading-[1.8] text-white/80 font-serif italic">
                    {futureSelfCritique || "まだ、未来の自分に届く言葉が保存されていないようです。"}
                  </p>
                </motion.div>

                {/* Abyssal Records (NDL) as Fragments */}
                <div className="space-y-8">
                  <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.6em] mb-12 text-center">Spirit Fragments / 断片</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {archives.map(c => (
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        key={c.id}
                        className="p-6 bg-white/[0.02] border border-white/5 hover:border-itako-orange/30 transition-all rounded-sm"
                      >
                        <div className="text-[8px] font-bold text-itako-orange/40 mb-2 uppercase tracking-widest">{c.author || 'Archive'}</div>
                        <div className="text-xs font-bold mb-3 text-white/80 leading-relaxed">{c.title}</div>
                        <div className="text-[10px] leading-relaxed text-white/40 italic">" {c.quote} "</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Past Traces (Bookmarks) */}
                <div className="space-y-8">
                  <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.6em] mb-12 text-center">Tied Spirits / 結ばれた魂</h3>
                  <div className="space-y-4">
                    {bookmarks.map(b => (
                      <div key={b.id} className="p-8 border border-white/5 text-[11px] text-white/60 bg-white/[0.01]">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[9px] font-bold tracking-widest uppercase text-itako-orange/60">{b.charId}</span>
                          <span className="text-[8px] opacity-20 italic">Preserved fragment</span>
                        </div>
                        <div className="mb-4 text-white/80 font-medium">" {b.userMsg} "</div>
                        <div className="pl-6 border-l border-white/5 italic text-white/40">" {b.aiMsg} "</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Navigation (Indicator) */}
      <footer className="h-14 border-t border-orange-100 bg-white/50 backdrop-blur-md flex items-center justify-center gap-8 px-6">
        <div className={`p-2 transition-colors ${activeSlot === 0 ? 'text-itako-orange' : 'text-itako-grey/30'}`}>
          <TrendingUp size={24} cursor="pointer" onClick={() => scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' })} />
        </div>
        <div className={`p-2 transition-colors ${activeSlot === 1 ? 'text-itako-orange' : 'text-itako-grey/30'}`}>
          <MessageSquare size={24} cursor="pointer" onClick={() => scrollRef.current?.scrollTo({ left: window.innerWidth, behavior: 'smooth' })} />
        </div>
        <div className={`p-2 transition-colors ${activeSlot === 2 ? 'text-itako-orange' : 'text-itako-grey/30'}`}>
          <BookOpen size={24} cursor="pointer" onClick={() => scrollRef.current?.scrollTo({ left: window.innerWidth * 2, behavior: 'smooth' })} />
        </div>
      </footer>
    </div>
  );
}

export default App;
