import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, LogIn } from 'lucide-react';
import Logo from './Logo';
import { loginWithGoogle } from '../firebase';
import { validateGeminiApiKey } from '../gemini';

export default function LandingPage({ onLoginComplete, user }) {
    const [step, setStep] = useState('landing'); // 'landing', 'auth', 'api'
    const [tempKey, setTempKey] = useState(localStorage.getItem('itako_gemini_key') || '');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [error, setError] = useState('');

    // 既にGoogleログイン済みの場合は自動で次のステップへ
    useEffect(() => {
        if (user && step === 'landing') {
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            const localKey = localStorage.getItem('itako_gemini_key');
            const keyToUse = envKey || localKey;

            if (keyToUse) {
                onLoginComplete(keyToUse);
            } else {
                setStep('api'); // キーがない場合のみ入力画面へ
            }
        }
    }, [user, step, onLoginComplete]);

    const handleGoogleLogin = async () => {
        const u = await loginWithGoogle();
        if (u) {
            // useEffect が prop の user 変更を検知して自動で進むが、
            // 即時反映のためにここでもロジックを追加（任意）
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            const localKey = localStorage.getItem('itako_gemini_key');
            const keyToUse = envKey || localKey;

            if (keyToUse) {
                onLoginComplete(keyToUse);
            } else {
                setStep('api');
            }
        }
    };

    const handleApiConnect = async () => {
        setIsConnecting(true);
        setError('');
        const isValid = await validateGeminiApiKey(tempKey);

        if (isValid) {
            setIsValidated(true);
            setTimeout(() => {
                localStorage.setItem('itako_gemini_key', tempKey);
                onLoginComplete(tempKey);
                setIsConnecting(false);
            }, 800);
        } else {
            setIsConnecting(false);
            setError('無効なAPIキーです。精神の接続に失敗しました。');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0b0b0b] flex items-center justify-center p-6 font-sans">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                {/* Left Side: Large Logo (Inspired by X's large branding) */}
                <div className="flex justify-center md:justify-end">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="scale-[2.5] md:scale-[4]"
                    >
                        <Logo />
                    </motion.div>
                </div>

                {/* Right Side: Auth UI */}
                <div className="flex flex-col gap-8 text-white max-w-sm mx-auto md:mx-0">
                    <AnimatePresence mode="wait">
                        {step === 'landing' && (
                            <motion.div
                                key="landing"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                                    すべての魂が、<br />ここに集う。
                                </h2>
                                <p className="text-lg text-itako-grey/60 font-medium">参加するにはログインしてください。</p>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleGoogleLogin}
                                        className="w-full bg-white text-black py-3 px-6 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all text-sm"
                                    >
                                        <LogIn size={18} />
                                        Googleアカウントでログイン
                                    </button>

                                    <div className="flex items-center gap-3 py-2">
                                        <div className="h-[1px] flex-1 bg-zinc-800"></div>
                                        <span className="text-xs text-zinc-500 font-bold">OR</span>
                                        <div className="h-[1px] flex-1 bg-zinc-800"></div>
                                    </div>

                                    <button
                                        onClick={() => setStep('api')}
                                        className="w-full border border-zinc-700 text-zinc-300 py-3 px-6 rounded-full font-bold hover:bg-zinc-900 transition-all text-sm"
                                    >
                                        アカウントを作成
                                    </button>
                                </div>
                                <p className="text-[10px] text-zinc-600 leading-relaxed">
                                    ログインすることで、利用規約およびプライバシーポリシーに同意したものとみなされます。ここは生者と死者が交差する場所です。
                                </p>
                            </motion.div>
                        )}

                        {step === 'api' && (
                            <motion.div
                                key="api"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-8"
                            >
                                <h2 className="text-3xl font-bold tracking-tighter text-white/90">
                                    口寄せの準備。
                                </h2>
                                <div className="space-y-4">
                                    <p className="text-sm text-zinc-500">
                                        対話を開始するには、あなたの Gemini API Key が必要です。
                                    </p>
                                    <div className="space-y-2">
                                        <input
                                            type="password"
                                            placeholder="Gemini API Key..."
                                            value={tempKey}
                                            onChange={(e) => setTempKey(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 text-sm mb-4"
                                        />
                                        <button
                                            onClick={handleApiConnect}
                                            disabled={!tempKey || isConnecting}
                                            className={`w-full py-4 rounded-full font-bold transition-all duration-500 disabled:opacity-50 ${isValidated
                                                ? 'bg-[#f15a24] text-white shadow-[0_0_20px_rgba(241,90,36,0.6)]'
                                                : tempKey && !isConnecting ? 'bg-zinc-100 text-black' : 'bg-zinc-200 text-black'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {isConnecting ? (
                                                    <>
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 1 }}
                                                            className="w-2 h-2 rounded-full bg-white"
                                                        />
                                                        <span>接続中...</span>
                                                    </>
                                                ) : (
                                                    <span>接続する (Connect)</span>
                                                )}
                                            </div>
                                        </button>
                                        {error && (
                                            <p className="text-[10px] text-red-500 font-bold text-center animate-bounce">
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
