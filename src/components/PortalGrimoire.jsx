import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, Cpu, ShieldCheck, CheckCircle2, Key, RefreshCw } from 'lucide-react';

/**
 * PortalGrimoire.jsx
 * OpenRouter専用のシングルキー・システムへのシンプルリデザイン版
 */
export default function PortalGrimoire({ 
    geminiKey, 
    setGeminiKey, 
    isValidatingApi, 
    apiConnectionStatus, 
    handleValidateApi
}) {
    const [localKey, setLocalKey] = useState(geminiKey || '');
    const [isEditing, setIsEditing] = useState(!geminiKey);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (geminiKey && geminiKey !== localKey) {
            setLocalKey(geminiKey);
            setIsEditing(false);
        }
    }, [geminiKey]);

    async function handleHoneKey() {
        if (!localKey.startsWith('sk-or-') && localKey !== 'PROXY_MODE') {
            setErrorMessage('OpenRouter API Key (sk-or-...) または PROXY_MODE を入力してください');
            return;
        }
        setErrorMessage('');
        setGeminiKey(localKey);
        setIsEditing(false);
        handleValidateApi(localKey);
    }

    return (
        <div className="flex flex-col items-center gap-12 w-full py-8">
            {/* The Abyssal Key Visual */}
            <div className="relative group">
                <motion.div 
                    animate={{ 
                        rotateZ: isValidatingApi ? [0, 360] : 0,
                        scale: isValidatingApi ? [1, 1.05, 1] : 1
                    }}
                    transition={{ 
                        rotateZ: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                    }}
                    className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-white/10 flex items-center justify-center relative bg-black/40 backdrop-blur-xl shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                >
                    <div className="absolute inset-2 border border-white/5 rounded-full" />
                    <Key size={48} className={`transition-colors duration-1000 ${apiConnectionStatus === 'success' ? 'text-emerald-400' : 'text-white/20'}`} />
                    
                    {/* Floating Particles */}
                    {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ 
                                opacity: [0, 0.5, 0],
                                scale: [0, 1, 0],
                                x: [0, Math.cos(i * 30) * 80],
                                y: [0, Math.sin(i * 30) * 80]
                            }}
                            transition={{ duration: 4, delay: i * 0.3, repeat: Infinity }}
                            className="absolute w-1 h-1 bg-[#f15a24] rounded-full blur-[1px]"
                        />
                    ))}
                </motion.div>
                
                {apiConnectionStatus === 'success' ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-emerald-500 text-black p-2 rounded-full shadow-lg">
                        <CheckCircle2 size={16} />
                    </motion.div>
                ) : null}
            </div>

            {/* Input Section */}
            <div className="w-full max-w-md space-y-6">
                {!isEditing && geminiKey ? (
                    <div className="space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setIsEditing(true)}
                            className="w-full p-6 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between group transition-all"
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[8px] font-black tracking-[0.3em] uppercase text-white/20">Frequency Established</span>
                                <span className="text-xs font-mono text-white/60 tracking-widest">
                                    {geminiKey === 'PROXY_MODE' ? '🟢 GHOST PROXY ACTIVE' : `${geminiKey.substring(0, 15)}•••••`}
                                </span>
                            </div>
                            <RefreshCw size={16} className="text-white/20 group-hover:rotate-180 transition-transform duration-700" />
                        </motion.button>
                        
                        <div className="flex justify-center">
                             <button 
                                onClick={() => { setGeminiKey(''); setLocalKey(''); setIsEditing(true); }}
                                className="text-[8px] font-bold text-white/10 hover:text-red-400 transition-colors uppercase tracking-[0.3em]"
                            >
                                / Break Connection
                            </button>
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="relative">
                            <input
                                autoFocus
                                type="password"
                                value={localKey}
                                onChange={(e) => setLocalKey(e.target.value)}
                                placeholder="sk-or-v1-..."
                                className="w-full bg-black/60 border border-white/20 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-[#f15a24]/50 transition-all font-mono"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleHoneKey();
                                }}
                            />
                            <button 
                                onClick={handleHoneKey}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-[#f15a24] uppercase border-b border-[#f15a24]/30 pb-0.5 hover:text-white transition-colors"
                            >
                                定着させる
                            </button>
                        </div>
                        {errorMessage ? (
                            <p className="flex items-center gap-2 text-[10px] text-red-400 font-bold uppercase tracking-wider pl-2">
                                <AlertCircle size={12} /> {errorMessage}
                            </p>
                        ) : (
                            <p className="text-[9px] text-white/20 font-serif italic text-center">
                                「深淵への鍵を入力し、回路を固定してください」
                            </p>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Validation Feedback */}
            {isValidatingApi && (
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase animate-pulse">
                    <RefreshCw size={12} className="animate-spin" /> 回路の同期中...
                </div>
            )}

            {/* Connection Guide Section */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-2xl border-t border-white/5 pt-12 mt-12 space-y-8"
            >
                <h3 className="text-sm font-black text-[#f15a24] tracking-[0.3em] uppercase font-oswald text-center">
                    霊的接続の手引き / Connection Guide
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] leading-relaxed">
                    <div className="space-y-4">
                        <h4 className="text-white/60 font-bold uppercase tracking-widest border-l-2 border-[#f15a24] pl-3">1. 鍵（API KEY）の入手</h4>
                        <p className="text-white/40 font-serif">
                            対話を司る知能として<strong>OpenRouter</strong>を使用します。
                            <a href="https://openrouter.ai/settings/credits" target="_blank" className="text-[#f15a24] underline ml-1">こちら</a>でクレジットをチャージし、
                            `sk-or-v1-...` で始まる鍵を生成してください。
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-white/60 font-bold uppercase tracking-widest border-l-2 border-[#f15a24] pl-3">2. 回路の固定</h4>
                        <p className="text-white/40 font-serif">
                            上記の入力欄に鍵を貼り付け、「定着させる」を押してください。
                            一度固定されると、ブラウザに安全に保存されます。
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-white/60 font-bold uppercase tracking-widest border-l-2 border-[#f15a24] pl-3">3. ローカルでの実行</h4>
                        <p className="text-white/40 font-serif">
                            自分のPCで動かす場合は、ターミナルでまずプロジェクト階層へ移動してください：<br/>
                            <code className="block bg-black/50 p-2 mt-2 text-[#f15a24] rounded-sm font-mono">cd C:\Users\ikapo\Desktop\itako</code>
                            その後、<code className="text-white/60">npm run dev</code> を実行します。
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-white/60 font-bold uppercase tracking-widest border-l-2 border-[#f15a24] pl-3">4. 接続エラー (402)</h4>
                        <p className="text-white/40 font-serif">
                            「エネルギー枯渇」エラーが出る場合は、OpenRouterの残高が不足している可能性があります。
                            クレジットを補充し、数分待ってからお試しください。
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
