// Itako Plaza v1.2.1 - Simplified Architecture
import React, { useState, useEffect, useRef, useCallback, useMemo, useTransition, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { auth, loginWithGoogle, fetchBookmarks, fetchNotebookAccumulations, saveNotebookAccumulation, saveBookmark, logout } from './firebase';
import { invokeGemini, streamSpiritualDialogue, evaluateFutureSelf, validateGeminiApiKey, extractTrendsFromNotebook, extractTrendsFromNews, generateWorldEvent, setGeminiDebugCallback, getPreferredModel, setPreferredModel as setGeminiPreferredModel, distillSpiritualAlaya } from './gemini';
import { fetchFictionalizedNews } from './news';
import { searchNDLArchive } from './ndl';
import { INITIAL_CHARACTERS, AMBIENT_COLORS } from './constants';
import SpiritNoiseOverlay from './components/SpiritNoiseOverlay';

// Components
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import SettingsOverlay from './components/SettingsOverlay';
import ManagerContent from './components/ManagerContent';
import Timeline from './components/Timeline';
import DashboardSidebar from './components/DashboardSidebar';
import FloatingInputBar from './components/FloatingInputBar';
import CharacterOverlay from './components/CharacterOverlay';
import NamePromptModal from './components/NamePromptModal';
import { X, Activity } from 'lucide-react';

function cleanKey(key) {
  if (typeof key !== 'string') return key;
  const trimmed = key.trim();
  if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '') return '';
  const match = trimmed.match(/^[A-Z0-9_]+=(.*)$/);
  return match ? match[1].trim() : trimmed;
}

const APP_CHARACTERS = INITIAL_CHARACTERS.map(c => ({
  ...c,
  status: c.id === 'soseki' ? { '胃痛レベル': 3 } : { '不気味さ': '80%' }
}));

export default function App() {
  // --- 1. Identity & Auth States ---
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(() => localStorage.getItem('itako_user_name') || '無名の参列者');
  const [geminiKey, setGeminiKey] = useState(() => cleanKey(localStorage.getItem('itako_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || ''));
  const [isAppReady, setIsAppReady] = useState(false);
  const [isValidatingApi, setIsValidatingApi] = useState(false);
  const [apiConnectionStatus, setApiConnectionStatus] = useState('idle');

  // --- 2. Navigation & UI States ---
  const [activeSlot, setActiveSlot] = useState(0);
  const [activeManagerTab, setActiveManagerTab] = useState('directory');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [enlargedCharId, setEnlargedCharId] = useState(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [isUnderground, setIsUnderground] = useState(false);
  const [isEventShaking, setIsEventShaking] = useState(false);

  // 接続状況に応じたタブの自動切替
  useEffect(() => {
    const isPublicTab = activeManagerTab === 'grimoire' || activeManagerTab === 'account';
    if (activeManagerTab && !isPublicTab && (apiConnectionStatus !== 'success' || !geminiKey)) {
        setActiveManagerTab('connect');
    }
  }, [activeManagerTab, geminiKey, apiConnectionStatus]);

  // --- 3. Dialogue & Knowledge States ---
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('itako_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Persist messages whenever they change
  useEffect(() => {
    localStorage.setItem('itako_messages', JSON.stringify(messages));
  }, [messages]);

  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, content, charId }
  const [alaya, setAlaya] = useState(() => localStorage.getItem('itako_alaya') || "");
  const [bookmarks, setBookmarks] = useState([]);
  const [spiritSharedKnowledge, setSpiritSharedKnowledge] = useState('');
  const [archives, setArchives] = useState([]);
  const [futureSelfCritique, setFutureSelfCritique] = useState('');
  
  // --- 4. World & Character States ---
  const [selectedCharIds, setSelectedCharIds] = useState(['soseki']);

  const [currentWorldEvent, setCurrentWorldEvent] = useState(null);
  const [globalTrends, setGlobalTrends] = useState(() => {
    const cached = localStorage.getItem('itako_global_trends');
    return cached ? JSON.parse(cached) : null;
  });
  const [globalSentiment, setGlobalSentiment] = useState('neutral');
  
  // --- 5. System & Meta States ---
  const [apiLogs, setApiLogs] = useState([]);
  const [preferredModel, setPreferredModel] = useState(() => getPreferredModel());
  const [spiritualError, setSpiritualError] = useState(null);
  const [syncingNotebook, setSyncingNotebook] = useState(false);
  const [notebookInput, setNotebookInput] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // 初回起動時、名前が未設定なら案内人が名前を聞く
  useEffect(() => {
      if (isAppReady && userName === '無名の参列者') {
          setShowNamePrompt(true);
      }
  }, [isAppReady, userName]);

  const handleSetName = useCallback((newName) => {
      setUserName(newName);
      localStorage.setItem('itako_user_name', newName);
      setShowNamePrompt(false);
  }, []);

  // Derived Values
  const [news, setNews] = useState([]);

  const scrollRef = useRef(null);
  const lastLocationRef = useRef(null);

  function handleToggleChar(id) {
    setSelectedCharIds(prev => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter(cId => cId !== id) : prev;
      }
      return prev.length < 3 ? [...prev, id] : prev;
    });
  }

  const handleSetChars = useCallback((ids) => {
    setSelectedCharIds(ids.slice(0, 3));
  }, []);

  const handleSetPreferredModel = useCallback((modelId) => {
    setPreferredModel(modelId);
    setGeminiPreferredModel(modelId);
  }, []);

  const handleSetGeminiKey = useCallback((rawKey) => {
    const cleaned = cleanKey(rawKey);
    setGeminiKey(cleaned);
  }, []);

  const handleSlotChange = useCallback(async (index) => {
    setActiveSlot(index);
    if (index === 2 && geminiKey) {
      setLoading(true);
      const critique = await evaluateFutureSelf(bookmarks, geminiKey);
      setFutureSelfCritique(critique);
      setLoading(false);
    }
  }, [bookmarks, geminiKey]);

  const handleTalkTo = useCallback(async (charId) => {
    // 1. そのキャラクターのみを選択状態にする（または先頭に追加）
    setSelectedCharIds([charId]);
    
    // 2. 他のオーバーレイを閉じてスロット1（対話）へ切り替え
    setEnlargedCharId(null);
    setIsDrawerOpen(false);
    setActiveManagerTab(null);
    handleSlotChange(1);
    
    // 3. スクロール処理
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
    }, 100);

    // 4. 初回の呼び出しメッセージをトリガー
    // 少し待機してから送信（UIの切り替わりを考慮）
    setTimeout(() => {
        handleSendMessage("【対話の開始】あなたは呼び出されました。最初の挨拶と、あなたの現状への一言をお願いします。");
    }, 800);
  }, [handleSlotChange]);
  


  useEffect(() => {
    async function updateAlaya() {
      // isAppReadyがtrueになるまで（認証が確定するまで）実行しない
      if (!isAppReady) return;
      // 10メッセージごとに要約を更新
      const effectiveKey = user ? 'PROXY_MODE' : geminiKey;
      if (messages.length > 0 && messages.length % 10 === 0 && effectiveKey && effectiveKey !== '') {
        const summary = await distillSpiritualAlaya(messages, effectiveKey);
        if (summary) {
          setAlaya(summary);
          localStorage.setItem('itako_alaya', summary);
        }
      }
    }
    updateAlaya();
  }, [messages.length, geminiKey, user, isAppReady]);

  const handleValidateApi = useCallback(async (providedKey) => {
    const keyToValidate = providedKey ? cleanKey(providedKey) : geminiKey;
    if (!keyToValidate || isValidatingApi) return;
    
    setIsValidatingApi(true);
    const isValid = await validateGeminiApiKey(keyToValidate);
    
    if (isValid) {
      setGeminiKey(keyToValidate);
      localStorage.setItem('itako_gemini_key', keyToValidate);
      setApiConnectionStatus('success');
      setIsAppReady(true);
      setIsDrawerOpen(false);
    } else {
      setApiConnectionStatus('error');
    }
    setIsValidatingApi(false);
  }, [geminiKey, isValidatingApi]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserName(currentUser.displayName || '彷徨える魂');
        const [savedBookMarks, data] = await Promise.all([
          fetchBookmarks(), 
          fetchNotebookAccumulations()
        ]);
        setBookmarks(savedBookMarks);
        setSpiritSharedKnowledge(data.map(acc => acc.content).join('\n---\n'));
        
        // --- PHASE 2: Frictionless Onboarding ---
        // ログインしている場合は、個別のキーの有無に関わらず安全なプロキシ回路（PROXY_MODE）を優先する
        setGeminiKey('PROXY_MODE');
        setApiConnectionStatus('success');
        setIsAppReady(true);
      } else {
         // 未ログイン時は個別のキー設定があればそれを保持し、なければクリア
         setGeminiKey(prev => prev === 'PROXY_MODE' ? '' : prev);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleBookmark = async (index) => {
    const msg = messages[index];
    if (!msg || msg.role === 'user') return;
    
    // Find the previous user message for context
    let userMsg = "";
    for(let k = index - 1; k >= 0; k--) {
      if (messages[k].role === 'user') {
        userMsg = messages[k].content;
        break;
      }
    }

    const newBookmark = {
      userMsg,
      aiMsg: msg.content,
      charId: msg.charId,
      timestamp: Date.now()
    };
    
    setBookmarks(prev => [newBookmark, ...prev]);
    if (user) {
      await saveBookmark(userMsg, msg.content, msg.charId);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setBookmarks([]);
    setMessages([]);
    setIsAppReady(false);
  };

  const processWorldEvent = useCallback((event) => {
    setCurrentWorldEvent(event);
    setIsEventShaking(true);
    setTimeout(() => setIsEventShaking(false), 800);
    
    searchNDLArchive(event.content.substring(0, 10)).then(res => {
      if (res?.length) {
        setArchives(prev => [...res, ...prev].slice(0, 10));
      }
    });
  }, []);

  const manualRefreshSpiritWorld = useCallback(async () => {
    if (!geminiKey || loading) return;
    setLoading(true);
    
    try {
      // Phase 1: Refresh News
      const newsData = await fetchFictionalizedNews(geminiKey);
      setNews(newsData);
      
      // Phase 2: Update Spiritual Trends
      const trends = await extractTrendsFromNews(newsData, geminiKey).catch(() => null);
      if (trends) {
        setGlobalTrends(trends);
        localStorage.setItem('itako_global_trends', JSON.stringify(trends));
      }

      // Phase 3: Manifest Global Anomaly
      const event = await generateWorldEvent(geminiKey, trends || globalTrends).catch(() => null);
      if (event) {
        processWorldEvent(event);
      }
    } catch (err) {
      console.error("Spiritual disturbance during refresh:", err);
      if (err.status === 402 || err.status === 429) {
        setSpiritualError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [geminiKey, loading, globalTrends, processWorldEvent]);



  useEffect(() => {
    setGeminiDebugCallback((log) => {
      startTransition(() => {
        setApiLogs(prevLogs => {
          const newLog = { ...log, id: Date.now() + Math.random(), time: new Date().toLocaleTimeString() };
          return [newLog, ...prevLogs].slice(0, 20); // Keep last 20 logs
        });
      });
    });
  }, []); // Run once on mount


  /**
   * 対話の外部コンテキストを構築する
   */
  const buildDialogueOptions = useCallback((charId) => {
    const context = [
      spiritSharedKnowledge,
      globalTrends?.summary ? `【トレンド】: ${globalTrends.summary}` : ''
    ].filter(Boolean).join('\n\n');

    const interactionDepth = Math.min(Math.floor(messages.filter(m => m.charId === charId).length / 2), 2);
    const others = APP_CHARACTERS.filter(c => selectedCharIds.includes(c.id) && c.id !== charId);

    return {
      isUnderground,
      externalContext: context,
      interactionDepth,
      others,
      alaya,
      currentWorldEvent
    };
  }, [spiritSharedKnowledge, globalTrends, messages, selectedCharIds, isUnderground, alaya, currentWorldEvent]);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const updateDialogueInMessages = useCallback((charId, chunk, sentiment) => {
    setMessages(prev => {
      const next = [...prev];
      const lastIdx = next.length - 1;
      if (next[lastIdx]?.charId === charId) {
        next[lastIdx] = { ...next[lastIdx], content: chunk, sentiment };
      }
      return next;
    });
  }, []);

  const handleSendMessage = async (overrideMsg = null) => {
    const activeInput = overrideMsg || input;
    if (!activeInput.trim() || loading || !geminiKey) return;

    const userMsg = replyTo 
      ? `＞ ${replyTo.charId}: 「${replyTo.content}」\n\n${activeInput}`
      : activeInput;
      
    const charId = selectedCharIds[0];
    const currentChar = APP_CHARACTERS.find(c => c.id === charId);

    // Prepare UI state for dialogue
    setInput('');
    setReplyTo(null);
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: userMsg },
      { role: 'ai', content: '', charId }
    ]);
    setLoading(true);

    // Background research in archives
    searchNDLArchive(userMsg).then(res => {
      if (res?.length) setArchives(prev => [...res, ...prev].slice(0, 5));
    });

    try {
      const options = buildDialogueOptions(charId);
      const effectiveKey = user ? 'PROXY_MODE' : geminiKey;

      await streamSpiritualDialogue({
        character: currentChar,
        message: userMsg,
        apiKey: effectiveKey,
        options,
        onChunk: (chunk, meta) => {
          updateDialogueInMessages(charId, chunk, meta.sentiment);
          if (meta.sentiment) {
            startTransition(() => {
              setGlobalSentiment(meta.sentiment);
            });
          }
        }
      });
    
      handleSlotChange(1); // Auto-switch to dialog slot
    } catch (error) {
      console.error("Spiritual Dialogue Break:", error);
      setSpiritualError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNotebook = useCallback(async () => {
    if (!notebookInput.trim() || !geminiKey) return;
    setSyncingNotebook(true);
    try {
      const trends = await extractTrendsFromNotebook(notebookInput, geminiKey);
      if (trends) {
        setGlobalTrends(trends);
        localStorage.setItem('itako_global_trends', JSON.stringify(trends));
        setShowNotebookModal(false);
        setNotebookInput('');
      }
    } finally {
      setSyncingNotebook(false);
    }
  }, [notebookInput, geminiKey]);


  const ambient = useMemo(() => AMBIENT_COLORS[globalSentiment] || AMBIENT_COLORS.neutral, [globalSentiment]);

  if (!isAppReady || !user) {
    const prepareSession = (key) => {
      if (!key) return;
      setGeminiKey(key);
      setIsAppReady(true);
    };

    return (
      <LandingPage 
        user={user} 
        onLoginComplete={(key) => handleValidateApi(key)}
        geminiKey={geminiKey}
        setGeminiKey={handleSetGeminiKey}
        isValidatingApi={isValidatingApi}
        apiConnectionStatus={apiConnectionStatus}
        handleValidateApi={() => handleValidateApi()}
      />
    );
  }

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col font-sans selection:bg-white/30 relative
                    ${isEventShaking ? 'spiritual-shake' : ''}`}
         data-api-status={apiConnectionStatus}
         style={{ '--sentiment-accent': globalSentiment === 'neutral' ? 'rgba(255,255,255,0.02)' : `${ambient.color}44` }}>
      
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${globalSentiment}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{ 
              backgroundColor: ambient.color, 
              backgroundImage: ambient.pattern, 
              backgroundSize: '40px 40px',
            }}
          />
        </AnimatePresence>
        {/* Persistent Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 opacity-60" />
        
        {/* Sentiment Glow Overlay */}
        <AnimatePresence>
          {globalSentiment !== 'neutral' ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ 
                backgroundColor: ambient.color,
                filter: 'blur(100px)',
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isDrawerOpen ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#0a0a0a]/95 backdrop-blur-3xl border-r border-white/5 z-[70] p-6 overflow-y-auto md:hidden ">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black font-oswald uppercase tracking-wider text-white/90">System</h2>
                  <span className="text-[10px] font-bold text-[#f15a24] uppercase tracking-[0.3em]">Management Console</span>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <ManagerContent {...{ activeManagerTab, setActiveManagerTab, user, loginWithGoogle, handleLogout, characters: APP_CHARACTERS, selectedCharIds, handleToggleChar, handleSetChars, setEnlargedCharId, geminiKey, setGeminiKey: handleSetGeminiKey, isValidatingApi, apiConnectionStatus, handleValidateApi: (key) => handleValidateApi(key), globalSentiment, bookmarks, messages, userName, preferredModel, setPreferredModel: handleSetPreferredModel }} />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <Header userName={userName} openDrawer={() => setIsDrawerOpen(true)} openSettings={() => setShowSettings(true)} activeSlot={activeSlot} onSlotClick={(id) => scrollRef.current?.scrollTo({ left: window.innerWidth * id, behavior: 'smooth' })} {...{ activeManagerTab, setActiveManagerTab, globalSentiment, apiStatus: apiConnectionStatus }} />
      <SettingsOverlay {...{ showSettings, setShowSettings, geminiKey, setGeminiKey: handleSetGeminiKey, isValidatingApi, apiConnectionStatus, handleValidateApi, setIsAppReady }} />
      <SpiritNoiseOverlay
        error={spiritualError}
        onRetry={() => { setSpiritualError(null); handleSendMessage(); }}
        onDismiss={() => setSpiritualError(null)}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <DashboardSidebar {...{ userName, setUserName, setShowSettings, characters: APP_CHARACTERS, selectedCharIds, handleToggleChar, setActiveManagerTab, manualRefreshSpiritWorld, isRefreshing: loading, handleLogout }} />

        {/* Main Timeline View */}
        <Timeline {...{ scrollRef, handleScroll: (e) => handleSlotChange(Math.round(e.target.scrollLeft / e.target.offsetWidth)), news, characters: APP_CHARACTERS, currentWorldEvent, isUnderground, setIsUnderground, userName, messages, loading, handleBookmark, handleReply: setReplyTo, globalTrends, setShowNotebookModal, futureSelfCritique, archives, globalSentiment }} />

        {/* Manager Overlay (Map, Registry, Connect) */}
        <AnimatePresence>
          {activeManagerTab ? (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-8"
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setActiveManagerTab(null)} />
              
              <div className="relative w-full max-w-5xl h-full max-h-[92vh] md:max-h-[85vh] flex flex-col pointer-events-auto">
                {/* Conduit Status Monitor (Debug Sidebar) */}
                <div className="hidden xl:block absolute -right-64 top-0 w-60 h-full glass-spectral rounded-3xl p-4 overflow-hidden border-white/5">
                  <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-white/20 mb-4 font-oswald flex items-center gap-2">
                    <Activity size={12} className="text-emerald-500" />
                    Spirit Conduits
                  </h3>
                  <div className="space-y-3 overflow-y-auto max-h-[90%] itako-scrollbar-thin pr-2">
                    {apiLogs.map(log => (
                      <div key={log.id} className="border-l-2 border-white/5 pl-3 py-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${
                            log.type === 'error' ? 'text-red-400' : 
                            log.type === 'success' ? 'text-emerald-400' : 'text-zinc-500'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-[7px] text-white/10">{log.time}</span>
                        </div>
                        <p className="text-[9px] font-medium text-white/60 truncate">{log.model}</p>
                        {log.error ? (
                          <p className="text-[7px] text-red-500/60 leading-tight mt-1 break-words line-clamp-2">{log.error}</p>
                        ) : null}
                      </div>
                    ))}
                    {apiLogs.length === 0 ? (
                      <p className="text-[9px] text-white/10 italic text-center py-10 tracking-widest uppercase font-oswald">Silence as a language...</p>
                    ) : null}
                  </div>
                </div>

                <motion.div 
                  layoutId="manager-content"
                  className="w-full h-full glass-spectral rounded-t-[32px] md:rounded-[40px] border-t md:border border-white/10  overflow-hidden flex flex-col relative"
                >
                  <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/5 bg-black/40">
                    <h2 className="text-lg md:text-2xl font-black font-oswald uppercase tracking-[0.2em] text-[#f15a24] flex items-center gap-3">
                      <span className="opacity-20 text-white hidden sm:inline">ITKO_SYS_01_</span>
                      {activeManagerTab === 'directory' ? 'SPIRIT_INDEX' : activeManagerTab?.toUpperCase()}
                    </h2>
                    <button 
                      onClick={() => setActiveManagerTab(null)}
                      className="p-2 text-white/20 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto itako-scrollbar-thin">
                    <ManagerContent {...{ activeManagerTab, setActiveManagerTab, user, loginWithGoogle, handleLogout, characters: APP_CHARACTERS, selectedCharIds, handleToggleChar, handleSetChars, setEnlargedCharId, geminiKey, setGeminiKey: handleSetGeminiKey, isValidatingApi, apiConnectionStatus, handleValidateApi: (key) => handleValidateApi(key), globalSentiment, bookmarks, messages, userName, onManifestSoul: handleTalkTo }} />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {activeManagerTab ? null : (
        <FloatingInputBar {...{ input, setInput, handleSendMessage, loading, replyTo, onCancelReply: handleCancelReply }} />
      )}
      <CharacterOverlay {...{ enlargedCharId, setEnlargedCharId, characters: APP_CHARACTERS, handleTalkTo }} />
      {/* Sync Modal Simplified */}
      <AnimatePresence>
        {showNotebookModal ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-8">
              <h3 className="text-2xl font-bold font-oswald text-white mb-6">Sync Thought</h3>
              <textarea value={notebookInput} onChange={(e) => setNotebookInput(e.target.value)} className="w-full h-40 bg-black border border-white/30 rounded-2xl p-4 text-white mb-6 resize-none" />
              <div className="flex justify-end gap-4"><button onClick={handleSyncNotebook} className="bg-white text-black px-6 py-2 rounded-full font-bold uppercase">{syncingNotebook ? 'Syncing...' : 'Inject'}</button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <NamePromptModal isOpen={showNamePrompt} onSubmit={handleSetName} />
    </div>
  );
}
