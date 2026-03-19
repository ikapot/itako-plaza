import React from 'react';
import { motion } from 'framer-motion';
import WarholAvatar from './WarholAvatar';

export default function SpiritCard({ title, content, author, portraitUrl, flavor, colorClass = "bg-white/5 border border-white/10", isPreStyled = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`relative p-6 md:p-8 rounded-none ${colorClass} mb-4 border-2 border-black group transition-all duration-300 ease-out`}
    >
      <div className="relative z-10 flex flex-col gap-6 text-inherit">
        {author ? (
          <div className="flex items-center justify-between border-b border-black/20 pb-3">
            <div className="flex items-center gap-3">
              <WarholAvatar src={portraitUrl || 'assets/soseki_warhol.png'} size="w-8 h-8" isSelected isPreStyled={isPreStyled || !portraitUrl} />
              <span className="text-[10px] font-black tracking-[0.2em] text-[#f15a24] uppercase">{author}</span>
              {flavor ? <span className="text-[10px] font-bold bg-black/5 px-3 py-1 rounded-none text-black/40 border border-black/10">{flavor}</span> : null}
            </div>
          </div>
        ) : null}
        <div className="space-y-4">
          <h3 className="text-2xl md:text-4xl font-black tracking-tighter leading-[1.1] py-1 pr-12 text-black font-oswald uppercase">{title}</h3>
          <p className="text-sm md:text-lg leading-relaxed text-black font-medium whitespace-pre-wrap font-biz-mincho">{content}</p>
        </div>

        <div className="flex justify-end mt-4">
          <button className="bg-black hover:bg-[#f15a24] active:scale-95 text-[#EAE0D5] px-6 py-2 rounded-none text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 transition-all border-2 border-black cursor-pointer shadow-none">
            DISCOVER <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
