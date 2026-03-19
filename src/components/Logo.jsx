import React from 'react';
import { motion } from 'framer-motion';

const LetterA = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <path d="M12 2L2 22H22L12 2Z" fill={color} />
    <circle cx="12" cy="14" r="3" fill="black" />
  </svg>
);

const LetterK = ({ color }) => (
  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <rect x="2" y="2" width="3" height="20" fill={color} />
    <path d="M5 12L16 2M5 12L16 22" stroke={color} strokeWidth="3.5" />
  </svg>
);

const LetterI = ({ color }) => (
  <svg width="8" height="24" viewBox="0 0 8 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <rect x="2" y="2" width="4" height="20" fill={color} />
  </svg>
);

const LetterT = ({ color }) => (
  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <rect x="2" y="2" width="16" height="3" fill={color} />
    <rect x="8.5" y="2" width="3" height="20" fill={color} />
  </svg>
);

const LetterO = ({ color }) => (
  <svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <circle cx="11" cy="12" r="9" stroke={color} strokeWidth="3" />
  </svg>
);

const LetterP = ({ color }) => (
  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <rect x="2" y="2" width="3" height="20" fill={color} />
    <path d="M5 3.5C5 3.5 16 3.5 16 8.5C16 13.5 5 13.5 5 13.5" stroke={color} strokeWidth="3" fill="none" />
  </svg>
);

const LetterL = ({ color }) => (
  <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <rect x="2" y="2" width="3" height="20" fill={color} />
    <rect x="2" y="19" width="14" height="3" fill={color} />
  </svg>
);

const LetterZ = ({ color }) => (
  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <path d="M3 3H17L3 21H17" stroke={color} strokeWidth="3" fill="none" />
  </svg>
);

export default function Logo({ apiStatus = 'idle' }) {
    const isActive = apiStatus === 'success';
    const logoColor = isActive ? '#00f0ff' : '#63e9ff';
    
    return (
        <div className="flex items-center gap-4 select-none group cursor-pointer py-2 transform hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-end gap-1 sm:gap-1.5 opacity-90 group-hover:opacity-100 transition-all duration-500">
                {/* ITAKO */}
                <div className="flex items-center gap-1 drop-shadow-[0_0_8px_rgba(99,233,255,0.4)]">
                    <LetterI color={logoColor} />
                    <LetterT color={logoColor} />
                    <LetterA color={logoColor} />
                    <LetterK color={logoColor} />
                    <LetterO color={logoColor} />
                </div>
                
                {/* Space */}
                <div className="w-2 md:w-3" />
                
                {/* PLAZA */}
                <div className="flex items-center gap-1 drop-shadow-[0_0_8px_rgba(99,233,255,0.4)]">
                    <LetterP color={logoColor} />
                    <LetterL color={logoColor} />
                    <LetterA color={logoColor} />
                    <LetterZ color={logoColor} />
                    <LetterA color={logoColor} />
                </div>

                <div className="ml-1 text-[8px] font-black self-start text-[#63e9ff]/60 tracking-tighter">TM</div>
            </div>

            {/* Sub-text explicitly bright blue */}
            <div className="hidden xl:flex flex-col border-l border-[#63e9ff]/20 pl-4 ml-2">
                <span className="text-[7px] tracking-[0.4em] uppercase font-bold text-[#63e9ff]/50 group-hover:text-[#63e9ff] transition-all duration-700">
                    The Monolith Gate
                </span>
                <span className="text-[6px] text-[#63e9ff]/20 tracking-[0.2em] font-oswald uppercase">Spectral Matrix Active</span>
            </div>
        </div>
    );
}
