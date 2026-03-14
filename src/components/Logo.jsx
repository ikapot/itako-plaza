import React from 'react';
import { motion } from 'framer-motion';

export default function Logo() {
    return (
        <div className="flex items-center gap-4 select-none group cursor-pointer">
            {/* Elite Monolith Image Icon */}
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-md bg-zinc-950 border border-white/10 group-hover:border-itako-clay/40 transition-all duration-700 shadow-2xl relative">
                <motion.img
                    src="assets/logo_p.png"
                    alt="ITAKO"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 scale-110 group-hover:scale-100 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Minimalist Typography */}
            <div className="flex flex-col">
                <span className="text-[12px] font-black tracking-[0.6em] text-white/90 uppercase transition-colors group-hover:text-white font-oswald">
                    ITAKO PLAZA
                </span>
                <span className="text-[7px] text-white/30 tracking-[0.4em] uppercase font-bold group-hover:text-white/50 transition-colors">
                    The Monolith Gate
                </span>
            </div>
        </div>
    );
}
