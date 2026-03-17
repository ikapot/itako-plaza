// Itako Plaza v1.2.1 - Simplified Architecture
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { auth, fetchBookmarks, fetchNotebookAccumulations, saveNotebookAccumulation, updateLocationEnergy, fetchLocationEnergies, saveBookmark, logout } from './firebase';
import { invokeGemini, streamSpiritualDialogue, evaluateFutureSelf, validateGeminiApiKey, extractTrendsFromNotebook, generateWorldEvent, generateLocationDialogueWithEvent, setGeminiDebugCallback } from './gemini';
import { fetchFictionalizedNews } from './news';
import { searchNDLArchive } from './ndl';
import { INITIAL_CHARACTERS, INITIAL_LOCATIONS, AMBIENT_COLORS } from './constants';

// Components
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import SettingsOverlay from './components/SettingsOverlay';
import ManagerContent from './components/ManagerContent';
import Timeline from './components/Timeline';
import DashboardSidebar from './components/DashboardSidebar';
import FloatingInputBar from './components/FloatingInputBar';
import CharacterOverlay from './components/CharacterOverlay';
import { X, Activity } from 'lucide-react';

function cleanKey(key) {
  if (typeof key !== 'string') return key;
  const trimmed = key.trim();
  const match = trimmed.match(/^[A-Z0-9_]+=(.*)$/);
  return match ? match[1].trim() : trimmed;
}

const APP_CHARACTERS = INITIAL_CHARACTERS.map(c => ({
  ...c,
  status: c.id === 'soseki' ? { '胃痛レベル': 3 } : { '不気味さ': '80%' }
}));

export default function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(() => localStorage.getItem('itako_user_name') || '無名の参列者');
  const [geminiKey, setGeminiKey] = useState(() => cleanKey(localStorage.getItem('itako_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || ''));
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharIds, setSelectedCharIds] = useState(['soseki']);
  const [selectedLocationId, setSelectedLocationId] = useState('cafe');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeManagerTab, setActiveManagerTab] = useState('map');
  const [isUnderground, setIsUnderground] = useState(false);
  const [news, setNews] = useState([]);
  const [archives, setArchives] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [futureSelfCritique, setFutureSelfCritique] = useState('');
  const [spiritSharedKnowledge, setSpiritSharedKnowledge] = useState('');
  const [notebookInput, setNotebookInput] = useState('');
  const [syncingNotebook, setSyncingNotebook] = useState(false);
  const [isValidatingApi, setIsValidatingApi] = useState(false);
  const [apiConnectionStatus, setApiConnectionStatus] = useState('idle');
  const [apiLogs, setApiLogs] = useState([]); // New state for API logs
  const [locationEnergies, setLocationEnergies] = useState({});
  const [enlargedCharId, setEnlargedCharId] = useState(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [currentWorldEvent, setCurrentWorldEvent] = useState(null);
  const [globalTrends, setGlobalTrends] = useState(() => {
    const cached = localStorage.getItem('itako_global_trends');
    return cached ? JSON.parse(cached) : null;
  });
  const [isEventShaking, setIsEventShaking] = useState(false);
  const isMeltingDown = useMemo(() => Object.values(locationEnergies).some(e => e > 85), [locationEnergies]);
  const [globalSentiment, setGlobalSentiment] = useState('neutral');

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

  const handleSlotChange = useCallback(async (index) => {
    setActiveSlot(index);
    if (index === 2 && geminiKey) {
      setLoading(true);
      const critique = await evaluateFutureSelf(bookmarks, geminiKey);
      setFutureSelfCritique(critique);
      setLoading(false);
    }
  }, [bookmarks, geminiKey]);

  const handleTalkTo = useCallback((charId) => {
    handleToggleChar(charId);
    handleSlotChange(1);
    setIsDrawerOpen(false);
    setEnlargedCharId(null);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
    }, 100);
  }, [handleToggleChar, handleSlotChange]);

  const handleValidateApi = useCallback(async () => {
    if (!geminiKey || isValidatingApi) return;
    
    setIsValidatingApi(true);
    const isValid = await validateGeminiApiKey(geminiKey);
    
    if (isValid) {
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
        const [savedBookMarks, data, energies] = await Promise.all([
          fetchBookmarks(), 
          fetchNotebookAccumulations(),
          fetchLocationEnergies()
        ]);
        setBookmarks(savedBookMarks);
        setSpiritSharedKnowledge(data.map(acc => acc.content).join('\n---\n'));
        setLocationEnergies(energies);
        if (geminiKey) setIsAppReady(true);
      }
    });
    return () => unsubscribe();
  }, [geminiKey]);

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

  useEffect(() => {
    if (!geminiKey) return;
    
    // 起動時のリクエストが重ならないようにずらす
    const timeout = setTimeout(() => {
      fetchFictionalizedNews(geminiKey).then(setNews);
    }, 2000);
    
    const energyInterval = setInterval(async () => setLocationEnergies(await fetchLocationEnergies()), 10000);

    return () => { 
      clearTimeout(timeout);
      clearInterval(energyInterval); 
    };
  }, [geminiKey]);

  useEffect(() => {
    const updateEvent = async () => {
      await new Promise(r => setTimeout(r, 4000)); // ニュース取得と重ならないようにさらに遅延
      const event = await generateWorldEvent(geminiKey, globalTrends);
      if (event) {
        setCurrentWorldEvent(event);
        setIsEventShaking(true);
        setTimeout(() => setIsEventShaking(false), 800);
      }
    };
    if (geminiKey && isAppReady) {
      updateEvent();
      const eventInterval = setInterval(updateEvent, 300000);
      return () => clearInterval(eventInterval);
    }
  }, [geminiKey, isAppReady, globalTrends]);

  useEffect(() => {
    setGeminiDebugCallback((log) => {
      setApiLogs(prevLogs => {
        const newLog = { ...log, id: Date.now() + Math.random(), time: new Date().toLocaleTimeString() };
        return [newLog, ...prevLogs].slice(0, 20); // Keep last 20 logs
      });
    });
  }, []); // Run once on mount

  useEffect(() => {
    async function triggerLocationConversation() {
      if (!geminiKey || !isAppReady || lastLocationRef.current === selectedLocationId) return;
      lastLocationRef.current = selectedLocationId;
      
      // 他の初期化処理が落ち着くまで待機
      await new Promise(r => setTimeout(r, 6000));
      
      setLoading(true);
      updateLocationEnergy(selectedLocationId, 15);

      const selectedChars = APP_CHARACTERS.filter(c => selectedCharIds.includes(c.id));
      const loc = INITIAL_LOCATIONS.find(l => l.id === selectedLocationId);
      const dialogue = await generateLocationDialogueWithEvent(geminiKey, selectedChars, loc, currentWorldEvent, spiritSharedKnowledge);
      
      if (dialogue?.length) {
        setMessages(prev => [...prev, ...dialogue.map(d => ({ role: 'ai', content: d.content, charId: d.charId, sentiment: d.sentiment }))]);
        const lastSentiment = dialogue[dialogue.length - 1]?.sentiment;
        if (lastSentiment) setGlobalSentiment(lastSentiment);
      }
      setLoading(false);
    }
    triggerLocationConversation();
  }, [selectedLocationId, selectedCharIds, geminiKey, currentWorldEvent, APP_CHARACTERS, isAppReady, spiritSharedKnowledge]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const charId = selectedCharIds[0];
    const currentChar = APP_CHARACTERS.find(c => c.id === charId);
    
    searchNDLArchive(userMsg).then(res => res?.length && setArchives(prev => [...res, ...prev].slice(0, 5)));

    setMessages(prev => [...prev, { role: 'ai', content: '', charId }]);

    try {
      const depth = Math.min(Math.floor(messages.filter(m => m.charId === charId).length / 2), 2);
      const context = [spiritSharedKnowledge, globalTrends?.summary ? `【トレンド】: ${globalTrends.summary}` : ''].filter(Boolean).join('\n\n');

      const location = INITIAL_LOCATIONS.find(l => l.id === selectedLocationId);
      const otherChars = APP_CHARACTERS.filter(c => selectedCharIds.includes(c.id) && c.id !== charId);

      await streamSpiritualDialogue({
        character: currentChar,
        message: userMsg,
        apiKey: geminiKey,
        options: {
          isUnderground,
          externalContext: context,
          interactionDepth: depth,
          location,
          others: otherChars
        },
        onChunk: (chunk, meta) => {
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], content: chunk, meta };
            return next;
          });
          if (meta?.sentiment) setGlobalSentiment(meta.sentiment);
        }
      });
    
    // Automatically switch to Dialog tab
    handleSlotChange(1);
  } catch (e) {
    console.error(e);
  }
  setLoading(false);
};

  async function handleSyncNotebook() {
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
  }

  if (!isAppReady || !user) {
    function prepareSession(key) {
      if (!key) return;
      setGeminiKey(key);
      setIsAppReady(true);
    }

    return (
      <LandingPage 
        user={user} 
        onLoginComplete={prepareSession}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        isValidatingApi={isValidatingApi}
        apiConnectionStatus={apiConnectionStatus}
        handleValidateApi={handleValidateApi}
      />
    );
  }

  const currentLocation = INITIAL_LOCATIONS.find(l => l.id === selectedLocationId);
  const ambient = AMBIENT_COLORS[globalSentiment] || AMBIENT_COLORS.neutral;

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col font-sans selection:bg-white/30 relative
                    ${isEventShaking ? 'spiritual-shake' : ''} 
                    ${isMeltingDown ? 'ui-meltdown' : ''}`}
         data-api-status={apiConnectionStatus}
         style={{ '--sentiment-accent': globalSentiment === 'neutral' ? 'rgba(255,255,255,0.02)' : `${ambient.color}44` }}>
      
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${globalSentiment}-${selectedLocationId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{ 
              backgroundColor: globalSentiment !== 'neutral' ? ambient.color : (currentLocation?.color || '#000'), 
              backgroundImage: globalSentiment !== 'neutral' ? ambient.pattern : (currentLocation?.pattern || 'none'), 
              backgroundSize: '40px 40px',
            }}
          />
        </AnimatePresence>
        {/* Persistent Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 opacity-60" />
        
        {/* Sentiment Glow Overlay */}
        <AnimatePresence>
          {globalSentiment !== 'neutral' && (
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
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-black/40 backdrop-blur-3xl border-r border-white/10 z-[70] p-6 overflow-y-auto md:hidden shadow-3xl">
              <Header userName={userName} openDrawer={() => setIsDrawerOpen(true)} openSettings={() => setShowSettings(true)} activeSlot={activeSlot} onSlotClick={(id) => scrollRef.current?.scrollTo({ left: window.innerWidth * id, behavior: 'smooth' })} {...{ activeManagerTab, setActiveManagerTab, globalSentiment, apiStatus: apiConnectionStatus }} />
              <ManagerContent {...{ activeManagerTab, setActiveManagerTab, locations: INITIAL_LOCATIONS, selectedLocationId, setSelectedLocationId, locationEnergies, characters: APP_CHARACTERS, selectedCharIds, handleToggleChar, handleSetChars, setEnlargedCharId, geminiKey, setGeminiKey, isValidatingApi, apiConnectionStatus, handleValidateApi, globalSentiment, bookmarks, messages, userName }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Header userName={userName} openDrawer={() => setIsDrawerOpen(true)} openSettings={() => setShowSettings(true)} activeSlot={activeSlot} onSlotClick={(id) => scrollRef.current?.scrollTo({ left: window.innerWidth * id, behavior: 'smooth' })} {...{ activeManagerTab, setActiveManagerTab, globalSentiment, apiStatus: apiConnectionStatus }} />
      <SettingsOverlay {...{ showSettings, setShowSettings, geminiKey, setGeminiKey, isValidatingApi, apiConnectionStatus, validateGeminiApiKey, setIsAppReady }} />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <DashboardSidebar {...{ userName, setUserName, setShowSettings, characters: APP_CHARACTERS, selectedCharIds, handleToggleChar, locations: INITIAL_LOCATIONS, selectedLocationId, setSelectedLocationId, locationEnergies }} />
        
        {/* Main Timeline View */}
        <Timeline {...{ scrollRef, handleScroll: (e) => handleSlotChange(Math.round(e.target.scrollLeft / e.target.offsetWidth)), news, characters: APP_CHARACTERS, currentWorldEvent, isUnderground, setIsUnderground, userName, messages, loading, handleBookmark, globalTrends, setShowNotebookModal, futureSelfCritique, archives, globalSentiment }} />

        {/* Manager Overlay (Map, Registry, Connect) */}
        <AnimatePresence>
          {activeManagerTab ? (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setActiveManagerTab(null)} />
              
              <div className="relative w-full max-w-5xl h-full max-h-[85vh] flex flex-col pointer-events-auto">
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
                        {log.error && (
                          <p className="text-[7px] text-red-500/60 leading-tight mt-1 break-words line-clamp-2">{log.error}</p>
                        )}
                      </div>
                    ))}
                    {apiLogs.length === 0 && (
                      <p className="text-[9px] text-white/10 italic text-center py-10 tracking-widest uppercase font-oswald">Silence as a language...</p>
                    )}
                  </div>
                </div>

                <motion.div 
                  layoutId="manager-content"
                  className="w-full h-full glass-spectral rounded-[40px] border border-white/10 shadow-3xl overflow-hidden flex flex-col relative"
                >
                  <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-2xl font-black font-oswald uppercase tracking-widest text-white/40">
                      System / {activeManagerTab}
                    </h2>
                    <button 
                      onClick={() => setActiveManagerTab(null)}
                      className="p-2 text-white/20 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto itako-scrollbar-thin">
                    <ManagerContent {...{ activeManagerTab, setActiveManagerTab, locations: INITIAL_LOCATIONS, selectedLocationId, setSelectedLocationId, locationEnergies, characters: APP_CHARACTERS, selectedCharIds, handleToggleChar, handleSetChars, setEnlargedCharId, geminiKey, setGeminiKey, isValidatingApi, apiConnectionStatus, handleValidateApi, globalSentiment, bookmarks, messages, userName }} />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <FloatingInputBar {...{ input, setInput, handleSendMessage, loading }} />
      <CharacterOverlay {...{ enlargedCharId, setEnlargedCharId, characters: APP_CHARACTERS, handleTalkTo }} />
      {/* Sync Modal Simplified */}
      <AnimatePresence>{showNotebookModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-8">
            <h3 className="text-2xl font-bold font-oswald text-white mb-6">Sync Thought</h3>
            <textarea value={notebookInput} onChange={(e) => setNotebookInput(e.target.value)} className="w-full h-40 bg-black border border-white/30 rounded-2xl p-4 text-white mb-6 resize-none" />
            <div className="flex justify-end gap-4"><button onClick={handleSyncNotebook} className="bg-white text-black px-6 py-2 rounded-full font-bold uppercase">{syncingNotebook ? 'Syncing...' : 'Inject'}</button></div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
