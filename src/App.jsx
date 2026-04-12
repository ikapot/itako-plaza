// Itako Plaza v1.3.0 - Refactored Architecture
import React, { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { loginWithGoogle, saveNotebookAccumulation, fetchNotebookAccumulations } from './firebase';
import { validateGeminiApiKey, setGeminiDebugCallback, getPreferredModel, setPreferredModel as setGeminiPreferredModel, evaluateFutureSelf } from './gemini';
import { INITIAL_CHARACTERS, AMBIENT_COLORS } from './constants';

// Hooks
import { useItakoAuth } from './hooks/useItakoAuth';
import { useWorldState } from './hooks/useWorldState';
import { useSpiritualDialogue } from './hooks/useSpiritualDialogue';

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
import SpiritNoiseOverlay from './components/SpiritNoiseOverlay';
import { X, Library, User, Cpu, Bookmark, Settings, RotateCw, Activity } from 'lucide-react';

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
  // --- 1. Base Strategy & Keys ---
  const [geminiKey, setGeminiKey] = useState(() => cleanKey(localStorage.getItem('itako_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || 'PROXY_MODE'));
  const [isValidatingApi, setIsValidatingApi] = useState(false);
  const [apiConnectionStatus, setApiConnectionStatus] = useState('idle');
  const [apiLogs, setApiLogs] = useState([]);
  const [preferredModel, setPreferredModel] = useState(() => getPreferredModel());

  // --- 2. Custom Hooks Integration ---
  const { 
    user, userName, setUserName, daysRemaining, bookmarks, setBookmarks, 
    spiritSharedKnowledge, setSpiritSharedKnowledge, isAppReady, handleSetName, handleLogout, alaya, setAlaya, handleAddBookmark
  } = useItakoAuth();

  const {
    news, globalTrends, globalSentiment, setGlobalSentiment, currentWorldEvent, 
    isEventShaking, archives, setArchives, manualRefreshSpiritWorld
  } = useWorldState(geminiKey);

  const {
    messages, input, setInput, loading, setLoading, replyTo, setReplyTo, 
    spiritualError, setSpiritualError, handleSendMessage 
  } = useSpiritualDialogue(
    geminiKey, user, spiritSharedKnowledge, globalTrends, currentWorldEvent, daysRemaining, setArchives, setGlobalSentiment, alaya, setAlaya
  );

  // --- 3. UI & Navigation States ---
  const [activeSlot, setActiveSlot] = useState(0);
  const [activeManagerTab, setActiveManagerTab] = useState('directory');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [enlargedCharId, setEnlargedCharId] = useState(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [isUnderground, setIsUnderground] = useState(false);
  const [selectedCharIds, setSelectedCharIds] = useState(['soseki']);
  const [futureSelfCritique, setFutureSelfCritique] = useState('');
  const [notebookInput, setNotebookInput] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const scrollRef = useRef(null);

  // Initial Logic
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isAppReady && userName === '無名の参列者') {
      setShowNamePrompt(true);
    }
  }, [isAppReady, userName]);

  // Sync state to UI helper
  useEffect(() => {
    const isPublicTab = activeManagerTab === 'grimoire' || activeManagerTab === 'account';
    if (activeManagerTab && !isPublicTab && (apiConnectionStatus !== 'success' || !geminiKey)) {
        setActiveManagerTab('connect');
    }
  }, [activeManagerTab, geminiKey, apiConnectionStatus]);

  // --- 4. Handlers ---
  const handleToggleChar = useCallback((id) => {
    setSelectedCharIds(prev => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter(cId => cId !== id) : prev;
      }
      return prev.length < 3 ? [...prev, id] : prev;
    });
  }, []);

  const handleSlotChange = useCallback(async (index, shouldScrollToBottom = false) => {
    setActiveSlot(index);
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            left: scrollRef.current.offsetWidth * index,
            behavior: 'smooth'
        });
    }

    if (index === 1 && shouldScrollToBottom) {
      setTimeout(() => {
        const timelineSlots = document.querySelectorAll('.timeline-slot');
        const dialogSlot = timelineSlots[1];
        if (dialogSlot) {
          dialogSlot.scrollTo({ top: dialogSlot.scrollHeight, behavior: 'smooth' });
        }
      }, 300);
    }

    if (index === 2 && geminiKey) {
      setLoading(true);
      const critique = await evaluateFutureSelf(bookmarks, geminiKey);
      setFutureSelfCritique(critique);
      setLoading(false);
    }
  }, [bookmarks, geminiKey, setLoading]);

  const handleSendMessageWrapper = useCallback((textOverride = null, charIdOverride = null) => {
    handleSendMessage({
      textOverride,
      charIdOverride,
      isUnderground,
      selectedCharIds,
      onAutoSlotChange: handleSlotChange
    });
  }, [handleSendMessage, isUnderground, selectedCharIds, handleSlotChange]);

  const handleTalkTo = useCallback(async (charId) => {
    setSelectedCharIds([charId]);
    setEnlargedCharId(null);
    setIsDrawerOpen(false);
    setActiveManagerTab(null);
    handleSlotChange(1);
    setTimeout(() => {
      handleSendMessageWrapper("【対話の開始】あなたは呼び出されました。最初の挨拶と、あなたの現状への一言をお願いします。", charId);
    }, 800);
  }, [handleSlotChange, handleSendMessageWrapper]);

  const handleValidateApi = useCallback(async (providedKey) => {
    const keyToValidate = providedKey ? cleanKey(providedKey) : geminiKey;
    if (!keyToValidate || isValidatingApi) return;
    
    setIsValidatingApi(true);
    const isValid = await validateGeminiApiKey(keyToValidate);
    
    if (isValid) {
      setGeminiKey(keyToValidate);
      localStorage.setItem('itako_gemini_key', keyToValidate);
      setApiConnectionStatus('success');
      setIsDrawerOpen(false);
    } else {
      setApiConnectionStatus('error');
    }
    setIsValidatingApi(false);
  }, [geminiKey, isValidatingApi]);

  const handleSyncNotebook = useCallback(async () => {
    if (!notebookInput.trim() || !geminiKey) return;
    setLoading(true); // Reusing loading from dialogue hook
    try {
      await saveNotebookAccumulation(notebookInput);
      const data = await fetchNotebookAccumulations();
      setSpiritSharedKnowledge(data.map(acc => acc.content).join('\n---\n'));
      setShowNotebookModal(false);
      setNotebookInput('');
    } finally {
      setLoading(false);
    }
  }, [notebookInput, geminiKey, setSpiritSharedKnowledge, setLoading]);

  useEffect(() => {
    setGeminiDebugCallback((log) => {
      startTransition(() => {
        setApiLogs(prevLogs => {
          const newLog = { ...log, id: Date.now() + Math.random(), time: new Date().toLocaleTimeString() };
          return [newLog, ...prevLogs].slice(0, 20);
        });
      });
    });
  }, []);

  const ambient = useMemo(() => AMBIENT_COLORS[globalSentiment] || AMBIENT_COLORS.neutral, [globalSentiment]);

  // --- Render ---
  if (!isAppReady || !user) {
    return (
      <LandingPage 
        user={user} 
        onLoginComplete={(key) => handleValidateApi(key)}
        geminiKey={geminiKey}
        setGeminiKey={(k) => setGeminiKey(cleanKey(k))}
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
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${globalSentiment}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{ backgroundColor: ambient.color, backgroundImage: ambient.pattern, backgroundSize: '40px 40px' }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 opacity-60" />
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#0a0a0a]/95 backdrop-blur-3xl border-r border-white/5 z-[70] p-6 overflow-y-auto md:hidden ">
              <div className="flex flex-col gap-2">
                {[
                  { id: 'library', label: 'THE LIBRARY', icon: <Library size={18} />, color: '#f15a24' },
                  { id: 'directory', label: 'SPIRIT_INDEX', icon: <User size={18} />, color: '#EAE0D5' },
                  { id: 'trading', label: 'AUTOMATED TRADING', icon: <Activity size={18} />, color: '#325ba0' },
                  { id: 'connect', label: 'CONDUIT', icon: <Cpu size={18} />, color: '#f15a24' },
                  { id: 'account', label: 'RECORDS', icon: <Bookmark size={18} />, color: '#b45309' },
                ].map(item => (
                  <button key={item.id} onClick={() => { setActiveManagerTab(item.id); setIsDrawerOpen(false); }} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 ${activeManagerTab === item.id ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <span className="text-[11px] font-black tracking-widest uppercase font-oswald">{item.label}</span>
                  </button>
                ))}
                <button onClick={() => { manualRefreshSpiritWorld(geminiKey, loading, globalTrends); setIsDrawerOpen(false); }} className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/60 mt-2">
                  <RotateCw size={18} />
                  <span className="text-[11px] font-black tracking-widest uppercase font-oswald">REFRESH_SPIRIT_WORLD</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Header 
        userName={userName} openDrawer={() => setIsDrawerOpen(true)} openSettings={() => setShowSettings(true)} 
        activeSlot={activeSlot} onSlotClick={(idx) => handleSlotChange(idx, idx === 1)} daysRemaining={daysRemaining}
        {...{ activeManagerTab, setActiveManagerTab, globalSentiment, apiStatus: apiConnectionStatus }} 
      />
      <SettingsOverlay {...{ showSettings, setShowSettings, geminiKey, setGeminiKey: (k) => setGeminiKey(cleanKey(k)), isValidatingApi, apiConnectionStatus, handleValidateApi }} />
      <SpiritNoiseOverlay error={spiritualError} onRetry={() => { setSpiritualError(null); handleSendMessageWrapper(); }} onDismiss={() => setSpiritualError(null)} />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <DashboardSidebar {...{ userName, setUserName, setShowSettings, characters: APP_CHARACTERS, selectedCharIds, handleToggleChar, setActiveManagerTab, manualRefreshSpiritWorld: () => manualRefreshSpiritWorld(geminiKey, loading, globalTrends), isRefreshing: loading, handleLogout }} />
        <Timeline {...{ scrollRef, handleScroll: (e) => handleSlotChange(Math.round(e.target.scrollLeft / e.target.offsetWidth)), news, characters: APP_CHARACTERS, currentWorldEvent, isUnderground, setIsUnderground, userName, messages, loading, handleBookmark: (idx) => handleAddBookmark(messages[idx], idx, messages), handleReply: setReplyTo, globalTrends, setShowNotebookModal, futureSelfCritique, archives, globalSentiment }} />
        <AnimatePresence>
          {activeManagerTab && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-8">
              <div className="absolute inset-0 bg-black/40" onClick={() => setActiveManagerTab(null)} />
              <div className="relative w-full max-w-5xl h-full max-h-[92vh] md:max-h-[85vh] flex flex-col pointer-events-auto">
                <motion.div layoutId="manager-content" className="w-full h-full glass-spectral rounded-t-[32px] md:rounded-[40px] border-t md:border border-white/10 overflow-hidden flex flex-col relative">
                  <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/5 bg-black/40">
                    <h2 className="text-lg md:text-2xl font-black font-oswald uppercase tracking-[0.2em] text-[#f15a24]">
                      {activeManagerTab === 'directory' ? 'SPIRIT_INDEX' : activeManagerTab?.toUpperCase()}
                    </h2>
                    <button onClick={() => setActiveManagerTab(null)} className="p-2 text-white/20 hover:text-white"><X size={24} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto itako-scrollbar-thin">
                    <ManagerContent {...{ activeManagerTab, setActiveManagerTab, user, loginWithGoogle, handleLogout, characters: APP_CHARACTERS, selectedCharIds, handleToggleChar, handleSetChars: (ids) => setSelectedCharIds(ids.slice(0, 3)), setEnlargedCharId, geminiKey, setGeminiKey: (k) => setGeminiKey(cleanKey(k)), isValidatingApi, apiConnectionStatus, handleValidateApi, globalSentiment, bookmarks, messages, userName, onManifestSoul: handleTalkTo }} />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!activeManagerTab && <FloatingInputBar {...{ input, setInput, handleSendMessage: handleSendMessageWrapper, loading, replyTo, onCancelReply: () => setReplyTo(null) }} />}
      <CharacterOverlay {...{ enlargedCharId, setEnlargedCharId, characters: APP_CHARACTERS, handleTalkTo }} />
      <AnimatePresence>
        {showNotebookModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-8">
              <h3 className="text-2xl font-bold font-oswald text-white mb-6">Sync Thought</h3>
              <textarea value={notebookInput} onChange={(e) => setNotebookInput(e.target.value)} className="w-full h-40 bg-black border border-white/30 rounded-2xl p-4 text-white mb-6 resize-none" />
              <div className="flex justify-end gap-4"><button onClick={handleSyncNotebook} className="bg-white text-black px-6 py-2 rounded-full font-bold uppercase">{loading ? 'Syncing...' : 'Inject'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <NamePromptModal isOpen={showNamePrompt} onSubmit={handleSetName} />
    </div>
  );
}
