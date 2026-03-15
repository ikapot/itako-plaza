import React from 'react';
import { motion } from 'framer-motion';

const FloatingInputBar = React.memo(({
    input,
    setInput,
    handleSendMessage,
    loading,
}) => {
    return (
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
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>
            </motion.div>
        </div>
    );
});

FloatingInputBar.displayName = 'FloatingInputBar';
export default FloatingInputBar;
