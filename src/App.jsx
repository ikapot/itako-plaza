import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, TrendingUp, BookOpen, User, MapPin, Ghost, Settings, Loader2, Quote } from 'lucide-react';
import { auth, fetchBookmarks, saveBookmark, saveNotebookAccumulation, fetchNotebookAccumulations } from './firebase';
import { generateCharacterResponse, evaluateFutureSelf } from './gemini';
import { fetchFictionalizedNews, generateIchikawaScolding } from './news';
import { searchNDLArchive } from './ndl';
import Header from './components/Header';
import LandingPage from './components/LandingPage';

const INITIAL_CHARACTERS = [
  { id: 'soseki', name: '夏目漱石', flavor: '胃痛', color: 'bg-itako-clay', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Natsume_Souseki.jpg/330px-Natsume_Souseki.jpg' },
  { id: 'dosto', name: 'ドストエフスキー', flavor: '借金', color: 'bg-itako-sand', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Dostoevsky_1872.jpg/330px-Dostoevsky_1872.jpg' },
  { id: 'ichikawa', name: '市川房枝', flavor: '厳格', color: 'bg-itako-sage', avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Photo-Book-of-Fusae-Ichikawa-11.jpg' },
  { id: 'atsuko', name: 'Atsuko', flavor: '見守り', color: 'bg-itako-sand', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/O_Tsuta-san_c1900.jpg/330px-O_Tsuta-san_c1900.jpg' },
  { id: 'k_kokoro', name: 'K', flavor: '絶望', color: 'bg-zinc-800', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Japanese_student_c1900.jpg/330px-Japanese_student_c1900.jpg' },
  { id: 'alyosha', name: 'アリョーシャ', flavor: '信仰', color: 'bg-itako-sage', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Alyosha_Vanya.jpg/330px-Alyosha_Vanya.jpg' },
];

const INITIAL_LOCATIONS = [
  { id: 'cafe', name: 'カフェ', icon: <MapPin size={16} /> },
  { id: 'library', name: '図書館', icon: <MapPin size={16} /> },
  { id: 'passage', name: '地下通路', icon: <MapPin size={16} /> },
];

// --- コンポーネント ---

const WarholAvatar = ({ src, colorClass = "bg-itako-clay", size = "w-12 h-12", isSelected = false }) => (
  <div className={`${size} rounded-full overflow-hidden relative flex-shrink-0 border border-white/5 bg-zinc-900 ${!isSelected && 'grayscale brightness-50'}`}>
    {/* Screen Print Layer 1: Earth Background */}
    <div className={`absolute inset-0 ${colorClass} opacity-80`} />

    {/* Screen Print Layer 2: High Contrast Portrait */}
    <img
      src={src}
      alt="portrait"
      className={`absolute inset-0 w-full h-full object-cover grayscale contrast-[3] brightness-[1.2] mix-blend-multiply transition-all duration-1000 ${isSelected ? 'scale-110' : 'scale-100'}`}
    />

    {/* Screen Print Layer 3: Texture Overlay */}
    <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />

    {/* Selection Border Glow */}
    {isSelected && <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-pulse" />}
  </div>
);

const SpiritCard = ({ title, content, author, flavor, timestamp, colorClass = "bg-white" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className={`relative p-10 rounded-[40px] ${colorClass} mb-4 shadow-sm group transition-all duration-700 border border-black/5`}
  >
    <div className="relative z-10 flex flex-col gap-6">
      {author && (
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-black/60 uppercase">{author}</span>
            {flavor && <span className="text-[10px] font-bold bg-black/5 px-3 py-1 rounded-full text-black/40">{flavor}</span>}
          </div>
        </div>
      )}
      <div className="space-y-4">
        <h3 className="text-3xl font-bold tracking-tighter text-black/80 leading-tight pr-12">{title}</h3>
        <p className="text-base leading-relaxed text-black/60 font-medium whitespace-pre-wrap">{content}</p>
      </div>

      <div className="flex justify-end mt-4">
        <button className="bg-black text-white/90 px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg">
          DISCOVER <span className="text-lg">→</span>
        </button>
      </div>
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
  const [notebookInput, setNotebookInput] = useState('');
  const [notebookAccumulations, setNotebookAccumulations] = useState([]);

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
        const data = await fetchNotebookAccumulations();
        setNotebookAccumulations(data);
      } else {
        // フォールバック: 匿名ログイン
        import('./firebase').then(async ({ loginAnonymously }) => {
          const anonUser = await loginAnonymously();
          if (anonUser) setUser(anonUser);
        });
      }
    });

    const loadGlobalData = async () => {
      const initialNews = await fetchFictionalizedNews(geminiKey);
      setNews(initialNews);
      if (initialNews.length > 0) {
        const scold = await generateIchikawaScolding(initialNews[0], geminiKey);
        setIchikawaScolds({ [initialNews[0].id]: scold });
      }
    };

    loadGlobalData();
    return () => unsubscribe();
  }, [geminiKey]);

  const loadAccumulations = async () => {
    const data = await fetchNotebookAccumulations();
    setNotebookAccumulations(data);
  };

  const handlePushNotebook = async () => {
    if (!notebookInput.trim()) return;
    setLoading(true);
    await saveNotebookAccumulation(notebookInput);
    setNotebookInput('');
    await loadAccumulations();
    setLoading(false);
    alert('Knowledge pushed to the Abyss.');
  };

  const handleOpenAccumulations = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Abyss Records - Itako Plaza</title>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Outfit:wght@300;600&display=swap');
            body { 
              background: #0a0a0a; 
              color: rgba(255,255,255,0.8); 
              font-family: 'Outfit', sans-serif;
            }
            .serif { font-family: 'Noto Serif JP', serif; }
            .grain {
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: url('https://grainy-gradients.vercel.app/noise.svg');
              opacity: 0.03; pointer-events: none; z-index: 50;
            }
            .earth-clay { color: #bd8a78; }
            .earth-sage { color: #899d90; }
            .earth-sand { color: #c8b39c; }
          </style>
        </head>
        <body class="p-8 md:p-24 min-h-screen">
          <div class="grain"></div>
          <div class="max-w-4xl mx-auto">
            <header class="mb-32 border-b border-white/5 pb-16">
              <h1 class="text-8xl font-black tracking-tighter text-white mb-6">INSIGHTS</h1>
              <p class="text-xl earth-clay font-bold tracking-[0.4em] uppercase">Deep Accumulations of Abyss</p>
            </header>

            <div class="grid gap-24">
              ${notebookAccumulations.map(acc => `
                <article class="group">
                  <div class="flex items-center gap-6 mb-8 text-[10px] font-bold tracking-[0.3em] text-white/20 uppercase">
                    <span class="bg-white/5 px-4 py-1 rounded-full text-white/40">${acc.timestamp?.toDate().toLocaleDateString() || 'Ancient Fragment'}</span>
                    <span class="earth-sage">Deciphered</span>
                  </div>
                  <div class="relative pl-12 border-l border-white/10">
                    <div class="absolute -left-[1px] top-0 w-[2px] h-12 bg-gradient-to-b from-[#bd8a78] to-transparent"></div>
                    <p class="text-2xl leading-relaxed text-white/90 serif whitespace-pre-wrap">${acc.content}</p>
                  </div>
                </article>
              `).join('')}
            </div>

            ${notebookAccumulations.length === 0 ? '<p class="text-white/20 italic tracking-widest text-center py-32">The abyss is silent...</p>' : ''}
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };



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
            <div className="flex flex-col gap-2 mb-12">
              <h2 className="text-7xl font-bold tracking-tighter text-itako-deep leading-none">Hello</h2>
              <p className="text-lg font-bold text-itako-deep/40 pl-1 tracking-wider uppercase tracking-[0.3em]">Archives & News</p>
            </div>

            <div className="flex items-center justify-between mb-8 px-2">
              <span className="text-sm font-bold text-itako-deep/30 uppercase tracking-widest">Recents ({news.length})</span>
              <span className="text-xs font-bold text-itako-deep/50 hover:underline cursor-pointer transition-all">See all</span>
            </div>

            {news.map((n, idx) => {
              const cardColors = ['bg-itako-sand', 'bg-itako-sage', 'bg-itako-clay'];
              return (
                <div key={n.id} className="mb-12">
                  <SpiritCard
                    title={n.title}
                    content={n.content}
                    colorClass={cardColors[idx % cardColors.length]}
                  />
                  {ichikawaScolds[n.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="ml-auto w-[85%] mt-[-4rem] bg-white p-10 rounded-[40px] border border-black/5 shadow-2xl relative z-20"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-bold tracking-[0.4em] text-itako-clay uppercase">Ichikawa's Echo / 叱咤</span>
                      </div>
                      <p className="text-base leading-relaxed italic text-itako-deep/70 font-serif">「{ichikawaScolds[n.id]}」</p>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Slot 2: Main Dialog */}
        <section className={`timeline-slot p-12 overflow-y-auto transition-all duration-1000 bg-[#1a1a1a]`}>
          <div className="max-w-2xl mx-auto h-full flex flex-col">
            <header className="flex flex-col gap-2 mb-12 px-4">
              <div className="flex items-center justify-between">
                <h2 className="text-7xl font-bold tracking-tighter text-white/90 leading-none">Dialog</h2>
                <button
                  onClick={() => setIsUnderground(!isUnderground)}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all border ${isUnderground ? 'bg-white text-[#1a1a1a] border-white' : 'bg-transparent text-white/40 border-white/10 hover:border-white/20'}`}
                >
                  {isUnderground ? 'Surface' : 'Deep Trace'}
                </button>
              </div>
              <p className="text-lg font-bold text-white/30 pl-1 tracking-wider uppercase tracking-[0.3em]">{userName} / Now Speaking</p>
            </header>

            <div className="flex-1 flex flex-col gap-12 mb-24">
              {/* Character Selection as Neutral Gallery */}
              <div className="scrollbar-hide overflow-x-auto flex gap-6 pb-4 px-2">
                {characters.map(c => {
                  const isSelected = selectedCharId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCharId(c.id)}
                      className={`flex-shrink-0 flex items-center gap-4 p-4 pr-10 rounded-[40px] transition-all duration-700 border ${isSelected ? 'bg-white/5 border-white/20 shadow-2xl scale-105' : 'bg-transparent border-transparent'}`}
                    >
                      <WarholAvatar src={c.avatar} colorClass={c.color} isSelected={isSelected} />
                      <div className="flex flex-col items-start">
                        <span className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors ${isSelected ? 'text-white' : 'text-white/20'}`}>{c.name}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.3em] transition-colors ${isSelected ? 'text-white/40' : 'text-white/10'}`}>{c.flavor}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chat Thread as Stacked Cards */}
              <div className="space-y-8 px-2 pb-32">
                <AnimatePresence>
                  {messages.map((m, i) => {
                    const isUser = m.role === 'user';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`p-8 rounded-[35px] shadow-sm max-w-[90%] ${isUser ? 'bg-white text-[#1a1a1a] rounded-tr-none' : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none'}`}>
                          {!isUser && (
                            <div className="flex items-center gap-4 mb-3 border-b border-white/5 pb-2">
                              <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/20">{m.charId}</span>
                              <button onClick={() => handleBookmark(i)} className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/40 hover:text-white transition-colors">
                                Bookmark
                              </button>
                            </div>
                          )}
                          <p className={`text-lg leading-relaxed ${!isUser ? 'font-serif' : 'font-sans'}`}>{m.content}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {loading && (
                    <div className="flex items-center gap-4 text-white/20 text-[10px] font-bold tracking-[0.4em] uppercase px-4 animate-pulse">
                      Channeling spirit...
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Unified Black Pill Input Bar */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40">
              <div className="bg-black rounded-[40px] p-2 flex items-center shadow-2xl border border-white/10">
                <div className="flex-1 px-6">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    placeholder="Message..."
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none h-10 py-2 leading-relaxed text-sm"
                  />
                </div>
                <div className="flex items-center gap-1 pr-2">
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center text-black font-bold transition-transform active:scale-95 disabled:opacity-20 shadow-lg"
                  >
                    <span className="text-xl">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slot 3: Abyss / Future Records */}
        <section className="timeline-slot p-12 overflow-y-auto bg-[#1a1a1a]">
          <div className="max-w-2xl mx-auto py-12">
            <header className="flex flex-col gap-2 mb-12 px-4">
              <h2 className="text-7xl font-bold tracking-tighter text-white/90 leading-none">Abyss</h2>
              <p className="text-lg font-bold text-white/30 pl-1 tracking-wider uppercase tracking-[0.3em]">The Eternal Records</p>
            </header>

            {loading ? (
              <div className="py-32 flex flex-col items-center gap-6 text-itako-clay/40 italic text-xs tracking-widest uppercase font-bold animate-pulse">
                Exploring the deep...
              </div>
            ) : (
              <div className="space-y-16">
                {/* NotebookLM Integration Bridge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative p-12 rounded-[50px] bg-gradient-to-br from-white/10 to-transparent border border-white/20 shadow-2xl overflow-hidden group mb-8"
                >
                  <div className="flex flex-col gap-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center">
                            <span className="text-black font-black text-[10px]">LM</span>
                          </div>
                          <span className="text-[12px] font-bold tracking-[0.4em] text-zinc-400 uppercase">NotebookLM / Bridge</span>
                        </div>
                        <h3 className="text-3xl font-bold text-white tracking-tighter leading-tight">Channeling sources to NotebookLM</h3>
                        <p className="text-sm text-zinc-500 max-w-lg leading-relaxed font-medium">
                          Plazaの対話をNotebookLMへ。そしてNotebookLMの知見を、再びこの深淵へと「プッシュ（Push）」します。
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              const content = archives.map(a => `${a.title}\n${a.quote}`).join('\n\n');
                              navigator.clipboard.writeText(content);
                              alert('Archives copied for NotebookLM');
                              window.open('https://notebooklm.google.com/', '_blank');
                            }}
                            className="whitespace-nowrap px-8 py-3 bg-zinc-800 border border-white/10 text-zinc-300 text-[9px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-zinc-700 transition-all"
                          >
                            Export to Source
                          </button>
                          <button
                            onClick={handleOpenAccumulations}
                            className="whitespace-nowrap px-8 py-3 bg-zinc-200 text-black text-[9px] font-bold tracking-[0.2em] uppercase rounded-full shadow-lg hover:scale-105 transition-all"
                          >
                            View History
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mt-8 pt-8 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">Gather Insights (Paste from NotebookLM)</span>
                      </div>
                      <div className="relative">
                        <textarea
                          value={notebookInput}
                          onChange={(e) => setNotebookInput(e.target.value)}
                          placeholder="Paste insights from NotebookLM here..."
                          className="w-full bg-black border border-white/10 rounded-[40px] p-8 text-white placeholder:text-white/10 focus:ring-1 focus:ring-white/20 text-sm h-32 resize-none transition-all"
                        />
                        <button
                          onClick={handlePushNotebook}
                          disabled={!notebookInput.trim() || loading}
                          className="absolute bottom-6 right-6 bg-zinc-200 text-black px-8 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-2xl active:scale-95 disabled:opacity-20 transition-all"
                        >
                          PUSH TO ABYSS
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-16 -right-16 opacity-5 pointer-events-none transform rotate-12">
                    <BookOpen size={280} />
                  </div>
                </motion.div>
                {/* Future Self's Critique - Neutral Glass Aesthetic */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative p-12 rounded-[50px] bg-white/5 border border-white/10 shadow-2xl group overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-white">
                    <Quote size={120} />
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-[12px] font-bold tracking-[0.4em] text-white/40 uppercase border-l-2 border-white/20 pl-4">The Verdict from 2036</span>
                  </div>
                  <p className="text-xl md:text-2xl leading-[1.6] text-white/80 font-serif italic tracking-tight">
                    {futureSelfCritique || "まだ、未来の自分に届く言葉が保存されていないようです。"}
                  </p>

                  <div className="mt-12 flex justify-end">
                    <button className="bg-white text-[#1a1a1a] px-8 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg hover:bg-white/90 transition-colors">
                      Preserve Memory
                    </button>
                  </div>
                </motion.div>

                {/* Abyssal Records as Neutral Grid Cards */}
                <div className="space-y-8">
                  <h3 className="text-sm font-bold text-white/20 uppercase tracking-[0.6em] px-4">Spirit Fragments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archives.map((c, idx) => {
                      return (
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          key={c.id}
                          className={`p-10 bg-white/5 border border-white/10 rounded-[40px] shadow-sm flex flex-col gap-4 group cursor-pointer hover:bg-white/10 transition-all duration-500`}
                        >
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{c.author || 'Archive'}</div>
                          <div className="text-xl font-bold text-white/80 leading-tight">{c.title}</div>
                          <div className="text-sm leading-relaxed text-white/40 italic font-serif">" {c.quote} "</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Past Traces (Bookmarks) */}
                <div className="space-y-8">
                  <h3 className="text-sm font-bold text-white/20 uppercase tracking-[0.6em] px-4">Tied Spirits</h3>
                  <div className="space-y-4">
                    {bookmarks.map(b => (
                      <div key={b.id} className="p-12 rounded-[50px] bg-white text-[#1a1a1a] shadow-xl transition-transform hover:scale-[1.01]">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-xs font-bold tracking-widest uppercase opacity-40">{b.charId}</span>
                        </div>
                        <div className="mb-6 text-xl font-medium leading-relaxed italic">" {b.userMsg} "</div>
                        <div className="pl-8 border-l border-black/10 italic text-base opacity-60 font-serif">" {b.aiMsg} "</div>
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
      <footer className="h-14 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-center gap-8 px-6">
        <div className={`p-2 transition-all cursor-pointer ${activeSlot === 0 ? 'text-white scale-110' : 'text-white/20 hover:text-white/40'}`} onClick={() => scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' })}>
          <TrendingUp size={20} />
        </div>
        <div className={`p-2 transition-all cursor-pointer ${activeSlot === 1 ? 'text-white scale-110' : 'text-white/20 hover:text-white/40'}`} onClick={() => scrollRef.current?.scrollTo({ left: window.innerWidth, behavior: 'smooth' })}>
          <MessageSquare size={20} />
        </div>
        <div className={`p-2 transition-all cursor-pointer ${activeSlot === 2 ? 'text-white scale-110' : 'text-white/20 hover:text-white/40'}`} onClick={() => scrollRef.current?.scrollTo({ left: window.innerWidth * 2, behavior: 'smooth' })}>
          <BookOpen size={20} />
        </div>
      </footer>
    </div>
  );
}

export default App;
