import React from 'react';
import { motion } from 'framer-motion';
import SpiritCard from '../SpiritCard';
import WarholAvatar from '../WarholAvatar';

const NewsItem = React.memo(function NewsItem({ n, charMap }) {
    return (
        <div className="mb-12">
            <SpiritCard
                title={n.title}
                content={n.content}
                author="Soseki Natsume"
                portraitUrl="assets/soseki_warhol.png"
                isPreStyled={true}
                flavor="Narrator"
                colorClass="bg-[#EAE0D5] text-black"
            />
            <div className="space-y-[-2rem] mt-[-2rem] relative z-20">
                {n.discussion ? n.discussion.map(function renderComment(d, dIdx) {
                    const char = charMap[d.charId];
                    return (
                        <motion.div
                            key={`${n.id}-${dIdx}`}
                            initial={{ opacity: 0, x: dIdx % 2 === 0 ? 20 : -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className={`flex ${dIdx % 2 === 0 ? 'justify-end' : 'justify-start'} w-full`}
                        >
                            <div className={`p-4 md:p-8 rounded-none border-2 border-black max-w-[90%] md:max-w-[85%] bg-black/80 text-[#EAE0D5]`}>
                                <div className="flex items-center gap-3 mb-3">
                                    {char ? <WarholAvatar src={char.avatar} size="w-6 h-6" isSelected isPreStyled={char.isPreStyled} colorClass={char.color} /> : null}
                                    <span className="text-[9px] font-black tracking-[0.3em] text-[#f15a24] uppercase">{char?.name || d.charId}</span>
                                </div>
                                <p className="text-sm md:text-base leading-relaxed font-serif italic">「{d.comment}」</p>
                            </div>
                        </motion.div>
                    );
                }) : null}
            </div>
        </div>
    );
});

export default NewsItem;
