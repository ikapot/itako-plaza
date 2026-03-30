import { useState, useCallback, useEffect } from 'react';
import { fetchFictionalizedNews } from '../news';
import { extractTrendsFromNews, generateWorldEvent } from '../gemini';
import { searchNDLArchive } from '../ndl';

export function useWorldState(geminiKey) {
  const [news, setNews] = useState([]);
  const [globalTrends, setGlobalTrends] = useState(() => {
    const cached = localStorage.getItem('itako_global_trends');
    return cached ? JSON.parse(cached) : null;
  });
  const [globalSentiment, setGlobalSentiment] = useState('neutral');
  const [currentWorldEvent, setCurrentWorldEvent] = useState(null);
  const [isEventShaking, setIsEventShaking] = useState(false);
  const [archives, setArchives] = useState([]);

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

  const manualRefreshSpiritWorld = useCallback(async (key, loading, currentTrends) => {
    if (!key || loading) return;
    
    try {
      // Phase 1: Refresh News
      const newsData = await fetchFictionalizedNews(key);
      setNews(newsData);
      
      // Phase 2: Update Spiritual Trends
      const trends = await extractTrendsFromNews(newsData, key).catch(() => null);
      if (trends) {
        setGlobalTrends(trends);
        localStorage.setItem('itako_global_trends', JSON.stringify(trends));
      }

      // Phase 3: Manifest Global Anomaly
      const event = await generateWorldEvent(key, trends || currentTrends).catch(() => null);
      if (event) {
        processWorldEvent(event);
      }
    } catch (err) {
      console.error("Spiritual disturbance during refresh:", err);
      throw err; // Let caller handle specialized errors (402, 429)
    }
  }, [processWorldEvent]);

  return {
    news,
    setNews,
    globalTrends,
    setGlobalTrends,
    globalSentiment,
    setGlobalSentiment,
    currentWorldEvent,
    setCurrentWorldEvent,
    isEventShaking,
    setIsEventShaking,
    archives,
    setArchives,
    processWorldEvent,
    manualRefreshSpiritWorld
  };
}
