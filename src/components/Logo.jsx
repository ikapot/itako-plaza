import React from 'react';
import { motion } from 'framer-motion';

export default function Logo() {
    return (
        <div className="flex items-center gap-3 select-none group cursor-pointer">
            {/* Ultra-minimalist Image Icon */}
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-full bg-zinc-950 border border-white/5 group-hover:border-itako-orange/40 transition-all duration-700 shadow-2xl space-x-2">
                <motion.img
                    src="assets/logo.png"
                    alt="ITAKO"
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 scale-125 transition-all duration-1000"
                />
            </div>

            {/* Minimalist Typography */}
            <span className="text-[11px] font-bold tracking-[0.5em] text-white/80 uppercase transition-colors group-hover:text-white">
                ITAKO PLAZA
            </span>
        </div>
    );
}
