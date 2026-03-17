import React from 'react';
import { motion } from 'framer-motion';
import WarholAvatar from './WarholAvatar';

export default function SpiritCard({ title, content, author, portraitUrl, flavor, colorClass = "bg-white/5 border border-white/10", isPreStyled = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`relative p-6 md:p-8 rounded-[32px] ${colorClass} mb-4 shadow-sm group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="relative z-10 flex flex-col gap-6 text-inherit">
        {author ? (
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
              <WarholAvatar src={portraitUrl || 'assets/soseki_warhol.png'} size="w-8 h-8" isSelected isPreStyled={isPreStyled || !portraitUrl} />
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">{author}</span>
              {flavor ? <span className="text-[10px] font-bold bg-white/5 px-3 py-1 rounded-full text-white/40">{flavor}</span> : null}
            </div>
          </div>
        ) : null}
        <div className="space-y-4">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-tight pr-12 text-white">{title}</h3>
          <p className="text-sm md:text-base leading-relaxed text-white/85 font-medium whitespace-pre-wrap">{content}</p>
        </div>

        <div className="flex justify-end mt-4">
          <button className="bg-white/10 hover:bg-white/20 active:scale-95 text-inherit px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 transition-all shadow-lg border border-white/5 cursor-pointer">
            DISCOVER <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
