import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Repeat } from 'lucide-react';

const MessageItem = React.memo(function MessageItem({ m, i, isUser, charObj, handleBookmark, handleReply }) {
    if (charObj?.id === 'narrator' || m.charId === 'narrator') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full text-center py-6 md:py-10 px-4 my-2"
            >
                <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
                    <div className="w-12 h-[1px] bg-[#bd8a78]/30" />
                    <p className="text-sm md:text-base leading-relaxed text-[#bd8a78]/90 font-serif italic tracking-[0.2em] whitespace-pre-wrap py-2">
                        {m.content.replace(/^\[narration\]\s*/i, '').replace(/^【ナレーション】\s*/i, '')}
                    </p>
                    <div className="w-12 h-[1px] bg-[#bd8a78]/30" />
                </div>
            </motion.div>
        );
    }
    return (
        <motion.div
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2 message-item`}
        >
            {/* Minimal Header */}
            {(!isUser && charObj) ? (
                <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-black text-[#f15a24] uppercase tracking-widest">{charObj.name}</span>
                    <span className="text-[8px] text-[#EAE0D5]/20 uppercase tracking-widest">/ {charObj.role || 'SPECTER'}</span>
                </div>
            ) : null}

            <div className={`relative p-4 md:p-6 octagon transition-all duration-300 max-w-[90%] md:max-w-[80%] ${
                isUser 
                    ? 'bg-[#f15a24] text-black font-black text-sm md:text-base selection:bg-black selection:text-[#f15a24] border-on-orange' 
                    : 'bg-[#EAE0D5]/10 text-[#EAE0D5] border-on-black font-serif italic text-sm md:text-base selection:bg-[#f15a24] selection:text-black'
            }`}>
                {/* Sentiment Tag */}
                {(!isUser && m.sentiment) ? (
                    <div className="absolute -top-3 left-4 px-2 py-0.5 bg-black border border-black text-[7px] font-black uppercase tracking-tighter text-[#f15a24]/60">
                        ESTIMATED_STATE: {m.sentiment}
                    </div>
                ) : null}

                <p className="leading-relaxed whitespace-pre-wrap">
                    {m.content}
                </p>

                {/* Interaction Buttons (Subtle - only visible on hover or mobile) */}
                <div className={`mt-4 pt-3 border-t divider-on-orange flex items-center gap-4 opacity-40 hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <motion.button 
                        onClick={() => handleBookmark?.(m)} 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 hover:text-amber-500 transition-colors duration-200 cursor-pointer"
                    >
                        <Bookmark size={10} />
                        <span className="text-[7px] font-black uppercase tracking-tighter">Bookmark</span>
                    </motion.button>
                    {!isUser && (
                        <motion.button 
                            onClick={() => handleReply?.(m)} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 hover:text-[#f15a24] transition-colors duration-200 cursor-pointer"
                        >
                            <Repeat size={10} />
                            <span className="text-[7px] font-black uppercase tracking-tighter">Echo / Reply</span>
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

export default MessageItem;
