import React from 'react';
import { motion } from 'framer-motion';
import WarholAvatar from './WarholAvatar';

const SpiritCard = ({ title, content, author, portraitUrl, flavor, timestamp, colorClass = "bg-white/5 border border-white/10" }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className={`relative p-8 md:p-10 rounded-[40px] ${colorClass} mb-4 shadow-sm group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl`}
    >
        <div className="relative z-10 flex flex-col gap-6 text-inherit">
            {author && (
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <WarholAvatar src={portraitUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Natsume_Souseki.jpg/330px-Natsume_Souseki.jpg'} size="w-8 h-8" isSelected />
                        <span className="text-[10px] font-bold tracking-[0.2em] opacity-40 uppercase">{author}</span>
                        {flavor && <span className="text-[10px] font-bold bg-white/5 px-3 py-1 rounded-full opacity-30">{flavor}</span>}
                    </div>
                </div>
            )}
            <div className="space-y-3 md:space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-tight pr-12 opacity-90">{title}</h3>
                <p className="text-sm md:text-base leading-relaxed opacity-60 font-medium whitespace-pre-wrap">{content}</p>
            </div>

            <div className="flex justify-end mt-4">
                <button className="bg-white/10 hover:bg-white/20 active:scale-95 text-inherit px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg border border-white/5 cursor-pointer disabled:opacity-50">
                    DISCOVER <span className="text-lg">→</span>
                </button>
            </div>
        </div>
    </motion.div>
);

export default SpiritCard;
