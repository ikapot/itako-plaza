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
                whileHover={{ scale: 1.01 }}
                className="max-w-xl mx-auto flex items-center gap-3 glass-spectral p-2 pl-6 rounded-full pointer-events-auto transition-all duration-1000 group"
            >
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="深淵へ言葉を記す..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    className="flex-1 bg-transparent border-none focus:outline-none text-white/90 text-sm md:text-base py-4 resize-none h-14 leading-relaxed placeholder:text-white/10 font-sans tracking-wide"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    className={`
                        px-6 h-12 rounded-full border flex items-center gap-3 transition-all duration-500 active:scale-95 disabled:opacity-20 disabled:grayscale overflow-hidden relative group/send
                        ${input.trim() 
                            ? 'bg-[#f15a24] border-[#f15a24]/50 text-white shadow-[0_0_20px_rgba(241,90,36,0.3)]' 
                            : 'bg-white/5 border-white/10 text-white/30'}
                    `}
                >
                    {input.trim() && (
                        <motion.div 
                            layoutId="btn-glow"
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                            animate={{ x: ['-200%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                    <span className="font-oswald font-black text-[10px] tracking-[0.2em] relative z-10">
                        {loading ? 'SYNCING...' : 'MANIFEST'}
                    </span>
                    <div className="relative z-10 text-lg transition-transform group-hover/send:translate-x-1">→</div>
                </button>
            </motion.div>
        </div>
    );
});

FloatingInputBar.displayName = 'FloatingInputBar';
export default FloatingInputBar;
