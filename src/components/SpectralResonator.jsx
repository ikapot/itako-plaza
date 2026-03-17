import React from 'react';
import { motion } from 'framer-motion';

/**
 * SpectralResonator (Spectral Node / Vacuum Tube)
 * Visualizes the connection status of an API slot.
 * status: 'idle' | 'validating' | 'success' | 'error'
 */
const SpectralResonator = ({ status, delay = 0 }) => {
    const isActive = status === 'success';
    const isValidating = status === 'validating';
    const isError = status === 'error';

    return (
        <div className="relative w-12 h-20 flex flex-col items-center justify-center">
            {/* Tube Glass Container */}
            <div className={`relative w-8 h-16 rounded-t-full border border-white/20 overflow-hidden transition-all duration-700
                            ${isActive ? 'bg-[#f15a24]/10 border-[#f15a24]/40 shadow-[0_0_20px_rgba(241,90,36,0.3)]' : 
                              isError ? 'bg-red-950/20 border-red-500/40' : 
                              isValidating ? 'bg-amber-900/10 border-amber-500/40' : 'bg-white/5'}`}>
                
                {/* Internal Filament */}
                <motion.div 
                    animate={{ 
                        opacity: isActive ? [0.6, 1, 0.6] : isValidating ? [0.2, 0.5, 0.2] : 0.1,
                        background: isActive ? '#f15a24' : isError ? '#ef4444' : isValidating ? '#fdb913' : '#ffffff'
                    }}
                    transition={{ 
                        duration: isActive ? 2 : isValidating ? 0.5 : 2, 
                        repeat: Infinity,
                        delay 
                    }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[2px] h-10 rounded-full blur-[1px]"
                    style={{ 
                        boxShadow: isActive ? '0 0 10px #f15a24, 0 0 20px #f15a24' : 
                                   isError ? '0 0 10px #ef4444' : 
                                   isValidating ? '0 0 10px #fdb913' : 'none'
                    }}
                />

                {/* Spectral Gas / Glow Inside */}
                {isActive && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        className="absolute inset-0 bg-gradient-to-t from-[#f15a24] to-transparent blur-md"
                    />
                )}

                {/* Reflection on Glass */}
                <div className="absolute top-2 left-2 w-2 h-6 bg-white/10 rounded-full blur-[1px]" />
            </div>

            {/* Base of the Tube */}
            <div className="w-10 h-3 bg-zinc-800 rounded-sm border-t border-white/10 shadow-xl" />
            
            {/* Status Indicator Dot at bottom */}
            <div className={`mt-2 w-1.5 h-1.5 rounded-full transition-all duration-500
                            ${isActive ? 'bg-[#f15a24] shadow-[0_0_8px_#f15a24]' : 
                              isError ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 
                              isValidating ? 'bg-amber-500 animate-pulse' : 'bg-white/10'}`} />
        </div>
    );
};

export default SpectralResonator;
