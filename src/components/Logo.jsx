import React from 'react';
import { motion } from 'framer-motion';

export default function Logo() {
    return (
        <div className="flex items-center gap-4 select-none group">
            {/* Generated Logo Concept Image */}
            <div className="relative w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-[#0b0b0b] border border-orange-500/10 group-hover:border-itako-orange/30 transition-all shadow-lg">
                <motion.img
                    src="/assets/logo.png"
                    alt="ITAKO PLAZA Logo"
                    className="w-full h-full object-cover scale-110 opacity-90 group-hover:scale-125 transition-transform duration-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9 }}
                />
                {/* Pulsing overlay for spirit effect */}
                <motion.div
                    animate={{
                        opacity: [0, 0.4, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-itako-orange/5 mix-blend-screen"
                />
            </div>

            {/* Typography */}
            <div className="flex flex-col leading-tight font-sans">
                <span className="text-xl font-bold tracking-[0.25em] text-itako-grey/90">
                    ITAKO
                </span>
                <span className="text-[8px] font-bold tracking-[0.6em] text-itako-orange uppercase opacity-80 mt-0.5">
                    The Spirit Plaza
                </span>
            </div>
        </div>
    );
}
