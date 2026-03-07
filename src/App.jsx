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

const PostCard = ({ title, content, author, flavor }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
    className="bg-itako-warm-beige p-6 rounded-2xl shadow-itako border border-orange-100 mb-4"
  >
    {author && (
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-itako-orange/20 flex items-center justify-center font-bold text-itako-orange">
          {author[0]}
        </div>
        <span className="font-bold text-itako-grey">{author}</span>
        {flavor && <span className="text-xs text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">{flavor}</span>}
      </div>
    )}
    <h3 className="text-lg font-bold mb-2 text-itako-grey">{title}</h3>
    <p className="text-sm leading-relaxed text-itako-grey/80 whitespace-pre-wrap">{content}</p>
  </motion.div>
);

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('無名の参列者');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('itako_gemini_key') || '');
  const [isAppReady, setIsAppReady] = useState(false);
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

        // APIキーがあれば準備完了
        if (geminiKey) setIsAppReady(true);
      } else {
        setUser(null);
        setIsAppReady(false);
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

  const handleLoginComplete = (key) => {
    setGeminiKey(key);
    setIsAppReady(true);
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

  if (!isAppReady) {
    return <LandingPage onLoginComplete={handleLoginComplete} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-itako-warm-beige text-itako-grey">
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
        <section className="timeline-slot p-6 overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-6 text-itako-orange">
              <TrendingUp size={20} />
              <h2 className="text-lg font-bold">Timeline: Trends（流行）</h2>
            </div>
            {news.map(n => (
              <div key={n.id} className="mb-8">
                <PostCard title={n.title} content={n.content} />
                {ichikawaScolds[n.id] && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-6 mt-[-1rem] bg-zinc-800 text-zinc-100 p-4 rounded-2xl shadow-lg border-l-4 border-itako-orange relative z-10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold bg-itako-orange text-white px-2 py-0.5 rounded uppercase">市川房枝の叱咤</span>
                    </div>
                    <p className="text-xs leading-relaxed italic">「{ichikawaScolds[n.id]}」</p>
                  </motion.div>
                )}
              </div>
            ))}
            {news.length === 0 && (
              <div className="text-center text-itako-grey/30 py-12 animate-pulse">
                現実の断片を収集中...
              </div>
            )}
          </div>
        </section>

        {/* Slot 2: Main Dialog */}
        <section className={`timeline-slot p-6 overflow-y-auto transition-colors duration-500 ${isUnderground ? 'bg-zinc-900 text-zinc-300' : 'bg-white/30'}`}>
          <div className="max-w-xl mx-auto h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-itako-orange">
                <MessageSquare size={20} />
                <h2 className="text-lg font-bold">Timeline: Main Dialog（主対話）</h2>
              </div>
              <button
                onClick={() => setIsUnderground(!isUnderground)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${isUnderground ? 'bg-itako-orange text-white' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'}`}
              >
                <Ghost size={12} />
                地下通路へ
              </button>
            </div>

            <div className="flex-1 space-y-6 mb-4">
              <div className="grid grid-cols-4 gap-2">
                {characters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCharId(c.id)}
                    className={`flex flex-col items-center p-2 rounded-2xl transition-all border ${selectedCharId === c.id ? 'bg-itako-orange/10 border-itako-orange' : 'bg-white/50 border-transparent shadow-sm'}`}
                  >
                    <img src={c.avatar} alt={c.name} className={`w-8 h-8 rounded-xl mb-1 ${selectedCharId === c.id ? '' : 'grayscale-[0.5]'}`} />
                    <span className="text-[9px] font-bold truncate w-full text-center">{c.name}</span>
                    {c.status && (
                      <div className="text-[8px] text-orange-400 mt-0.5">
                        {Object.entries(c.status).map(([k, v]) => `${v}`).join(',')}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm ${m.role === 'user'
                        ? 'bg-itako-orange text-white rounded-tr-none'
                        : isUnderground
                          ? 'bg-zinc-800 text-zinc-300 rounded-tl-none border border-zinc-700'
                          : 'bg-white text-itako-grey rounded-tl-none border border-orange-50 shadow-sm'
                        }`}>
                        {m.role === 'ai' && (
                          <div className="flex items-center justify-between mb-1 opacity-50">
                            <span className="text-[10px] font-bold uppercase">{m.charId}</span>
                            <div className="flex items-center gap-2">
                              {isUnderground && <span className="text-[8px] italic">Deep Trace</span>}
                              <button
                                onClick={() => handleBookmark(i)}
                                className="text-[8px] flex items-center gap-1 hover:text-itako-orange transition-colors"
                              >
                                <BookOpen size={8} />
                                栞を挟む
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="leading-relaxed">{m.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className={`${isUnderground ? 'bg-zinc-800' : 'bg-white/50'} p-3 rounded-2xl border border-orange-50 italic text-xs text-itako-grey/40 flex items-center gap-2`}>
                        <Loader2 size={12} className="animate-spin" />
                        声を探しています...
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 pt-8 border-t border-orange-100 italic text-[10px] text-center text-itako-grey/30">
                場所: {locations.map((l, i) => (
                  <span key={l.id}>{l.name}{i < locations.length - 1 ? '、' : ''}</span>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className={`sticky bottom-0 p-4 rounded-3xl shadow-itako border mb-4 transition-all focus-within:ring-2 ring-itako-orange/20 ${isUnderground ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-orange-100'}`}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder={`${characters.find(c => c.id === selectedCharId)?.name}に言葉を投げかけますか？`}
                className={`w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-12 ${isUnderground ? 'text-zinc-200' : 'text-itako-grey'} placeholder:text-itako-grey/30`}
              />
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-itako-orange text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-30"
                >
                  {loading ? '探求中...' : (isUnderground ? '深淵へ送る' : '送信')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Slot 3: 2036 / Future Self (The Finale) */}
        <section className={`timeline-slot p-6 overflow-y-auto transition-all duration-1000 ${activeSlot === 2 ? 'bg-orange-50/30' : ''}`}>
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-6 text-itako-orange">
              <Ghost size={20} className="animate-pulse" />
              <h2 className="text-lg font-bold">Timeline: Classics & Abyss（古典と深淵）</h2>
            </div>

            {loading ? (
              <div className="py-20 text-center text-itako-grey/20 italic text-sm">
                10年の歳月を遡っています...
              </div>
            ) : (
              <div className="space-y-8">
                {/* Future Self's Critique */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-[2rem] shadow-itako border border-orange-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Quote size={40} />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold bg-itako-orange text-white px-3 py-1 rounded-full uppercase tracking-tighter">Evaluation from 2036</span>
                  </div>
                  <p className="text-sm leading-relaxed text-itako-grey/80 whitespace-pre-wrap font-serif">
                    {futureSelfCritique || "まだ、未来の自分に届く言葉が保存されていないようです。メイン対話で「栞を挟む」を行ってください。"}
                  </p>
                </motion.div>

                {/* Abyssal Records (NDL) */}
                <div className="pt-6">
                  <h3 className="text-xs font-bold text-itako-orange mb-4 uppercase tracking-widest pl-2 flex items-center gap-2">
                    <BookOpen size={12} />
                    Abyssal Records / 深淵の記録
                  </h3>
                  <div className="space-y-4">
                    {archives.map(c => (
                      <div key={c.id} className="p-4 bg-white/60 rounded-2xl border border-orange-50 shadow-sm">
                        <div className="text-[10px] font-bold text-itako-grey/40 mb-1 italic">{c.author || 'Archive'}</div>
                        <div className="text-xs font-bold mb-2 text-itako-grey">{c.title}</div>
                        <div className="text-[10px] leading-relaxed text-itako-grey/70">" {c.quote} "</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Past Traces (Bookmarks) */}
                <div className="pt-6">
                  <h3 className="text-xs font-bold text-itako-orange mb-4 uppercase tracking-widest pl-2">Past Traces / かつての栞</h3>
                  <div className="space-y-4">
                    {bookmarks.map(b => (
                      <div key={b.id} className="p-4 bg-white/40 rounded-2xl border border-orange-50 text-[10px] text-itako-grey/60">
                        <div className="font-bold mb-1 opacity-50">{b.charId}との対話</div>
                        <div className="mb-1 italic">" {b.userMsg} "</div>
                        <div className="pl-4 border-l border-orange-200">" {b.aiMsg} "</div>
                      </div>
                    ))}
                    {bookmarks.length === 0 && (
                      <div className="text-center py-8 text-itako-grey/20 text-[10px]">
                        保存された栞はありません。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Finale Sync Decoration */}
            <div className="mt-20 py-10 border-t border-orange-100 flex flex-col items-center opacity-20 grayscale">
              <Ghost size={30} />
              <span className="text-[8px] mt-2 tracking-[0.5em] uppercase">Spirit Orchestra</span>
              <div className="flex gap-2 mt-4">
                <div className={`w-1 h-1 rounded-full ${activeSlot === 0 ? 'bg-itako-orange scale-150' : 'bg-itako-grey'}`}></div>
                <div className={`w-1 h-1 rounded-full ${activeSlot === 1 ? 'bg-itako-orange scale-150' : 'bg-itako-grey'}`}></div>
                <div className={`w-1 h-1 rounded-full ${activeSlot === 2 ? 'bg-itako-orange scale-150' : 'bg-itako-grey'}`}></div>
              </div>
            </div>
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
