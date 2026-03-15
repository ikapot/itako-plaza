// Itako Plaza v1.2.1 - Simplified Architecture
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { auth, fetchBookmarks, fetchNotebookAccumulations, saveNotebookAccumulation, updateLocationEnergy, fetchLocationEnergies } from './firebase';
import { invokeGemini, generateCharacterResponseStream, evaluateFutureSelf, validateGeminiApiKey, extractTrendsFromNotebook, generateWorldEvent, generateLocationDialogueWithEvent } from './gemini';
import { fetchFictionalizedNews } from './news';
import { searchNDLArchive } from './ndl';
import { INITIAL_CHARACTERS, INITIAL_LOCATIONS } from './constants';

// Components
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import SettingsOverlay from './components/SettingsOverlay';
import ManagerContent from './components/ManagerContent';
import Timeline from './components/Timeline';
import DashboardSidebar from './components/DashboardSidebar';
import FloatingInputBar from './components/FloatingInputBar';
import CharacterOverlay from './components/CharacterOverlay';
import { X } from 'lucide-react';

function cleanKey(key) {
  if (typeof key !== 'string') return key;
  const trimmed = key.trim();
  const match = trimmed.match(/^[A-Z0-9_]+=(.*)$/);
  return match ? match[1].trim() : trimmed;
}

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
  const [locationEnergies, setLocationEnergies] = useState({});
  const [enlargedCharId, setEnlargedCharId] = useState(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [currentWorldEvent, setCurrentWorldEvent] = useState(null);
  const [globalTrends, setGlobalTrends] = useState(() => {
    const cached = localStorage.getItem('itako_global_trends');
    return cached ? JSON.parse(cached) : null;
  });

  const scrollRef = useRef(null);
  const lastLocationRef = useRef(null);

  const characters = INITIAL_CHARACTERS.map(c => ({
    ...c,
    status: c.id === 'soseki' ? { '胃痛レベル': 3 } : { '不気味さ': '80%' } // Simplified status setup
  }));

  const handleToggleChar = useCallback((id) => {
    setSelectedCharIds(prev => (prev.includes(id) && prev.length > 1) 
      ? prev.filter(cId => cId !== id) 
      : [...new Set([...prev, id])]);
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
    if (await validateGeminiApiKey(geminiKey)) {
      setApiConnectionStatus('success');
      setIsAppReady(true);
      if (isDrawerOpen) setIsDrawerOpen(false);
    } else {
      setApiConnectionStatus('error');
    }
    setIsValidatingApi(false);
  }, [geminiKey, isValidatingApi, isDrawerOpen]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserName(currentUser.displayName || '彷徨える魂');
        const [savedBookMarks, data] = await Promise.all([fetchBookmarks(), fetchNotebookAccumulations()]);
        setBookmarks(savedBookMarks);
        setSpiritSharedKnowledge(data.map(acc => acc.content).join('\n---\n'));
        if (geminiKey) setIsAppReady(true);
      }
    });
    return () => unsubscribe();
  }, [geminiKey]);

  useEffect(() => {
    if (!geminiKey) return;
    fetchFictionalizedNews(geminiKey).then(setNews);
    
    const energyInterval = setInterval(async () => setLocationEnergies(await fetchLocationEnergies()), 10000);

    return () => { clearInterval(energyInterval); };
  }, [geminiKey]);

  useEffect(() => {
    const updateEvent = async () => {
      await new Promise(r => setTimeout(r, 2000)); // 起動直後のバーストを避ける
      const event = await generateWorldEvent(geminiKey, globalTrends);
      if (event) setCurrentWorldEvent(event);
    };
    if (geminiKey && isAppReady) {
      updateEvent();
      const eventInterval = setInterval(updateEvent, 300000);
      return () => clearInterval(eventInterval);
    }
  }, [geminiKey, isAppReady, globalTrends]);

  useEffect(() => {
    async function triggerLocationConversation() {
      if (!geminiKey || !isAppReady || lastLocationRef.current === selectedLocationId) return;
      lastLocationRef.current = selectedLocationId;
      setLoading(true);
      updateLocationEnergy(selectedLocationId, 15);

      const selectedChars = characters.filter(c => selectedCharIds.includes(c.id));
      const loc = INITIAL_LOCATIONS.find(l => l.id === selectedLocationId);
      const { generateLocationDialogueWithEvent } = await import('./gemini');
      const dialogue = await generateLocationDialogueWithEvent(geminiKey, selectedChars, loc, currentWorldEvent, spiritSharedKnowledge);
      
      if (dialogue?.length) {
        setMessages(prev => [...prev, ...dialogue.map(d => ({ role: 'ai', content: d.content, charId: d.charId }))]);
      }
      setLoading(false);
    }
    triggerLocationConversation();
  }, [selectedLocationId, selectedCharIds, geminiKey, currentWorldEvent, characters, isAppReady, spiritSharedKnowledge]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const charId = selectedCharIds[0];
    const currentChar = characters.find(c => c.id === charId);
    
    searchNDLArchive(userMsg).then(res => res?.length && setArchives(prev => [...res, ...prev].slice(0, 5)));

    setMessages(prev => [...prev, { role: 'ai', content: '', charId }]);

    try {
      const depth = Math.min(Math.floor(messages.filter(m => m.charId === charId).length / 2), 2);
      const context = [spiritSharedKnowledge, globalTrends?.summary ? `【トレンド】: ${globalTrends.summary}` : ''].filter(Boolean).join('\n\n');

      const location = INITIAL_LOCATIONS.find(l => l.id === selectedLocationId);

      await generateCharacterResponseStream(currentChar, userMsg, isUnderground, context, geminiKey, depth, (chunk, meta) => {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: chunk, meta };
          return next;
        });
      }, location);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSyncNotebook = async () => {
    if (!notebookInput.trim() || !geminiKey) return;
    setSyncingNotebook(true);
    const trends = await extractTrendsFromNotebook(notebookInput, geminiKey);
    if (trends) {
      setGlobalTrends(trends);
      localStorage.setItem('itako_global_trends', JSON.stringify(trends));
      setShowNotebookModal(false);
      setNotebookInput('');
    }
    setSyncingNotebook(false);
  };

  if (!isAppReady || !user) return <LandingPage user={user} onLoginComplete={setIsAppReady} />;

  const currentLocation = INITIAL_LOCATIONS.find(l => l.id === selectedLocationId);

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col font-sans selection:bg-white/30"
         style={{ backgroundColor: currentLocation?.color || '#000', backgroundImage: currentLocation?.pattern || 'none', backgroundSize: '40px 40px', color: '#fff' }}>
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-black/40 backdrop-blur-3xl border-r border-white/10 z-[70] p-6 overflow-y-auto md:hidden shadow-3xl">
              <Header userName={userName} openDrawer={() => setIsDrawerOpen(true)} openSettings={() => setShowSettings(true)} activeSlot={activeSlot} onSlotClick={(id) => scrollRef.current?.scrollTo({ left: window.innerWidth * id, behavior: 'smooth' })} {...{ activeManagerTab, setActiveManagerTab }} />
              <ManagerContent {...{ activeManagerTab, setActiveManagerTab, locations: INITIAL_LOCATIONS, selectedLocationId, setSelectedLocationId, locationEnergies, characters, selectedCharIds, handleToggleChar, setEnlargedCharId, geminiKey, setGeminiKey, isValidatingApi, apiConnectionStatus, handleValidateApi }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Header userName={userName} openDrawer={() => setIsDrawerOpen(true)} openSettings={() => setShowSettings(true)} activeSlot={activeSlot} onSlotClick={(id) => scrollRef.current?.scrollTo({ left: window.innerWidth * id, behavior: 'smooth' })} {...{ activeManagerTab, setActiveManagerTab }} />
      <SettingsOverlay {...{ showSettings, setShowSettings, geminiKey, setGeminiKey, isValidatingApi, apiConnectionStatus, validateGeminiApiKey, setIsAppReady }} />

      <div className="flex-1 flex overflow-hidden relative">
        <DashboardSidebar {...{ userName, setUserName, setShowSettings, characters, selectedCharIds, handleToggleChar, locations: INITIAL_LOCATIONS, selectedLocationId, setSelectedLocationId, locationEnergies }} />
        <Timeline {...{ scrollRef, handleScroll: (e) => handleSlotChange(Math.round(e.target.scrollLeft / e.target.offsetWidth)), news, characters, currentWorldEvent, isUnderground, setIsUnderground, userName, messages, loading, handleBookmark: async (i) => {}, globalTrends, setShowNotebookModal, futureSelfCritique, archives }} />
      </div>

      <FloatingInputBar {...{ input, setInput, handleSendMessage, loading }} />
      <CharacterOverlay {...{ enlargedCharId, setEnlargedCharId, characters, handleTalkTo }} />
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
