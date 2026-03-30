import { useState, useRef, useCallback, useEffect } from 'react';
import { streamSpiritualDialogue, detectSpiritIntervention, distillSpiritualAlaya } from '../gemini';
import { searchNDLArchive } from '../ndl';
import { INITIAL_CHARACTERS } from '../constants';
import { saveAlayaToFirestore } from '../firebase';

const APP_CHARACTERS = INITIAL_CHARACTERS;

export function useSpiritualDialogue(geminiKey, user, spiritSharedKnowledge, globalTrends, currentWorldEvent, daysRemaining, setArchives, setGlobalSentiment, alaya, setAlaya) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('itako_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, content, charId }
  const [spiritualError, setSpiritualError] = useState(null);

  // Persist messages whenever they change
  useEffect(() => {
    localStorage.setItem('itako_messages', JSON.stringify(messages));
  }, [messages]);

  // --- Alaya (Dialogue Summary) Auto-Update ---
  useEffect(() => {
    async function updateAlaya() {
      // 30メッセージごとに要約を更新（API節約）
      const effectiveKey = user ? 'PROXY_MODE' : geminiKey;
      if (messages.length > 0 && messages.length % 30 === 0 && effectiveKey && effectiveKey !== '') {
        const summary = await distillSpiritualAlaya(messages, effectiveKey);
        if (summary) {
          setAlaya(summary);
          localStorage.setItem('itako_alaya', summary);
          if (user) {
            await saveAlayaToFirestore(summary);
          }
        }
      }
    }
    updateAlaya();
  }, [messages.length, geminiKey, user, setAlaya]);

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

  const buildDialogueOptions = useCallback((charId, isUnderground, selectedCharIds) => {
    const context = [
      spiritSharedKnowledge,
      globalTrends?.summary ? `【トレンド】: ${globalTrends.summary}` : ''
    ].filter(Boolean).join('\n\n');

    // トークン節約のため、直近のメッセージのみを抽出
    const recentMessages = messages
      .filter(m => m.charId === charId || m.role === 'user')
      .slice(-10); // 直近10件のみ

    const interactionDepth = Math.min(Math.floor(recentMessages.length / 2), 2);
    const others = APP_CHARACTERS.filter(c => selectedCharIds.includes(c.id) && c.id !== charId);

    return {
      isUnderground,
      externalContext: context,
      interactionDepth,
      others,
      alaya,
      currentWorldEvent,
      daysRemaining,
      historicalContext: recentMessages
    };
  }, [spiritSharedKnowledge, globalTrends, messages, alaya, currentWorldEvent, daysRemaining]);

  const lastSentRef = useRef({ time: 0, content: '' });

  const handleSendMessage = useCallback(async ({
    textOverride = null, 
    charIdOverride = null, 
    isUnderground = false, 
    selectedCharIds = [],
    onAutoSlotChange
  }) => {
    const userMsg = textOverride || input;
    const now = Date.now();

    if (!userMsg.trim() || loading) return;
    if (userMsg === lastSentRef.current.content && now - lastSentRef.current.time < 5000) {
      console.warn("Duplicate message blocked.");
      return;
    }

    lastSentRef.current = { time: now, content: userMsg };

    const effectiveKey = geminiKey || 'PROXY_MODE';
    const charId = charIdOverride || selectedCharIds[0];
    const currentChar = APP_CHARACTERS.find(c => c.id === charId);

    setLoading(true);
    setInput('');
    setReplyTo(null);
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: userMsg },
      { role: 'ai', content: '', charId }
    ]);

    if (userMsg.length > 10) {
      searchNDLArchive(userMsg).then(res => {
        if (res?.length) setArchives(prev => [...res, ...prev].slice(0, 5));
      });
    }

    try {
      const options = buildDialogueOptions(charId, isUnderground, selectedCharIds);
      const apiAccessKey = user ? 'PROXY_MODE' : geminiKey;

      await streamSpiritualDialogue({
        character: currentChar,
        message: userMsg,
        apiKey: apiAccessKey,
        options,
        onChunk: (chunk, meta) => {
          updateDialogueInMessages(charId, chunk, meta.sentiment);
          if (meta.sentiment) {
            setGlobalSentiment(meta.sentiment);
          }
        }
      });
    
      const intervention = await detectSpiritIntervention(userMsg, apiAccessKey === 'PROXY_MODE' ? null : apiAccessKey);
      if (intervention && intervention.charId !== charId) {
        const extraChar = APP_CHARACTERS.find(c => c.id === intervention.charId);
        if (extraChar) {
          setTimeout(async () => {
            setMessages(prev => [...prev, { role: 'ai', content: `[${intervention.reason}] `, charId: extraChar.id, sentiment: 'neutral' }]);
            
            await streamSpiritualDialogue({
              character: extraChar,
              message: userMsg,
              apiKey: apiAccessKey,
              options: buildDialogueOptions(extraChar.id, isUnderground, selectedCharIds),
              onChunk: (chunk, meta) => updateDialogueInMessages(extraChar.id, chunk, meta.sentiment)
            });
          }, 1500);
        }
      }

      onAutoSlotChange?.(1);
    } catch (error) {
      console.error("Spiritual Dialogue Break:", error);
      setSpiritualError(error);
    } finally {
      setLoading(false);
    }
  }, [input, loading, geminiKey, user, buildDialogueOptions, updateDialogueInMessages, setArchives, setGlobalSentiment]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    replyTo,
    setReplyTo,
    alaya,
    setAlaya,
    spiritualError,
    setSpiritualError,
    handleSendMessage
  };
}
