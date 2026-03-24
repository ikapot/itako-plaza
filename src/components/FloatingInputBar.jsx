import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CornerDownRight } from 'lucide-react';

const FloatingInputBar = React.memo(({
    input,
    setInput,
    handleSendMessage,
    loading,
    replyTo,
    onCancelReply
}) => {
    return (
        <div className="fixed bottom-2 md:bottom-10 left-0 right-0 p-1.5 md:p-4 z-[100] pointer-events-none pb-safe">
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="max-w-xl mx-auto mb-1.5 glass-spectral p-2 px-4 md:p-3 md:px-6 octagon pointer-events-auto flex items-center justify-between gap-2 md:gap-4"
                    >
                        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                            <CornerDownRight size={12} className="text-[#f15a24] shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[7px] md:text-[8px] font-black text-[#f15a24] uppercase tracking-widest">{replyTo.charId}へ返信</span>
                                <p className="text-[10px] md:text-[11px] text-white/60 truncate italic">"{replyTo.content}"</p>
                            </div>
                        </div>
                        <button 
                            onClick={onCancelReply}
                            className="p-1 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all shrink-0"
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`max-w-xl mx-auto flex items-center gap-2 md:gap-3 glass-spectral p-1 md:p-2 pl-3 md:pl-6 octagon pointer-events-auto transition-all duration-1000 group ${replyTo ? '' : ''}`}
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
                    className="flex-1 bg-transparent border-none focus:outline-none text-white/90 text-sm md:text-base py-1.5 md:py-4 resize-none h-9 md:h-14 leading-relaxed placeholder:text-white/10 font-biz-mincho tracking-wide"
                />
                <button
                    onClick={() => handleSendMessage()}
                    disabled={loading || !input.trim()}
                    className={`
                        px-3 md:px-6 h-9 md:h-12 octagon flex items-center gap-2 md:gap-3 transition-all duration-500 active:scale-95 disabled:opacity-20 disabled:grayscale overflow-hidden relative group/send shrink-0
                        ${input.trim() 
                            ? 'bg-[#f15a24] text-white shadow-[0_0_20px_rgba(241,90,36,0.3)]' 
                            : 'bg-white/5 text-white/30'}
                    `}
                >
                    {input.trim() ? (
                        <motion.div 
                            layoutId="btn-glow"
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                            animate={{ x: ['-200%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    ) : null}
                    <span className="font-biz-mincho font-bold text-[9px] md:text-[10px] tracking-[0.2em] relative z-10 hidden sm:inline">
                        {loading ? '探求中...' : '宣明'}
                    </span>
                    <div className="relative z-10 text-sm md:text-lg transition-transform group-hover/send:translate-x-1">→</div>
                </button>
            </motion.div>
        </div>
    );
});

FloatingInputBar.displayName = 'FloatingInputBar';
export default FloatingInputBar;
