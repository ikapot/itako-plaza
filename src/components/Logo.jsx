import React from 'react';
import { motion } from 'framer-motion';

export default function Logo() {
    return (
        <div className="flex items-center gap-3 select-none">
            {/* Abstract Spirit Symbol */}
            <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Core - The soul/consciousness */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-2.5 h-2.5 bg-itako-orange rounded-full shadow-[0_0_12px_rgba(255,140,0,0.6)]"
                />

                {/* Boundary 1 - Outer ring representing the threshold */}
                <motion.div
                    animate={{
                        rotate: 360,
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute inset-0 border-[0.5px] border-orange-500/20 rounded-full"
                />

                {/* Boundary 2 - Moving fragments of connection */}
                <motion.div
                    animate={{
                        rotate: -360,
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute inset-1 border-[0.5px] border-dashed border-orange-300/10 rounded-full"
                />
            </div>

            {/* Typography */}
            <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold tracking-[0.2em] text-itako-grey/90 font-sans translate-y-0.5">
                    ITAKO
                </span>
                <span className="text-[7px] font-bold tracking-[0.5em] text-itako-orange uppercase ml-0.5">
                    The Spirit Plaza
                </span>
            </div>
        </div>
    );
}
