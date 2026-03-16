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
                    className="w-12 h-12 rounded-full border border-white/10 hover:border-white/40 hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center transition-all duration-700 active:scale-95 disabled:opacity-5 overflow-hidden relative"
                >
                    <div className="relative z-10 font-oswald font-extralight text-2xl">+</div>
                </button>
            </motion.div>
        </div>
    );
});

FloatingInputBar.displayName = 'FloatingInputBar';
export default FloatingInputBar;
