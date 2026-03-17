import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const CharacterOverlay = React.memo(({
    enlargedCharId,
    setEnlargedCharId,
    characters,
    handleTalkTo,
}) => {
    const c = useMemo(() => characters.find(char => char.id === enlargedCharId), [characters, enlargedCharId]);

    return (
        <AnimatePresence>
            {enlargedCharId && c ? (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEnlargedCharId(null)}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] cursor-zoom-out"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 40 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg z-[310] pointer-events-none"
                    >
                        <div className="bg-zinc-900/50 border border-white/10 rounded-[50px] overflow-hidden shadow-3xl pointer-events-auto">
                            <div className="aspect-square w-full relative">
                                <motion.img 
                                    layoutId={`avatar-${c.id}`}
                                    src={c.avatar} 
                                    alt={c.name} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                <button 
                                    onClick={() => setEnlargedCharId(null)}
                                    className="absolute top-8 right-8 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-oswald">{c.name}</h2>
                                        <span className="text-[10px] font-bold text-itako-clay tracking-[0.4em] uppercase">{c.flavor}</span>
                                    </div>
                                    <button
                                        onClick={() => handleTalkTo(c.id)}
                                        className="bg-white text-black px-8 py-4 rounded-full font-bold tracking-[0.2em] uppercase hover:bg-itako-clay hover:text-white transition-all active:scale-95 shadow-xl font-oswald text-sm"
                                    >
                                        話しかける
                                    </button>
                                </div>
                                <p className="text-base text-white/50 leading-relaxed font-serif italic text-left">
                                    {c.description}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
});

CharacterOverlay.displayName = 'CharacterOverlay';
export default CharacterOverlay;
