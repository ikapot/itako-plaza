import React from 'react';
import { motion } from 'framer-motion';

export default function Logo({ apiStatus = 'idle' }) {
    const isActive = apiStatus === 'success';
    
    return (
        <div className="flex items-center gap-4 select-none group cursor-pointer">
            {/* Elite Monolith Image Icon */}
            <div className={`w-10 h-10 flex items-center justify-center overflow-hidden rounded-md bg-zinc-950 border transition-all duration-700 shadow-2xl relative
                            ${isActive ? 'border-[#f15a24]/50 shadow-[0_0_20px_rgba(241,90,36,0.5)]' : 'border-white/10 group-hover:border-itako-clay/40'}`}>
                <motion.img
                    src="assets/logo_p.png"
                    alt="ITAKO"
                    animate={isActive ? { 
                        filter: ["contrast(1) brightness(1)", "contrast(1.2) brightness(1.5)", "contrast(1) brightness(1)"],
                        scale: [1.1, 1.15, 1.1]
                    } : {}}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 scale-110 group-hover:scale-100 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Minimalist Typography */}
            <div className="flex flex-col">
                <span className={`text-[12px] font-black tracking-[0.6em] uppercase transition-all duration-700 font-oswald
                                ${isActive ? 'text-[#f15a24] drop-shadow-[0_0_10px_rgba(241,90,36,0.5)]' : 'text-white/90 group-hover:text-white'}`}>
                    ITAKO PLAZA
                </span>
                <span className={`text-[7px] tracking-[0.4em] uppercase font-bold transition-all duration-700
                                ${isActive ? 'text-white/60' : 'text-white/30 group-hover:text-white/50'}`}>
                    The Monolith Gate
                </span>
            </div>
        </div>
    );
}
