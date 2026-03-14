// Itako Plaza v1.1.0 - Refined Timeline & Auth Flow
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, TrendingUp, User, MapPin, Ghost, Settings, Loader2, Quote, Menu, X, Cpu, Globe } from 'lucide-react';
import { auth, fetchBookmarks, saveBookmark, fetchNotebookAccumulations, saveNotebookAccumulation, updateLocationEnergy, fetchLocationEnergies } from './firebase';
import { generateCharacterResponseStream, evaluateFutureSelf, validateGeminiApiKey, extractTrendsFromNotebook } from './gemini';
import { fetchFictionalizedNews, generateIchikawaScolding } from './news';
import { searchNDLArchive } from './ndl';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import WarholAvatar from './components/WarholAvatar';
import SpiritCard from './components/SpiritCard';
import CubeMap from './components/CubeMap';

const INITIAL_CHARACTERS = [
  { id: 'soseki', name: '夏目漱石', flavor: '胃痛', color: 'bg-itako-clay', description: '日本の小説家、評論家。代表作『吾輩は猫である』。深く鋭い人間洞察を持つ。', avatar: 'assets/soseki_warhol.png', isPreStyled: true },
  { id: 'dosto', name: 'ドストエフスキー', flavor: '借金', color: 'bg-itako-sand', description: 'ロシアの小説家。代表作『罪と罰』。魂の極限状態を描くリアリズムの巨匠。', avatar: 'assets/dosto_warhol.png', isPreStyled: true },
  { id: 'ichikawa', name: '市川房枝', flavor: '厳格', color: 'bg-itako-sage', description: '日本の婦人運動家、政治家。参政権獲得から「理想選挙」の追求まで、政治の浄化に生涯を捧げた。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Photo-Book-of-Fusae-Ichikawa-11.jpg' },
  { id: 'atsuko', name: 'Atsuko', flavor: '見守り', color: 'bg-itako-sand', description: '広場の片隅で静かにすべてを記録し続ける、超越的な観察者の魂。', avatar: 'assets/atsuko_warhol.png', isPreStyled: true },
  { id: 'k_kokoro', name: 'K', flavor: '絶望', color: 'bg-zinc-800', description: '『こころ』の登場人物。宗教的理想と人間的感情の間で苦悩する孤高の青年。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Japanese_student_c1900.jpg/330px-Japanese_student_c1900.jpg' },
  { id: 'alyosha', name: 'アリョーシャ', flavor: '信仰', color: 'bg-itako-sage', description: '『カラマーゾフの兄弟』のアリョーシャ。純真な心を持ち、世界のあらゆる罪を背負おうとする。', avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Alyosha_Vanya.jpg/330px-Alyosha_Vanya.jpg' },
  { id: 'raicho', name: '平塚らいてう', flavor: '太陽', color: 'bg-orange-900/50', description: '思想家、女性解放運動家。「元始、女性は太陽であった」と宣言し、個の覚めと平和を求め続けた。', avatar: 'assets/raicho_warhol.png', isPreStyled: true },
  { id: 'fumiko', name: '金子文子', flavor: '自己', color: 'bg-red-950/60', description: 'アナキスト。天皇制を否定し、獄中で「自己」を貫き通した。著書『何が私をこうさせたか』。', avatar: 'assets/fumiko_warhol.png', isPreStyled: true },
  { id: 'rand', name: 'アイン・ランド', flavor: '利己', color: 'bg-zinc-700', description: '客観主義の提唱者であり、『肩をすくめるアトラス』の著者。合理的な利己心こそが人間の最高の美徳であると断じ、集団主義や相互扶助を「魂の寄生」として激しく拒絶する。', avatar: 'assets/rand_placeholder.png', isPreStyled: false },
];

const INITIAL_LOCATIONS = [
  // Face 1: 現世の残影 (Glimmer) - 9 locations
  { id: 'cafe', name: 'カフェ', face: 0, pos: 0, tags: ['narrow'], description: '微かなコーヒーの香りが生者の執着を思い出させる。', color: '#1a1a1a', pattern: 'radial-gradient(circle, #222 1px, transparent 1px)' },
  { id: 'library', name: '図書館', face: 0, pos: 1, tags: ['quiet'], description: '開かれることのない蔵書たちが、重力のような沈黙を強いている。', color: '#0f141a', pattern: 'linear-gradient(45deg, #ffffff03 25%, transparent 25%)' },
  { id: 'garden', name: '庭園', face: 0, pos: 2, tags: ['wide', 'nature'], description: '枯れない花々。時間はここでは結晶化している。', color: '#0f1a0f', pattern: 'radial-gradient(circle, #1a2a1a 1px, transparent 1px)' },
  { id: 'elevator', name: '昇降機', face: 0, pos: 3, tags: ['narrow'], description: '閉ざされた立方体。目的地のない沈黙。', color: '#111', pattern: 'linear-gradient(to bottom, #222 1px, transparent 1px)' },
  { id: 'park', name: '広い公園', face: 0, pos: 4, tags: ['wide'], description: '空が剥き出しの場所。誰ともすれ違わない散歩道。', color: '#1a2a1a', pattern: 'radial-gradient(circle at 50% 50%, #2a3a2a 20%, transparent 80%)' },
  { id: 'market', name: '市場', face: 0, pos: 5, tags: ['noisy'], description: '物々交換される記憶。中身のない言葉が飛び交う。', color: '#1a150f', pattern: 'repeating-linear-gradient(45deg, #222, #222 2px, transparent 2px, transparent 10px)' },
  { id: 'school', name: '校舎', face: 0, pos: 6, tags: ['quiet'], description: '永遠に終わらない放課後のチャイム。', color: '#151a20', pattern: 'linear-gradient(to bottom, #1a2a3a 1px, transparent 1px)' },
  { id: 'roof', name: '屋上', face: 0, pos: 7, tags: ['wide'], description: 'フェンスの向こう側は、何もない空。', color: '#0a1015', pattern: 'linear-gradient(to bottom, #1a2a3a, transparent)' },
  { id: 'theatre', name: '劇場', face: 0, pos: 8, tags: ['wide'], description: '観客のいない舞台。拍手の残響だけが揺れている。', color: '#1a0505', pattern: 'radial-gradient(ellipse at center, #300 0%, transparent 70%)' },

  // Face 2: 忘却の回廊 (Oblivion) - 9 locations
  { id: 'passage', name: '地下通路', face: 1, pos: 0, tags: ['narrow'], description: 'すべての後悔へと通じている冷たいコンクリートの回廊。', color: '#050505', pattern: 'repeating-linear-gradient(0deg, #111 0, #111 1px, transparent 0, transparent 20px)' },
  { id: 'stair', name: '螺旋階段', face: 1, pos: 1, tags: ['narrow'], description: '上っても下っても、同じ階層に辿り着く。', color: '#0a0a0a', pattern: 'conic-gradient(from 0deg, #111, #000)' },
  { id: 'mirror', name: '鏡の間', face: 1, pos: 2, tags: ['narrow'], description: '自分以外のすべてが映る鏡。', color: '#101015', pattern: 'linear-gradient(135deg, #222 25%, transparent 25%)' },
  { id: 'waiting', name: '待合室', face: 1, pos: 3, tags: ['quiet'], description: 'いつまでも来ない列車を待つ影たち。', color: '#0f0f0f', pattern: 'radial-gradient(circle, #222 2px, transparent 2px)' },
  { id: 'prison', name: '独房', face: 1, pos: 4, tags: ['narrow'], description: '自己との対面を強いる最小限の空間。', color: '#111', pattern: 'none' },
  { id: 'window', name: '額縁の窓', face: 1, pos: 5, tags: ['quiet'], description: '風景を切り取ったまま動かない。', color: '#050a15', pattern: 'linear-gradient(to bottom, #0a1a2a, transparent)' },
  { id: 'door', name: '開かずの扉', face: 1, pos: 6, tags: ['narrow'], description: '鍵のない境界線。向こう側の気配。', color: '#150505', pattern: 'linear-gradient(to right, #200, transparent)' },
  { id: 'box', name: '暗室', face: 1, pos: 7, tags: ['narrow'], description: '意識だけが漂う暗闇。', color: '#000', pattern: 'none' },
  { id: 'archive_room', name: '地下書庫', face: 1, pos: 8, tags: ['quiet'], description: '湿った紙の断片が、誰かの一生を黙殺している。', color: '#0a0505', pattern: 'repeating-linear-gradient(0deg, #211, #000 2px)' },

  // Face 3: 静寂の聖域 (Sanctuary) - 9 locations
  { id: 'shrine', name: '神社', face: 2, pos: 0, tags: ['quiet'], description: '形なき祈りだけが風に震えている。', color: '#1a0f0f', pattern: 'radial-gradient(circle, #300 2px, transparent 2px)' },
  { id: 'altar', name: '祭壇', face: 2, pos: 1, tags: ['quiet'], description: '供えられたのは、名もなき者の悔恨。', color: '#150f15', pattern: 'radial-gradient(circle at 50% 50%, #202, transparent)' },
  { id: 'temple', name: '寺院', face: 2, pos: 2, tags: ['wide'], description: '鐘の音は空へは昇らず、地へと染み込む。', color: '#0f0f05', pattern: 'repeating-conic-gradient(#110 0deg 10deg, #000 10deg 20deg)' },
  { id: 'forest', name: '鎮守の森', face: 2, pos: 3, tags: ['nature', 'wide'], description: '木々の隙間に、誰かの瞳が光る。', color: '#051005', pattern: 'radial-gradient(circle, #020 3px, transparent 3px)' },
  { id: 'lake', name: '静かな湖', face: 2, pos: 4, tags: ['wide', 'nature'], description: '波紋のない水面。深淵の入口。', color: '#0a1a1a', pattern: 'radial-gradient(ellipse at center, #0a2a2a 0%, #000 70%)' },
  { id: 'mountain', name: '虚無山', face: 2, pos: 5, tags: ['wide', 'nature'], description: '道のない山。登るほどに自分を失う。', color: '#1a1005', pattern: 'linear-gradient(to top, #210, transparent)' },
  { id: 'graveyard', name: '墓地', face: 2, pos: 6, tags: ['quiet'], description: '名前が削れた石碑。死者さえ忘れた墓。', color: '#0a0f0a', pattern: 'radial-gradient(circle, #121 1px, transparent 1px)' },
  { id: 'tower', name: '五重塔', face: 2, pos: 7, tags: ['narrow'], description: '天への梯子。途中で途切れている。', color: '#1a1005', pattern: 'linear-gradient(to top, #210, transparent)' },
  { id: 'cliff', name: '断崖', face: 2, pos: 8, tags: ['nature'], description: 'ここから先は、言葉のない領域。', color: '#0a0a0a', pattern: 'linear-gradient(to top, #111, transparent)' },

  // Face 4: 混沌の吹き溜まり (Chaos) - 9 locations
  { id: 'backalley', name: '路地裏', face: 3, pos: 0, tags: ['narrow'], description: '捨てられた概念が腐敗している。', color: '#0a0a0a', pattern: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)' },
  { id: 'casino', name: '賽の河原賭博場', face: 3, pos: 1, tags: ['gambling', 'narrow'], description: '魂を賭けてサイコロを振る、終わりのない遊戯。', color: '#1a0505', pattern: 'radial-gradient(circle at center, #300 0%, #000 80%)' },
  { id: 'neon', name: 'ネオン街', face: 3, pos: 2, tags: ['noisy'], description: '電圧の低い欲望。明滅する幽霊文字。', color: '#0a051a', pattern: 'linear-gradient(90deg, #102 1px, transparent 1px)' },
  { id: 'junkyard', name: '廃材置場', face: 3, pos: 3, tags: ['wide'], description: '意味を失った機械たちの、冷たい囁き。', color: '#1a1a1a', pattern: 'repeating-linear-gradient(45deg, #222, #000 5px)' },
  { id: 'underpass', name: 'ガード下', face: 3, pos: 4, tags: ['narrow'], description: '絶え間ない振動。誰の足音でもない。', color: '#050505', pattern: 'linear-gradient(transparent 50%, #111 50%)' },
  { id: 'slum', name: '裏通りの吹き溜まり', face: 3, pos: 5, tags: ['narrow'], description: '希望が廃棄された場所。', color: '#1a0a05', pattern: 'none' },
  { id: 'canal', name: '運河', face: 3, pos: 6, tags: ['wide'], description: 'オイルの浮いた水面が、偽物の月を映す。', color: '#051010', pattern: 'radial-gradient(circle at 10% 10%, #122, transparent)' },
  { id: 'port', name: '亡霊の港', face: 3, pos: 7, tags: ['wide'], description: '出航しない船だけが繋がれている。', color: '#0a1015', pattern: 'none' },
  { id: 'factory', name: '廃工場', face: 3, pos: 8, tags: ['wide'], description: 'リズムだけが生き続ける、主のいない生産ライン。', color: '#111', pattern: 'repeating-linear-gradient(90deg, #222 0, #222 2px, transparent 0, transparent 40px)' },

  // Face 5: 残響の境界 (Boundary) - 9 locations
  { id: 'bridge', name: '橋', face: 4, pos: 0, tags: ['wide'], description: '過去の記憶をどこか遠くへ運んでいく。', color: '#0f1a1a', pattern: 'linear-gradient(to right, #ffffff05 1px, transparent 1px)' },
  { id: 'station', name: '無人駅', face: 4, pos: 1, tags: ['wide'], description: '改札口を通る者は、もう誰もいない。', color: '#151515', pattern: 'repeating-linear-gradient(90deg, #222, #222 1px, transparent 1px, transparent 50px)' },
  { id: 'pier', name: '桟橋', face: 4, pos: 2, tags: ['narrow'], description: '霧の向こうから、呼び聲が聞こえる。', color: '#101520', pattern: 'radial-gradient(circle, #1a2030 1px, transparent 1px)' },
  { id: 'sea', name: '亡霊の海', face: 4, pos: 3, tags: ['wide', 'nature'], description: '岸のない海。記憶が塩分となって溶けている。', color: '#050a15', pattern: 'radial-gradient(ellipse at 50% 100%, #0a2a4a 0%, #000 80%)' },
  { id: 'lighthouse', name: '灯台', face: 4, pos: 4, tags: ['narrow'], description: '光は魂を導かず、ただ闇を薙ぎ払う。', color: '#1a1a05', pattern: 'conic-gradient(from 180deg at 50% 0%, #331, transparent)' },
  { id: 'beach', name: '砂浜', face: 4, pos: 5, tags: ['wide', 'nature'], description: '打ち寄せられるのは、漂流した未練。', color: '#1a1a15', pattern: 'radial-gradient(ellipse, #222, transparent)' },
  { id: 'island', name: '浮島', face: 4, pos: 6, tags: ['nature'], description: '根を持たない地。浮遊する虚無。', color: '#101010', pattern: 'radial-gradient(circle, #222, transparent 50%)' },
  { id: 'ship', name: '難破船', face: 4, pos: 7, tags: ['narrow'], description: '沈みきれないまま漂う後悔の船体。', color: '#0a0a0a', pattern: 'none' },
  { id: 'bottom', name: '海底', face: 4, pos: 8, tags: ['wide', 'quiet'], description: 'すべての音が光と共に消え去る場所。', color: '#000510', pattern: 'none' },

  // Face 6: 深淵の核 (Abyssal Heart) - 9 locations
  { id: 'core', name: '核', face: 5, pos: 0, tags: ['narrow'], description: 'すべての魂が収束し、消失する点。', color: '#000000', pattern: 'radial-gradient(circle, #111 2px, transparent 2px)' },
  { id: 'monolith', name: '方尖柱', face: 5, pos: 1, tags: ['narrow'], description: '天を貫く垂直の意志。文字が刻まれている。', color: '#050505', pattern: 'linear-gradient(to right, #1a1a1a, transparent)' },
  { id: 'oracle', name: '神託所', face: 5, pos: 2, tags: ['quiet'], description: '返ってくるのは自分の声だけ。', color: '#050a0a', pattern: 'radial-gradient(circle, #122 1px, transparent 1px)' },
  { id: 'void', name: '虚無', face: 5, pos: 3, tags: ['wide'], description: '色も音も、名前も。すべてが許されない場所。', color: '#000000', pattern: 'none' },
  { id: 'archive', name: '終焉書庫', face: 5, pos: 4, tags: ['quiet'], description: '宇宙の終わりの一秒前まで記された記録。', color: '#0a0505', pattern: 'repeating-linear-gradient(0deg, #211, #000 2px)' },
  { id: 'gate', name: '門', face: 5, pos: 5, tags: ['narrow'], description: '本当の出口か、あるいは永遠の入り口か。', color: '#000000', pattern: 'linear-gradient(45deg, #111 25%, transparent 25%)' },
  { id: 'throne', name: '空の玉座', face: 5, pos: 6, tags: ['wide'], description: '支配なき支配者が坐る、絶対的な不在。', color: '#050505', pattern: 'none' },
  { id: 'mirror_abyss', name: '深淵の鏡', face: 5, pos: 7, tags: ['narrow'], description: '覗き込む時、向こう側もあなたを見ている。', color: '#000', pattern: 'radial-gradient(circle at center, #111, transparent)' },
  { id: 'end', name: '終焉', face: 5, pos: 8, tags: ['wide'], description: 'すべてが完了し、新たな静止が始まる。', color: '#111', pattern: 'none' },
];

// --- コンポーネント群は /components フォルダへ退避 (Clean Code) ---

function App() {
  const cleanKey = (key) => {
    if (typeof key !== 'string') return key;
    const trimmed = key.trim();
    const match = trimmed.match(/^[A-Z0-9_]+=(.*)$/);
    return match ? match[1].trim() : trimmed;
  };

  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('無名の参列者');
  const [geminiKey, setGeminiKey] = useState(cleanKey(localStorage.getItem('itako_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || ''));
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharIds, setSelectedCharIds] = useState(['soseki']);
  const handleToggleChar = (id) => {
    setSelectedCharIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // At least one must be selected
        return prev.filter(cId => cId !== id);
      }
      return [...prev, id];
    });
  };
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
  const [isValidatingApi, setIsValidatingApi] = useState(false);
  const [apiConnectionStatus, setApiConnectionStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [locationEnergies, setLocationEnergies] = useState({});

  // Trends & NotebookLM State
  const [enlargedCharId, setEnlargedCharId] = useState(null);
  const [globalTrends, setGlobalTrends] = useState(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [syncingNotebook, setSyncingNotebook] = useState(false);
  const [currentWorldEvent, setCurrentWorldEvent] = useState(null);
  const [isEventPulsing, setIsEventPulsing] = useState(false);

  // キャラクターと場所の拡張可能なリスト
  const [characters, setCharacters] = useState(INITIAL_CHARACTERS.map(c => ({
    ...c,
    status: c.id === 'soseki' ? { '胃痛レベル': 3 } :
      c.id === 'dosto' ? { '借金額': '50,000ルーブル' } :
        c.id === 'ichikawa' ? { '論理的厳格さ': '高' } :
          c.id === 'k_kokoro' ? { '絶望度': '深' } :
            c.id === 'alyosha' ? { '信仰心': '不変' } :
              c.id === 'raicho' ? { '内なる光': '極大' } :
                c.id === 'fumiko' ? { '魂の自律': '絶対' } :
                  c.id === 'rand' ? { '合理的利己心': '不滅' } :
                    { '不気味さ': '80%' }
  })));
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);

  const scrollRef = useRef(null);

  useEffect(() => {
    function onAuthChange(currentUser) {
      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser(currentUser);
      setUserName(currentUser.displayName || '彷徨える魂');

      // ログイン後のデータ取得
      Promise.all([fetchBookmarks(), fetchNotebookAccumulations()])
        .then(([savedBookMarks, data]) => {
          setBookmarks(savedBookMarks);
          const shared = data.map(acc => acc.content).join('\n---\n');
          setSpiritSharedKnowledge(shared);
          if (geminiKey) setIsAppReady(true);
        });
    }

    const unsubscribe = auth.onAuthStateChanged(onAuthChange);

    async function loadGlobalData() {
      if (!geminiKey) return;

      if (auth.currentUser) {
        setIsAppReady(true);
      }

      const syncKey = geminiKey.slice(-6);
      if (sessionStorage.getItem(`itako_loading_${syncKey}`)) return;
      sessionStorage.setItem(`itako_loading_${syncKey}`, '1');

      const initialNews = await fetchFictionalizedNews(geminiKey);
      setNews(initialNews);

      const cachedTrends = localStorage.getItem('itako_global_trends');
      if (cachedTrends) setGlobalTrends(JSON.parse(cachedTrends));
    }

    loadGlobalData();

    // 世界事変の更新ループ (5分おき)
    const updateEvent = async () => {
      if (!geminiKey) return;
      const { generateWorldEvent } = await import('./gemini');
      const event = await generateWorldEvent(geminiKey, globalTrends);
      setCurrentWorldEvent(event);
      setIsEventPulsing(true);
      setTimeout(() => setIsEventPulsing(false), 10000);
    };
    updateEvent();
    const eventInterval = setInterval(updateEvent, 300000);

    const energyInterval = setInterval(async () => {
      const energies = await fetchLocationEnergies();
      setLocationEnergies(energies);
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(energyInterval);
      clearInterval(eventInterval);
    };
  }, [geminiKey]);

  const lastLocationRef = useRef(null);
  useEffect(() => {
    const triggerLocationConversation = async () => {
      if (!geminiKey || !isAppReady) return;
      if (lastLocationRef.current === selectedLocationId) return;
      const currentLocation = locations.find(l => l.id === selectedLocationId);
      if (!currentLocation) return;
      if (!lastLocationRef.current) { lastLocationRef.current = selectedLocationId; return; }

      lastLocationRef.current = selectedLocationId;
      setLoading(true);

      updateLocationEnergy(selectedLocationId, 15);

      // Multiple characters support
      const selectedChars = characters.filter(c => selectedCharIds.includes(c.id));
      
      try {
        const { generateLocationDialogueWithEvent } = await import('./gemini');
        const dialogue = await generateLocationDialogueWithEvent(
          geminiKey, 
          selectedChars, 
          currentLocation, 
          currentWorldEvent, 
          spiritSharedKnowledge
        );
        
        if (Array.isArray(dialogue)) {
          setMessages(prev => [...prev, ...dialogue.map(d => ({ role: 'ai', content: d.content, charIds: d.charIds || [d.charId] }))]);
        }
      } catch (e) {
        console.error("Location Dialogue Error:", e);
      }
      setLoading(false);
    };

    triggerLocationConversation();
  }, [selectedLocationId, selectedCharIds, geminiKey, currentWorldEvent]);

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

  const handleSyncNotebook = async () => {
    if (!notebookInput.trim() || !geminiKey) return;
    setSyncingNotebook(true);
    try {
      const trends = await extractTrendsFromNotebook(notebookInput, geminiKey);
      if (trends) {
        setGlobalTrends(trends);
        localStorage.setItem('itako_global_trends', JSON.stringify(trends));
        setShowNotebookModal(false);
        setNotebookInput('');
      } else {
        alert("思考の同期に失敗しました。");
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。");
    } finally {
      setSyncingNotebook(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    const userMsg = input;
    setInput('');

    // Add user message locally
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    // Create a placeholder for the AI message
    const currentChar = characters.find(c => c.id === selectedCharId);
    if (!currentChar) {
      console.error("Character not found:", selectedCharId);
      setMessages(prev => [...prev, { role: 'ai', content: '【霊障】対話相手が見つかりません。', charId: 'system' }]);
      setLoading(false);
      return;
    }

    // NDL検索（話題に関連するアーカイブの提示）
    searchNDLArchive(userMsg).then(results => {
      if (results && results.length > 0) {
        setArchives(prev => [...results, ...prev].slice(0, 5));
      }
    });

    setMessages(prev => [...prev, { role: 'ai', content: '', charId: selectedCharId }]);

    let finalAiResp = "";
    try {
      // Calculate 'depth' based on how many messages the current character has in the log
      const characterMessageCount = messages.filter(m => m.charId === selectedCharId).length;
      // 0: Introduction (Short), 1: Warming up (Medium), 2+: Deep monologue (Long)
      const interactionDepth = Math.min(Math.floor(characterMessageCount / 2), 2);

      const { fetchAozoraContext } = await import('./aozora');
      const aozoraContext = await fetchAozoraContext(currentChar.name);
      
      let contextPieces = [spiritSharedKnowledge, aozoraContext];
      if (globalTrends && globalTrends.summary) {
        contextPieces.push(`【現在の広場の流行/ユーザーの思考】: ${globalTrends.summary}`);
      }
      const combinedContext = contextPieces.filter(Boolean).join('\n\n');

      await generateCharacterResponseStream(
        currentChar,
        userMsg,
        isUnderground,
        combinedContext,
        geminiKey,
        interactionDepth, // Pass depth
        (chunk, meta) => {
          finalAiResp = chunk;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], content: chunk, meta };
            return next;
          });
        }
      );

      // 自律増殖の評価（ストリーム完了後）
      if (messages.length % 3 === 0) {
        import('./gemini').then(async ({ evaluateExpansion }) => {
          const expansion = await evaluateExpansion(userMsg + " " + finalAiResp, geminiKey);
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

      // Trends評価
      if (activeSlot === 2) {
        const critique = await evaluateFutureSelf(bookmarks, geminiKey);
        setFutureSelfCritique(critique);
      }

      // ステータスの動的変化
      setCharacters(prev => prev.map(c => {
        if (c.id !== selectedCharId) return c;

        const newStatus = { ...c.status };
        if (c.id === 'soseki') newStatus['胃痛レベル'] = (newStatus['胃痛レベル'] || 0) + 1;
        if (c.id === 'dosto') newStatus['借金額'] = (parseInt(newStatus['借金額']) + 1000) + 'ルーブル';
        if (c.id === 'k_kokoro') newStatus['絶望度'] = 'より深く';
        if (c.id === 'raicho') newStatus['内なる光'] = 'より眩く';
        if (c.id === 'fumiko') newStatus['自己の強度'] = '鋼の如く';

        return { ...c, status: newStatus };
      }));

    } catch (e) {
      console.error("Chat Interaction Error:", e);
    }

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
  
  const handleTalkTo = (charId) => {
    handleToggleChar(charId); // Toggle selection
    handleSlotChange(1); // Dialog Slot
    setIsDrawerOpen(false);
    setEnlargedCharId(null);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: window.innerWidth * 1, behavior: 'smooth' });
    }, 100);
  };

  // Memoize ManagerContent to prevent unnecessary re-renders when parent state (like input or messages) changes
  const MemoizedManagerContent = React.useMemo(() => (
    <div className="space-y-12">
      {/* Tabs for Manager */}
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5 mb-8">
        {[
          { id: 'directory', icon: <User size={14} />, label: 'Registry', color: '#98a436' },
          { id: 'map', icon: <Globe size={14} />, label: 'Map', color: '#fdb913' },
          { id: 'connect', icon: <Cpu size={14} />, label: 'Connect', color: '#f15a24' },
        ].map(tab => {
          const isActive = activeManagerTab === tab.id;
          const bgColor = isActive ? tab.color : 'rgba(255,255,255,0.03)';
          const textColor = isActive ? '#000' : 'rgba(255,255,255,0.3)';
          const shadow = isActive ? `0 4px 15px ${tab.color}44` : 'none';
          const border = isActive ? 'border-white/20' : 'border-transparent';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveManagerTab(tab.id)}
              style={{
                backgroundColor: bgColor,
                color: textColor,
                boxShadow: shadow
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-500 active:scale-95 cursor-pointer font-oswald border ${border}`}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
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
            <CubeMap 
              locations={locations} 
              selectedLocationId={selectedLocationId} 
              onSelectLocation={setSelectedLocationId} 
              locationEnergies={locationEnergies}
            />
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
              const isSelected = selectedCharIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleToggleChar(c.id)}
                  className={`w-full group text-left flex items-start gap-4 md:gap-6 p-4 md:p-6 rounded-[35px] transition-all duration-300 border active:scale-[0.98] ${isSelected ? 'bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)] translate-x-2' : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 cursor-pointer'}`}
                >
                  <div onClick={(e) => { e.stopPropagation(); setEnlargedCharId(c.id); }} className="cursor-zoom-in">
                    <WarholAvatar src={c.avatar} colorClass={c.color} isSelected={isSelected} size="w-12 h-12 md:w-16 h-16" isPreStyled={c.isPreStyled} />
                  </div>
                  <div className="flex-1 space-y-1 md:space-y-2 py-0.5 md:py-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className={`text-sm md:text-base font-bold tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-white/30'}`}>{c.name}</span>
                        <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#bd8a78]/40 text-white shadow-[0_0_10px_rgba(189,138,120,0.5)]' : 'bg-white/5 text-white/10'}`}>{c.flavor}</span>
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
            className="p-8 rounded-[40px] bg-white/5 border border-white/10 space-y-8"
          >
            <div className="flex items-center gap-4 p-8 bg-[#f15a24]/5 border border-[#f15a24]/10 rounded-3xl">
              <div className={`w-3 h-3 rounded-full ${geminiKey ? 'bg-[#f15a24] animate-pulse shadow-[0_0_15px_rgba(241,90,36,0.8)]' : 'bg-white/10'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#f15a24]/80 tracking-widest uppercase mb-1 font-oswald">
                  {geminiKey ? `Verified Connection (${geminiKey.split(',').filter(k=>k.trim()).length} Keys)` : 'Awaiting Connection'}
                </span>
                <p className="text-[9px] text-white/20 leading-relaxed font-serif">
                  {geminiKey ? '精神の回路は正常に接続されています。複数の鍵による並行接続が有効です。' : '対話を開始するにはAPIキーが必要です。カンマ区切りで複数指定可能。'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                placeholder="Enter Gemini API Keys (comma separated)..."
                value={geminiKey}
                onChange={(e) => {
                  setGeminiKey(e.target.value);
                  localStorage.setItem('itako_gemini_key', e.target.value);
                }}
                className="w-full bg-black/60 border border-white/30 rounded-2xl p-4 text-white text-[10px] focus:ring-1 ring-[#f15a24]/50 outline-none transition-all placeholder:text-white/10 font-mono resize-none min-h-[80px]"
              />
              <button
                onClick={async () => {
                  if (geminiKey && !isValidatingApi) {
                    setIsValidatingApi(true);
                    setApiConnectionStatus('idle');
                    const isValid = await validateGeminiApiKey(geminiKey);
                    if (isValid) {
                      setApiConnectionStatus('success');
                      setIsAppReady(true);
                      fetchFictionalizedNews(geminiKey).then(setNews);
                      setTimeout(() => setIsDrawerOpen(false), 500);
                    } else {
                      setApiConnectionStatus('error');
                    }
                    setIsValidatingApi(false);
                  }
                }}
                disabled={isValidatingApi}
                className={`w-full py-4 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 font-oswald ${apiConnectionStatus === 'success'
                  ? 'bg-[#f15a24] text-white shadow-[0_0_20px_rgba(241,90,36,0.6)]'
                  : geminiKey && !isValidatingApi ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20'
                  }`}
              >
                {isValidatingApi ? 'Validating...' : apiConnectionStatus === 'error' ? 'Retry Connection' : '接続する (Connect)'}
              </button>
              {apiConnectionStatus === 'error' && (
                <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest text-center animate-pulse">
                  Invalid API Key or Limit Exceeded.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ), [activeManagerTab, locations, selectedLocationId, locationEnergies, characters, selectedCharId, geminiKey, isValidatingApi, apiConnectionStatus]);

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== activeSlot) {
      handleSlotChange(index);
    }
  };


  const handleLoginComplete = React.useCallback((key) => {
    if (key) {
      setGeminiKey(key);
      localStorage.setItem('itako_gemini_key', key);
    }
    setIsAppReady(true);
  }, [setGeminiKey, setIsAppReady]);

  if (!isAppReady || !user) {
    return (
      <LandingPage
        user={user}
        onLoginComplete={handleLoginComplete}
      />
    );
  }

  return (
    <div
      className="h-[100dvh] w-full overflow-hidden flex flex-col font-sans selection:bg-white/30 transition-all duration-1000"
      style={{
        backgroundColor: locations.find(l => l.id === selectedLocationId)?.color || '#000000',
        backgroundImage: locations.find(l => l.id === selectedLocationId)?.pattern || 'none',
        backgroundSize: '40px 40px',
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
              transition={{ duration: 0.4 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden cursor-pointer"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-black/40 backdrop-blur-3xl border-r border-white/10 z-[70] px-6 pt-safe pb-safe sm:px-8 overflow-y-auto md:hidden shadow-[40px_0_80px_rgba(0,0,0,0.9)] itako-scrollbar"
            >
              <div className="flex items-center justify-between mt-6 mb-10 border-b border-white/5 pb-6">
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-black tracking-tighter text-white font-oswald uppercase">Manager</span>
                  <span className="text-[7px] sm:text-[8px] font-bold tracking-[0.4em] text-white/30 uppercase mt-0.5">Control Center</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-12 h-12 -mr-2 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90 touch-manipulation"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="pb-32">
                {MemoizedManagerContent}
              </div>

              {/* Status footer with safe area padding */}
              <div className="fixed bottom-0 left-0 w-[85%] max-w-sm px-6 pb-safe pt-24 sm:px-8 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none flex flex-col justify-end">
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-lg pointer-events-auto mb-6">
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
        activeSlot={activeSlot}
        onSlotClick={(id) => scrollRef.current?.scrollTo({ left: window.innerWidth * id, behavior: 'smooth' })}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm max-h-[90vh] bg-zinc-900 border border-white/10 p-8 rounded-[40px] z-[120] shadow-3xl overflow-y-auto itako-scrollbar"
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
                    <div className={`w-1.5 h-1.5 rounded-full ${geminiKey ? 'bg-[#f15a24] shadow-[0_0_10px_rgba(241,90,36,0.5)]' : 'bg-white/10'}`} />
                  </div>
                  <input
                    type="password"
                    placeholder="Enter API Key..."
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      localStorage.setItem('itako_gemini_key', e.target.value);
                    }}
                    className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white text-[10px] focus:ring-1 ring-[#f15a24]/30 outline-none transition-all placeholder:text-white/5 font-mono"
                  />
                  <button
                    onClick={async () => {
                      if (geminiKey && !isValidatingApi) {
                        setIsValidatingApi(true);
                        setApiConnectionStatus('idle');
                        const isValid = await validateGeminiApiKey(geminiKey);
                        if (isValid) {
                          setApiConnectionStatus('success');
                          setIsAppReady(true);
                          setTimeout(() => setShowSettings(false), 500);
                        } else {
                          setApiConnectionStatus('error');
                        }
                        setIsValidatingApi(false);
                      }
                    }}
                    disabled={isValidatingApi}
                    className={`w-full py-4 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-500 font-oswald ${apiConnectionStatus === 'success'
                      ? 'bg-[#f15a24] text-white shadow-[0_0_20px_rgba(241,90,36,0.6)]'
                      : geminiKey && !isValidatingApi ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20'
                      }`}
                  >
                    {isValidatingApi ? 'Validating...' : apiConnectionStatus === 'error' ? 'Retry Connection' : '接続する (Connect)'}
                  </button>
                  {apiConnectionStatus === 'error' && (
                    <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest text-center animate-pulse">
                      Connection Failed.
                    </p>
                  )}
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
                {characters.map(c => {
                  const isSelected = selectedCharIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleToggleChar(c.id)}
                      className={`w-[320px] flex items-center gap-4 p-2 rounded-2xl border transition-all duration-300 active:scale-95 ${isSelected ? 'bg-white/10 border-white/40 shadow-lg translate-x-1' : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 cursor-pointer'}`}
                    >
                      <WarholAvatar src={c.avatar} size="w-8 h-8 md:w-10 h-10" isSelected={isSelected} colorClass={c.color} isPreStyled={c.isPreStyled} />
                      <span className={`text-xs font-bold tracking-wide whitespace-nowrap transition-colors ${isSelected ? 'text-white' : 'text-white/40'}`}>{c.name}</span>
                    </button>
                  );
                })}
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
                    const energy = loc ? (locationEnergies[loc.id] || 0) : 0;
                    const intensity = Math.min(energy / 100, 1);

                    return (
                      <button
                        key={i}
                        onClick={() => loc && setSelectedLocationId(loc.id)}
                        className={`aspect-square flex flex-col items-center justify-center relative rounded transition-all duration-300 active:scale-95 overflow-hidden group/loc ${isSelected ? 'bg-zinc-200 cursor-default shadow-sm' : 'bg-black/40 hover:bg-white/10 cursor-pointer'}`}
                      >
                        {loc && energy > 0 && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `radial-gradient(circle, rgba(241, 90, 36, ${intensity * 0.4}) 0%, transparent 70%)`,
                            }}
                          />
                        )}
                        {loc && (
                          <>
                            <MapPin
                              size={isSelected ? 14 : 12}
                              className={`z-10 ${isSelected ? 'text-black' : 'text-white/20 group-hover/loc:text-white/60'}`}
                              style={!isSelected && energy > 0 ? { filter: `drop-shadow(0 0 ${intensity * 8}px #f15a24)` } : {}}
                            />
                            <span className={`absolute bottom-0.5 text-[6px] font-bold tracking-tighter uppercase z-10 transition-opacity duration-300 ${isSelected ? 'text-black/60' : 'text-white/20 opacity-0 group-hover/loc:opacity-100'}`}>
                              {loc.name}
                            </span>
                          </>
                        )}
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
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none font-oswald uppercase">News</h2>
                <p className="text-sm md:text-base font-bold text-[#bd8a78] pl-1 tracking-[0.3em] uppercase font-oswald">ニュース</p>
              </header>

              <div className="flex items-center justify-between mb-8 md:mb-12 px-2 border-b border-white/5 pb-4">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] font-oswald">DRIPPING NOISE ({news.length})</span>
                <span className="text-[10px] font-bold text-white/40 hover:text-white cursor-pointer transition-all tracking-widest uppercase font-oswald">Resonate</span>
              </div>

              {news.map(n => {
                return (
                  <div key={n.id} className="mb-12">
                    <SpiritCard
                      title={n.title}
                      content={n.content}
                      author="Soseki Natsume"
                      portraitUrl="assets/soseki_warhol.png"
                      isPreStyled={true}
                      flavor="Narrator"
                      colorClass="bg-white/5 text-inherit border-white/10"
                    />
                    {n.meta && (
                      <div className="flex justify-end pr-4 -mt-2 mb-2 relative z-30">
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full" title="Generated by">
                          {n.meta.model}
                        </span>
                      </div>
                    )}
                    {/* Discussion Thread for News */}
                    <div className="space-y-[-2rem] mt-[-2rem] relative z-20">
                      {n.discussion && n.discussion.map((d, dIdx) => {
                        const char = characters.find(c => c.id === d.charId);
                        return (
                          <motion.div
                            key={`${n.id}-${dIdx}`}
                            initial={{ opacity: 0, x: dIdx % 2 === 0 ? 20 : -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: dIdx * 0.2 }}
                            className={`flex ${dIdx % 2 === 0 ? 'justify-end' : 'justify-start'} w-full`}
                          >
                            <div className={`p-6 md:p-8 rounded-[35px] border shadow-2xl max-w-[85%] ${dIdx % 2 === 0 ? 'bg-zinc-900/90 border-white/10' : 'bg-black/80 border-white/5'}`}>
                              <div className="flex items-center gap-3 mb-3">
                                {char && <WarholAvatar src={char.avatar} size="w-6 h-6" isSelected isPreStyled={char.isPreStyled} colorClass={char.color} />}
                                <span className="text-[9px] font-bold tracking-[0.3em] text-white/40 uppercase">{char?.name || d.charId}</span>
                              </div>
                              <p className="text-sm md:text-base leading-relaxed text-white/90 font-serif italic">「{d.comment}」</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Slot 2: Main Dialog */}
          <section className="timeline-slot p-6 md:p-12 overflow-y-auto transition-all duration-1000 bg-black">
            <div className="max-w-2xl mx-auto min-h-full flex flex-col">
              <header className="flex flex-col gap-2 mb-6 md:mb-8 px-2 md:px-4">
                {/* 世界事変の降り注ぐテキスト演出 */}
                <AnimatePresence>
                  {currentWorldEvent && (
                    <motion.div
                      initial={{ opacity: 0, scale: 1.1, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className={`mb-6 p-4 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3 transition-colors duration-1000 ${
                        currentWorldEvent.type === 'war' ? 'bg-red-950/40 text-red-100' :
                        currentWorldEvent.type === 'earthquake' ? 'bg-amber-950/40 text-amber-100' :
                        'bg-white/5 text-white/50'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
                         currentWorldEvent.type === 'war' ? 'bg-red-500' :
                         currentWorldEvent.type === 'earthquake' ? 'bg-amber-500' :
                         'bg-white/30'
                      }`} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[8px] font-black tracking-[0.2em] uppercase opacity-40 mb-1">Anomaly Log / 歴史の震動</span>
                        <span className="text-xs md:text-sm font-medium tracking-wider">{currentWorldEvent.content}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between">
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none font-oswald uppercase">Dialog</h2>
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
                          initial={{ opacity: 0, y: 30, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", damping: 20, stiffness: 100 }}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`group relative p-6 md:p-8 rounded-[35px] transition-all duration-500 max-w-[95%] md:max-w-[85%] ${isUser
                            ? 'bg-gradient-to-br from-zinc-900 to-black text-white border border-white/10 rounded-tr-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]'
                            : 'bg-gradient-to-br from-black to-zinc-900/50 text-white border border-white/5 rounded-tl-none'
                            }`}>
                            {!isUser && (
                              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                                <div className="flex items-center gap-3">
                                  {charObj && <WarholAvatar src={charObj.avatar} colorClass={charObj.color} size="w-6 h-6" isSelected isPreStyled={charObj.isPreStyled} />}
                                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30">{charObj?.name || m.charId}</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  {m.meta && (
                                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full" title="Active Core & Key">
                                      {m.meta.model} {m.meta.keyIndex !== '-' && `[K${m.meta.keyIndex}]`}
                                    </span>
                                  )}
                                  <button onClick={() => handleBookmark(i)} className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/30 hover:text-[#bd8a78] transition-colors cursor-pointer">
                                    Archive
                                  </button>
                                </div>
                              </div>
                            )}
                            <p className={`text-base md:text-lg leading-relaxed text-white/70 group-hover:text-white/90 transition-colors duration-500 ${!isUser ? 'font-serif' : 'font-sans'}`}>
                              {m.content}
                            </p>

                            {/* Subtle Ambient Glow */}
                            {!isUser && (
                              <div className="absolute -inset-[1px] rounded-[35px] bg-gradient-to-br from-white/5 to-transparent -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            )}
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
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none font-oswald uppercase">Trends</h2>
                  <button
                    onClick={() => setShowNotebookModal(true)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-[#bd8a78] uppercase hover:bg-white/10 transition-all"
                  >
                    /sync-notebooklm
                  </button>
                </div>
                <p className="text-sm md:text-base font-bold text-[#bd8a78] pl-1 tracking-[0.3em] uppercase font-oswald">イタコプラザでの流行</p>
              </header>

              <div className="space-y-12">
                {globalTrends ? (
                  <div className="group relative bg-[#111]/80 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl overflow-hidden hover:bg-[#1a1a1a]/90 hover:border-white/20 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#bd8a78]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <Cpu size={16} className="text-[#bd8a78]" />
                        <span className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">Synchronized Thought</span>
                      </div>
                      <p className="text-xl md:text-2xl font-serif text-white/90 leading-relaxed mb-6">
                        {globalTrends.summary}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {globalTrends.keywords.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/50 border border-white/5">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 border border-white/5 border-dashed rounded-3xl">
                    <p className="text-white/30 text-sm font-bold tracking-widest">NO ACTIVE TRENDS</p>
                    <p className="text-white/20 text-xs mt-2">/sync-notebooklm からあなたの思考を同期してください</p>
                  </div>
                )}
                
                {/* 従来の累積知識表示 */}
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

        {/* NotebookLM Sync Modal */}
        <AnimatePresence>
          {showNotebookModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative"
              >
                <button
                  onClick={() => setShowNotebookModal(false)}
                  className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="text-2xl font-bold font-oswald uppercase tracking-wider text-white mb-2 flex items-center gap-3">
                  <Cpu size={24} className="text-[#bd8a78]" />
                  Sync Thought
                </h3>
                <p className="text-sm text-white/50 mb-6 leading-relaxed">
                  NotebookLM のテキストや、現在のあなたの思考の断片をペーストしてください。
                  抽出された文脈は「流行の重力」として広場全体に感染し、ゴーストたちの対話に影響を与えます。
                </p>
                <textarea
                  value={notebookInput}
                  onChange={(e) => setNotebookInput(e.target.value)}
                  placeholder="思考の断片を入力..."
                  className="w-full h-40 bg-black border border-white/30 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#bd8a78] transition-colors mb-6 resize-none itako-scrollbar shadow-inner"
                />
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowNotebookModal(false)}
                    className="px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSyncNotebook}
                    disabled={syncingNotebook || !notebookInput.trim()}
                    className="px-6 py-3 bg-white text-black rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#bd8a78] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {syncingNotebook ? <Loader2 size={14} className="animate-spin" /> : null}
                    {syncingNotebook ? 'Syncing...' : 'Inject'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Floating Input Bar (UI/UX Pro Max) */}
        <div className="fixed bottom-10 left-0 right-0 p-4 z-[100] pointer-events-none pb-safe">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-xl mx-auto flex items-center gap-4 bg-black/90 backdrop-blur-3xl border border-white/30 p-2 pl-6 rounded-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9)] pointer-events-auto transition-all duration-700 hover:border-white/50 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,1)] focus-within:border-[#bd8a78] group"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="深淵へ言葉を記す..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              className="flex-1 bg-transparent border-none focus:outline-none text-white/80 text-sm md:text-base py-4 resize-none h-14 leading-relaxed placeholder:text-white/5 font-sans itako-scrollbar"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="w-12 h-12 rounded-full bg-white hover:bg-[#bd8a78] hover:text-white text-black flex items-center justify-center transition-all duration-500 active:scale-90 disabled:opacity-5 shadow-inner group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden relative cursor-pointer"
            >
              <div className="relative z-10 font-oswald font-black text-xl">+</div>
              {/* Subtle button effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </motion.div>
        </div>
        
        {/* Character Enlargement Overlay */}
        <AnimatePresence>
          {enlargedCharId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEnlargedCharId(null)}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] cursor-zoom-out"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 40 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg z-[310] pointer-events-none"
              >
                {(() => {
                  const c = characters.find(char => char.id === enlargedCharId);
                  if (!c) return null;
                  return (
                    <div className="bg-zinc-900/50 border border-white/10 rounded-[50px] overflow-hidden shadow-3xl pointer-events-auto">
                      <div className="aspect-square w-full relative">
                        <motion.img 
                          layoutId={`avatar-${c.id}`}
                          src={c.avatar} 
                          alt={c.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <button 
                          onClick={() => setEnlargedCharId(null)}
                          className="absolute top-8 right-8 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"
                        >
                          <X size={24} />
                        </button>
                      </div>
                      <div className="p-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-oswald">{c.name}</h2>
                            <span className="text-[10px] font-bold text-itako-clay tracking-[0.4em] uppercase">{c.flavor}</span>
                          </div>
                          <button
                            onClick={() => handleTalkTo(c.id)}
                            className="bg-white text-black px-8 py-4 rounded-full font-bold tracking-[0.2em] uppercase hover:bg-itako-clay hover:text-white transition-all active:scale-95 shadow-xl font-oswald text-sm"
                          >
                            話しかける
                          </button>
                        </div>
                        <p className="text-base text-white/50 leading-relaxed font-serif italic">
                          {c.description}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
