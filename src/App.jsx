// Itako Plaza v1.1.0 - Refined Timeline & Auth Flow
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, TrendingUp, User, MapPin, Ghost, Settings, Loader2, Quote, Menu, X, Cpu, Globe } from 'lucide-react';
import { auth, fetchBookmarks, saveBookmark, fetchNotebookAccumulations } from './firebase';
import { generateCharacterResponse, evaluateFutureSelf } from './gemini';
import { fetchFictionalizedNews, generateIchikawaScolding } from './news';
import { searchNDLArchive } from './ndl';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import WarholAvatar from './components/WarholAvatar';
import SpiritCard from './components/SpiritCard';

const INITIAL_CHARACTERS = [
  { id: 'soseki', name: '夏目漱石', flavor: '胃痛', color: 'bg-itako-clay', description: '日本の小説家、評論家。代表作『吾輩は猫である』。深く鋭い人間洞察を持つ。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Natsume_Souseki.jpg/330px-Natsume_Souseki.jpg' },
  { id: 'dosto', name: 'ドストエフスキー', flavor: '借金', color: 'bg-itako-sand', description: 'ロシアの小説家。代表作『罪と罰』。魂の極限状態を描くリアリズムの巨匠。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Dostoevsky_1872.jpg/330px-Dostoevsky_1872.jpg' },
  { id: 'ichikawa', name: '市川房枝', flavor: '厳格', color: 'bg-itako-sage', description: '日本の婦人運動家。女性参政権運動を主導し、政治の浄化を訴え続けた。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Photo-Book-of-Fusae-Ichikawa-11.jpg' },
  { id: 'atsuko', name: 'Atsuko', flavor: '見守り', color: 'bg-itako-sand', description: '広場の片隅で静かにすべてを記録し続ける、超越的な観察者の魂。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/O_Tsuta-san_c1900.jpg/330px-O_Tsuta-san_c1900.jpg' },
  { id: 'k_kokoro', name: 'K', flavor: '絶望', color: 'bg-zinc-800', description: '『こころ』の登場人物。宗教的理想と人間的感情の間で苦悩する孤高の青年。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Japanese_student_c1900.jpg/330px-Japanese_student_c1900.jpg' },
  { id: 'alyosha', name: 'アリョーシャ', flavor: '信仰', color: 'bg-itako-sage', description: '『カラマーゾフの兄弟』の末弟。純真な心を持ち、世界のあらゆる罪を背負おうとする。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Alyosha_Vanya.jpg/330px-Alyosha_Vanya.jpg' },
];

const INITIAL_LOCATIONS = [
  { id: 'cafe', name: 'カフェ', icon: <MapPin size={16} />, pos: 0 },
  { id: 'library', name: '図書館', icon: <MapPin size={16} />, pos: 4 },
  { id: 'passage', name: '地下通路', icon: <MapPin size={16} />, pos: 8 },
  { id: 'shrine', name: '神社', icon: <MapPin size={16} />, pos: 2 },
  { id: 'bridge', name: '橋', icon: <MapPin size={16} />, pos: 6 },
];

// --- コンポーネント群は /components フォルダへ退避 (Clean Code) ---

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('無名の参列者');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('itako_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState('soseki');
  const [selectedLocationId, setSelectedLocationId] = useState('cafe');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeManagerTab, setActiveManagerTab] = useState('directory'); // 'map', 'directory', 'connect'
  const [isUnderground, setIsUnderground] = useState(false);
  const [externalContext, setExternalContext] = useState('');
  const [showContextUI, setShowContextUI] = useState(false);

  // 拡張データ
  const [news, setNews] = useState([]);
  const [ichikawaScolds, setIchikawaScolds] = useState({});
  const [archives, setArchives] = useState([
    { id: 1, author: 'Soseki', quote: '「月が綺麗ですね」と言ったのは、私だっただろうか。', ref: '三四郎より' },
  ]);
  const [bgLight, setBgLight] = useState(parseFloat(localStorage.getItem('itako_bg_light')) || 5);
  const [textLight, setTextLight] = useState(parseFloat(localStorage.getItem('itako_text_light')) || 90);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [futureSelfCritique, setFutureSelfCritique] = useState('');
  const [spiritSharedKnowledge, setSpiritSharedKnowledge] = useState('');
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

        // NotebookLMからの蓄積知見を読み込み
        const data = await fetchNotebookAccumulations();
        const shared = data.map(acc => acc.content).join('\n---\n');
        setSpiritSharedKnowledge(shared);
        if (geminiKey) {
          setIsAppReady(true);
        }
      } else {
        setUser(null);
      }
    });

    const loadGlobalData = async () => {
      if (!geminiKey) return; // キーがなければ何もしない

      // ユーザーがログイン済みかつキーがあるなら、LandingPageをスキップ
      if (auth.currentUser && geminiKey) {
        setIsAppReady(true);
      }

      const loadingKey = `itako_loading_${geminiKey.slice(-6)}`;
      if (sessionStorage.getItem(loadingKey)) return; // React Strict Mode の二重起動を防ぐ
      sessionStorage.setItem(loadingKey, '1');

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

  const handlePushNotebook = async (content) => {
    const textToPush = content || notebookInput;
    if (!textToPush.trim()) return;
    setLoading(true);
    await saveNotebookAccumulation(textToPush);
    setNotebookInput('');
    const data = await fetchNotebookAccumulations();
    setNotebookAccumulations(data);
    const shared = data.map(acc => acc.content).join('\n---\n');
    setSpiritSharedKnowledge(shared);
    setLoading(false);
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

    // Generate AI response with physical status, underground info, and spirit-shared knowledge
    const aiResp = await generateCharacterResponse(currentChar, userMsg, isUnderground, spiritSharedKnowledge, geminiKey);
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

    // Trends評価 (旧2036年評価)
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

  const ManagerContent = () => (
    <div className="space-y-12">
      {/* Tabs for Manager */}
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5 mb-8">
        {[
          { id: 'directory', icon: <User size={14} />, label: 'Registry', color: '#98a436' },
          { id: 'map', icon: <Globe size={14} />, label: 'Map', color: '#fdb913' },
          { id: 'connect', icon: <Cpu size={14} />, label: 'Connect', color: '#f15a24' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveManagerTab(tab.id)}
            style={{
              backgroundColor: activeManagerTab === tab.id ? tab.color : 'transparent',
              color: activeManagerTab === tab.id ? '#000' : 'rgba(255,255,255,0.3)'
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 active:scale-95 cursor-pointer font-oswald shadow-inner`}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeManagerTab === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-sm border border-white/5 aspect-square max-w-[240px] mx-auto">
              {Array.from({ length: 9 }).map((_, i) => {
                const loc = locations.find(l => l.pos === i);
                const isSelected = selectedLocationId === loc?.id;
                return (
                  <button
                    key={i}
                    onClick={() => loc && setSelectedLocationId(loc.id)}
                    className={`aspect-square flex items-center justify-center relative transition-all duration-500 overflow-hidden ${isSelected ? 'bg-zinc-200' : 'bg-black hover:bg-white/5'}`}
                  >
                    {loc ? (
                      <div className="flex flex-col items-center gap-1">
                        <MapPin size={12} className={isSelected ? 'text-black' : 'text-white/20'} />
                        <span className={`text-[8px] font-bold tracking-tighter ${isSelected ? 'text-black' : 'text-white/40'}`}>{loc.name}</span>
                      </div>
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-white/5" />
                    )}
                  </button>
                );
              })}
            </div>
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
              const isSelected = selectedCharId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCharId(c.id)}
                  className={`w-full group text-left flex items-start gap-4 md:gap-6 p-4 md:p-6 rounded-[35px] transition-all duration-300 border active:scale-[0.98] ${isSelected ? 'bg-white/5 border-white/20 shadow-xl translate-x-2 cursor-default' : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 cursor-pointer'}`}
                >
                  <WarholAvatar src={c.avatar} colorClass={c.color} isSelected={isSelected} size="w-12 h-12 md:w-16 h-16" />
                  <div className="flex-1 space-y-1 md:space-y-2 py-0.5 md:py-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className={`text-sm md:text-base font-bold tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-white/30'}`}>{c.name}</span>
                        <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#bd8a78]/20 text-[#bd8a78]' : 'bg-white/5 text-white/10'}`}>{c.flavor}</span>
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
            className="p-8 rounded-[40px] bg-white/5 border border-white/10 space-y-6"
          >
            <div className="flex items-center gap-4 p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
              <div className={`w-3 h-3 rounded-full ${geminiKey ? 'bg-emerald-500 animate-pulse' : 'bg-white/10'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-500/80 tracking-widest uppercase mb-1">
                  {geminiKey ? 'Verified Connection' : 'Awaiting Connection'}
                </span>
                <p className="text-[9px] text-white/20 leading-relaxed font-serif">
                  {geminiKey ? '精神の回路は正常に接続されています。' : '設定（歯車）メニューからAPIキーを入力してください。'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== activeSlot) {
      handleSlotChange(index);
    }
  };


  if (!isAppReady || !user) {
    return (
      <LandingPage
        user={user}
        onLoginComplete={(key) => {
          if (key) {
            setGeminiKey(key);
            localStorage.setItem('itako_gemini_key', key);
          }
          setIsAppReady(true);
        }}
      />
    );
  }

  return (
    <div
      className="h-[100dvh] w-screen overflow-hidden flex flex-col font-sans selection:bg-white/30"
      style={{
        backgroundColor: '#000000',
        color: '#ffffff',
        '--itako-text-opacity': 1
      }}
    >

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden cursor-pointer"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#050505]/95 backdrop-blur-3xl border-r border-white/10 z-[70] p-6 sm:p-8 overflow-y-auto md:hidden shadow-[30px_0_60px_rgba(0,0,0,0.8)] itako-scrollbar"
            >
              <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-black tracking-tighter text-white font-oswald uppercase">Manager</span>
                  <span className="text-[7px] sm:text-[8px] font-bold tracking-[0.4em] text-white/30 uppercase mt-0.5">Control Center</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-12 h-12 -mr-2 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="pb-32">
                <ManagerContent />
              </div>

              {/* Status footer with safe area padding */}
              <div className="fixed bottom-0 left-0 w-[85%] max-w-sm p-6 sm:p-8 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent pointer-events-none">
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-lg pointer-events-auto">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-bold text-white/60 tracking-widest uppercase font-oswald">Mobile Link Stable</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header (Clean Architecture: Components / UI) */}
      <Header
        userName={userName}
        openDrawer={() => setIsDrawerOpen(true)}
        openSettings={() => setShowSettings(true)}
      />

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-zinc-900 border border-white/10 p-8 rounded-[40px] z-[120] shadow-3xl"
            >
              <div className="flex items-center justify-between mb-10">
                <span className="text-xl font-bold font-oswald tracking-widest text-white uppercase">Atmosphere</span>
                <button onClick={() => setShowSettings(false)} className="text-white/20 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-10">
                {/* Visual Settings Enforced to the Abyss */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] font-oswald text-left">Abyssal Theme</label>
                  </div>
                  <p className="text-[10px] text-white/60 font-serif leading-relaxed">
                    空間は常に深い闇と純白の言葉で覆われています。
                  </p>
                </div>

                {/* Gemini API Key - Now integrated into main settings for visibility */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] font-oswald text-left">Gemini Engine Key</label>
                    <div className={`w-1.5 h-1.5 rounded-full ${geminiKey ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                  </div>
                  <input
                    type="password"
                    placeholder="Enter API Key..."
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      localStorage.setItem('itako_gemini_key', e.target.value);
                    }}
                    className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white text-[10px] focus:ring-1 ring-[#fdb913]/30 outline-none transition-all placeholder:text-white/5"
                  />
                  {!geminiKey && (
                    <p className="text-[8px] font-bold text-[#fdb913]/50 uppercase tracking-widest text-center animate-pulse">
                      Waiting for spiritual key...
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-[9px] leading-relaxed text-white/20 font-serif italic text-center">
                    静かな深淵の奥底で、言葉の灯火をあなただけの明るさに。
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden relative">
        {/* PC Expandable Floating Bubbles */}
        <div className="hidden md:block w-24 shrink-0 relative z-10" />

        {/* 2. Individual Floating Dashboard Sections */}
        <div className="hidden md:flex flex-col gap-4 z-[110] absolute top-1/2 -translate-y-1/2 left-0 pl-6 pointer-events-none items-start">

          {/* 1. Account & Gear */}
          <motion.div
            initial={{ width: 64, height: 64 }}
            whileHover={{ width: 360 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden group/item shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-4 p-2 w-[340px] h-[64px] box-border">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover/item:bg-white/10 transition-colors">
                <User size={18} className="text-white/40 group-hover/item:text-white" />
              </div>
              <div className="flex-1 flex items-center justify-between opacity-0 group-hover/item:opacity-100 transition-all duration-300 pr-4">
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-transparent border-none text-sm font-bold tracking-tight text-white focus:ring-0 p-0 w-32"
                    placeholder="Account Name..."
                  />
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] font-oswald">Participant ID</span>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-3 text-white/20 hover:text-white transform hover:rotate-90 transition-all duration-500 cursor-pointer"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* 2. Registry (Characters) */}
          <motion.div
            initial={{ width: 64, height: 64 }}
            whileHover={{ width: 360, height: 'auto' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden group/item shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="w-[360px]">
              <div className="flex items-center gap-4 p-2 h-[64px] box-border">
                <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center shrink-0">
                  <Ghost size={20} className="text-white/20 group-hover/item:text-[#98a436] transition-colors" />
                </div>
                <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap">Registry (Participants)</h3>
              </div>

              <div className="opacity-0 group-hover/item:opacity-100 transition-all duration-300 px-4 pb-4 space-y-2 h-0 group-hover/item:h-auto overflow-hidden">
                {characters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCharId(c.id)}
                    className={`w-[320px] flex items-center gap-4 p-2 rounded-2xl border transition-all duration-300 active:scale-95 ${selectedCharId === c.id ? 'bg-white/5 border-white/20 shadow-lg cursor-default' : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 cursor-pointer'}`}
                  >
                    <WarholAvatar src={c.avatar} size="w-8 h-8 md:w-10 h-10" isSelected={selectedCharId === c.id} colorClass={c.color} />
                    <span className="text-xs font-bold tracking-wide text-white/80 whitespace-nowrap">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 3. Grid Map */}
          <motion.div
            initial={{ width: 64, height: 64 }}
            whileHover={{ width: 320, height: 'auto' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden group/item shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="w-[320px]">
              <div className="flex items-center gap-4 p-2 h-[64px] box-border">
                <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center shrink-0">
                  <Globe size={20} className="text-white/20 group-hover/item:text-[#fdb913] transition-colors" />
                </div>
                <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap">Grid Map</h3>
              </div>

              <div className="opacity-0 group-hover/item:opacity-100 transition-all duration-300 px-6 pb-6 h-0 group-hover/item:h-auto overflow-hidden w-[320px]">
                <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5 aspect-square max-w-[200px] ml-4">
                  {Array.from({ length: 9 }).map((_, i) => {
                    const loc = locations.find(l => l.pos === i);
                    const isSelected = selectedLocationId === loc?.id;
                    return (
                      <button
                        key={i}
                        onClick={() => loc && setSelectedLocationId(loc.id)}
                        className={`aspect-square flex items-center justify-center rounded transition-all duration-300 active:scale-95 ${isSelected ? 'bg-zinc-200 cursor-default shadow-sm' : 'bg-black/40 hover:bg-white/10 cursor-pointer'}`}
                      >
                        {loc && <MapPin size={12} className={isSelected ? 'text-black' : 'text-white/20'} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4. Connection Status */}
          <motion.div
            initial={{ width: 64, height: 64 }}
            whileHover={{ width: 280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden group/item shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="w-[280px] flex items-center gap-4 p-2 h-[64px] box-border">
              <div className="w-12 h-12 rounded-full bg-transparent flex flex-col items-center justify-center shrink-0 group-hover/item:bg-white/5 transition-colors">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex flex-col opacity-0 group-hover/item:opacity-100 transition-all duration-300">
                <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase mb-1 whitespace-nowrap">System Online</span>
                <span className="text-[8px] text-white/40 tracking-[0.2em] uppercase font-oswald whitespace-nowrap">Secure Connection</span>
              </div>
            </div>
          </motion.div>

        </div>


        {/* Main Timeline Scrollable Area */}
        <main
          ref={scrollRef}
          onScroll={handleScroll}
          className="timeline-container flex-1 itako-scrollbar"
        >
          <section className="timeline-slot p-6 md:p-12 overflow-y-auto bg-black">
            <div className="max-w-2xl mx-auto py-8 md:py-12 pb-80 md:pb-96">
              <header className="flex flex-col gap-2 mb-8 md:mb-10 px-2 md:px-4">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none font-oswald uppercase">1. News</h2>
                <p className="text-sm md:text-base font-bold text-[#bd8a78] pl-1 tracking-[0.3em] uppercase font-oswald">ニュース</p>
              </header>

              <div className="flex items-center justify-between mb-8 md:mb-12 px-2 border-b border-white/5 pb-4">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] font-oswald">Current Echoes ({news.length})</span>
                <span className="text-[10px] font-bold text-white/40 hover:text-white cursor-pointer transition-all tracking-widest uppercase font-oswald">Live Pulse</span>
              </div>

              {news.map((n, idx) => {
                return (
                  <div key={n.id} className="mb-12">
                    <SpiritCard
                      title={n.title}
                      content={n.content}
                      author="Soseki Natsume"
                      portraitUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Natsume_Souseki.jpg/330px-Natsume_Souseki.jpg"
                      flavor="Narrator"
                      colorClass="bg-white/5 text-inherit border-white/10"
                    />
                    {ichikawaScolds[n.id] && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="ml-auto w-[90%] md:w-[85%] mt-[-4rem] bg-zinc-100 p-8 md:p-10 rounded-[35px] md:rounded-[40px] border border-black/5 shadow-2xl relative z-20"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <WarholAvatar src="https://upload.wikimedia.org/wikipedia/commons/2/22/Photo-Book-of-Fusae-Ichikawa-11.jpg" colorClass="bg-itako-sage" size="w-7 h-7" isSelected />
                          <span className="text-[9px] font-bold tracking-[0.4em] text-zinc-900/30 uppercase">Ichikawa's Verdict / 叱咤</span>
                        </div>
                        <p className="text-base leading-relaxed italic text-black font-serif">「{ichikawaScolds[n.id]}」</p>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Slot 2: Main Dialog */}
          <section className="timeline-slot p-6 md:p-12 overflow-y-auto transition-all duration-1000 bg-black">
            <div className="max-w-2xl mx-auto min-h-full flex flex-col">
              <header className="flex flex-col gap-2 mb-6 md:mb-8 px-2 md:px-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none font-oswald uppercase">2. Dialog</h2>
                  <button
                    onClick={() => setIsUnderground(!isUnderground)}
                    className={`px-4 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all border font-oswald ${isUnderground ? 'bg-white text-[#1a1a1a] border-white' : 'bg-transparent text-white/40 border-white/10 hover:border-white/20'}`}
                  >
                    {isUnderground ? 'Surface' : 'Deep Trace'}
                  </button>
                </div>
                <p className="text-sm md:text-base font-bold text-white/30 pl-1 tracking-[0.3em] uppercase font-oswald truncate">{userName} / Speaking</p>
              </header>

              <div className="flex-1 flex flex-col gap-8 mt-4">
                {/* Chat Thread */}
                <div className="space-y-8 px-2 pb-80 md:pb-96">
                  <AnimatePresence>
                    {messages.map((m, i) => {
                      const isUser = m.role === 'user';
                      const charObj = characters.find(c => c.id === m.charId);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`p-6 md:p-7 rounded-[30px] shadow-sm max-w-[95%] md:max-w-[90%] ${isUser ? 'bg-black text-white border border-white/20 rounded-tr-none' : 'bg-black text-white border border-white/10 rounded-tl-none'}`}>
                            {!isUser && (
                              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                <div className="flex items-center gap-3">
                                  {charObj && <WarholAvatar src={charObj.avatar} colorClass={charObj.color} size="w-6 h-6" isSelected />}
                                  <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/20">{m.charId}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => handleBookmark(i)} className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/40 hover:text-white transition-colors">
                                    Bookmark
                                  </button>
                                </div>
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
                  {/* Spacer to prevent overlap with floating bar */}
                  <div className="h-64 md:h-80 shrink-0" />
                </div>
              </div>
            </div>
          </section>

          {/* Slot 3: Trends / イタコプラザでの流行 */}
          <section className="timeline-slot p-6 md:p-12 overflow-y-auto bg-black">
            <div className="max-w-2xl mx-auto py-8 md:py-12 pb-80 md:pb-96">
              <header className="flex flex-col gap-2 mb-12 px-2 md:px-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none font-oswald uppercase">3. Trends</h2>
                  <button
                    onClick={() => alert('同期を開始するには Antigravity に NotebookLM の URL を伝えてください。')}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-[#bd8a78] uppercase hover:bg-white/10 transition-all"
                  >
                    /sync-notebooklm
                  </button>
                </div>
                <p className="text-sm md:text-base font-bold text-[#bd8a78] pl-1 tracking-[0.3em] uppercase font-oswald">イタコプラザでの流行</p>
              </header>

              <div className="space-y-12">
                {/* Knowledge Sync Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-[30px] flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Knowledge Points</span>
                    <span className="text-2xl font-black text-white font-oswald">{notebookAccumulations.length}</span>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/10 rounded-[30px] flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Spirit Sync</span>
                    <span className="text-2xl font-black text-emerald-500 font-oswald">ACTIVE</span>
                  </div>
                </div>
                {/* Visual Insight Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-10 rounded-[50px] bg-gradient-to-br from-[#bd8a78]/20 to-transparent border border-[#bd8a78]/30 shadow-2xl"
                >
                  <div className="flex flex-col gap-6">
                    <span className="text-[10px] font-bold tracking-[0.5em] text-[#bd8a78] uppercase">Now Trending</span>
                    <h3 className="text-3xl font-bold text-white tracking-tighter leading-tight">
                      {futureSelfCritique || "深淵から湧き上がる新たな潮流..."}
                    </h3>
                    <p className="text-sm text-white/40 leading-relaxed">
                      広場で交わされる魂の対話から、今もっとも熱を帯びている言葉を抽出しました。
                    </p>
                  </div>
                </motion.div>

                {/* Abyssal Records (as Fragments of Trends) */}
                <div className="space-y-8">
                  <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.6em] px-4">Fragments of Spirit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archives.length > 0 ? archives.map((c, idx) => (
                      <motion.div
                        key={`${c.id}-${idx}`}
                        className="p-8 bg-white/5 border border-white/10 rounded-[40px] flex flex-col gap-4 group hover:bg-white/10 transition-all"
                      >
                        <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{c.author || 'Trend'}</div>
                        <div className="text-lg font-bold text-white/80 leading-tight">{c.title}</div>
                        <div className="text-xs leading-relaxed text-white/40 italic font-serif">" {c.quote} "</div>
                      </motion.div>
                    )) : (
                      <div className="col-span-2 py-20 text-center text-white/10 text-xs font-bold tracking-widest uppercase italic">
                        No trends recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Floating Input Bar */}
        <div className="fixed bottom-16 md:bottom-20 left-0 right-0 p-4 z-[100] pointer-events-none pb-safe">
          <div className="max-w-xl mx-auto flex items-center gap-3 bg-[#0a0a0a]/95 border border-white/20 p-1.5 pl-5 rounded-full shadow-[0_40px_80px_rgba(0,0,0,0.9)] pointer-events-auto transition-all duration-500 focus-within:border-white/40 focus-within:scale-[1.02]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="深淵へ言葉を記す..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm md:text-base py-3.5 resize-none h-14 leading-relaxed placeholder:text-white/10 font-sans"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center font-black text-lg font-oswald shadow-xl transition-all duration-300 active:scale-90 disabled:opacity-10 hover:bg-zinc-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="h-16 md:h-14 pb-2 md:pb-0 border-t border-white/10 bg-[#020202]/95 backdrop-blur-3xl flex items-center justify-center gap-16 sm:gap-24 px-6 z-[100] shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {[
            { id: 0, icon: <TrendingUp size={22} />, color: '#98a436', label: 'News' },
            { id: 1, icon: <MessageSquare size={22} />, color: '#fdb913', label: 'Dialog' },
            { id: 2, icon: <Ghost size={22} />, color: '#f15a24', label: 'Trends' },
          ].map(item => (
            <div
              key={item.id}
              onClick={() => scrollRef.current?.scrollTo({ left: window.innerWidth * item.id, behavior: 'smooth' })}
              style={{ color: activeSlot === item.id ? item.color : 'rgba(255,255,255,0.15)' }}
              className={`p-3 relative flex items-center justify-center transition-all duration-300 cursor-pointer transform active:scale-90 ${activeSlot === item.id ? 'scale-110 drop-shadow-md' : 'hover:scale-105 hover:text-white/40'}`}
              aria-label={item.label}
            >
              {item.icon}
              {activeSlot === item.id && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current shadow-[0_0_10px_current]" />
              )}
            </div>
          ))}
        </footer>
      </div>
    </div>
  );
}

export default App;
