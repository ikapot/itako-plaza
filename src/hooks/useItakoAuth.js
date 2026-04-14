import { useState, useEffect, useCallback } from 'react';
import { auth, loginWithGoogle, fetchBookmarks, fetchNotebookAccumulations, logout, fetchAlayaFromFirestore, saveBookmark, isConfigValid } from '../firebase';

export function useItakoAuth() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('無名の参列者');
  const [firstVisitDate, setFirstVisitDate] = useState(() => {
    return localStorage.getItem('itako_first_visit') || null;
  });
  const [daysRemaining, setDaysRemaining] = useState(3650);
  const [bookmarks, setBookmarks] = useState([]);
  const [spiritSharedKnowledge, setSpiritSharedKnowledge] = useState('');
  const [isAppReady, setIsAppReady] = useState(false);
  const [alaya, setAlaya] = useState(() => localStorage.getItem('itako_alaya') || "");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserName(currentUser.displayName || '彷徨える魂');
        
        // 初回ログイン日の処理
        const now = Date.now();
        let firstDate = localStorage.getItem('itako_first_visit');
        if (!firstDate) {
            firstDate = now.toString();
            localStorage.setItem('itako_first_visit', firstDate);
        }
        setFirstVisitDate(firstDate);

        // 残り日数の計算（10年 = 3650日）
        const diffMs = now - parseInt(firstDate);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, 3650 - diffDays));

        let savedBookMarks = [];
        let data = [];
        let cloudAlaya = null;

        try {
          const results = await Promise.allSettled([
            fetchBookmarks(), 
            fetchNotebookAccumulations(),
            fetchAlayaFromFirestore()
          ]);
          if (results[0].status === 'fulfilled') savedBookMarks = results[0].value;
          if (results[1].status === 'fulfilled') data = results[1].value;
          if (results[2].status === 'fulfilled') cloudAlaya = results[2].value;
        } catch (err) {
          console.error('Firebase Initial Fetch Error:', err);
        }
        
        // --- データマージ処理 ---
        // 1. ブックマークのマージ
        try {
          const localBookmarks = JSON.parse(localStorage.getItem('itako_bookmarks') || '[]');
          if (localBookmarks.length > 0 && savedBookMarks.length === 0) {
              // ローカルにはあるがクラウドにない場合、移行を促すか自動移行する
              for (const bm of localBookmarks) {
                  await saveBookmark(bm.userMsg, bm.aiMsg, bm.charId).catch(() => {});
              }
              const updatedBookmarks = await fetchBookmarks().catch(() => []);
              setBookmarks(updatedBookmarks);
          } else {
              setBookmarks(savedBookMarks);
          }
        } catch (e) {
          setBookmarks(savedBookMarks);
        }

        // 2. 名前の同期
        const localName = localStorage.getItem('itako_user_name');
        if (localName && localName !== '彷徨える魂' && !currentUser.displayName) {
            setUserName(localName);
        }

        // 3. Alaya の同期
        setSpiritSharedKnowledge(data.map(acc => acc.content).join('\n---\n'));
        if (cloudAlaya) {
          setAlaya(cloudAlaya);
          localStorage.setItem('itako_alaya', cloudAlaya);
        } else {
          // クラウドにない場合、ローカルの Alaya をアップロード
          const localAlaya = localStorage.getItem('itako_alaya');
          if (localAlaya && isConfigValid) {
            try {
              await saveAlayaToFirestore(localAlaya);
              setAlaya(localAlaya);
            } catch (e) {}
          }
        }
        setIsAppReady(true);
      } else {
         setIsAppReady(true);
      }
    });

    return () => unsubscribe();
  }, [isConfigValid]);

  const handleSetName = useCallback((newName) => {
      setUserName(newName);
      localStorage.setItem('itako_user_name', newName);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    setBookmarks([]);
    setAlaya("");
    setIsAppReady(false);
  }, []);

  const handleAddBookmark = useCallback(async (msg, index, allMessages) => {
    if (!msg || msg.role === 'user') return;
    
    // Find the previous user message for context
    let userMsg = "";
    for(let k = index - 1; k >= 0; k--) {
      if (allMessages[k].role === 'user') {
        userMsg = allMessages[k].content;
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
  }, [user]);

  return {
    user,
    userName,
    setUserName,
    firstVisitDate,
    daysRemaining,
    bookmarks,
    setBookmarks,
    spiritSharedKnowledge,
    setSpiritSharedKnowledge,
    isAppReady,
    setIsAppReady,
    handleSetName,
    handleLogout,
    loginWithGoogle,
    alaya,
    setAlaya,
    handleAddBookmark
  };
}
